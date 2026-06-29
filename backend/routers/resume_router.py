"""Resume Analysis Router — upload, parse, analyze, generate questions."""

import os
import uuid
import json
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.responses import FileResponse, HTMLResponse
from pydantic import BaseModel
from beanie import PydanticObjectId

from backend.models import User, Resume, ResumeAnalysis, ResumeInterviewQuestion, ResumeOptimization
from backend.auth.dependencies import get_current_user
from backend.schemas import (
    ResumeOut, ResumeAnalysisOut, ResumeAnalysisRequest, ResumeInterviewQuestionOut,
)
from backend.resume_ai_engine import (
    extract_text_from_pdf,
    extract_resume_sections,
    analyze_resume,
    generate_interview_questions,
)
from backend.resume_optimizer import optimize_resume
from backend.resume_pdf_generator import (
    generate_optimized_pdf,
    render_resume_html,
    build_resume_context,
)

router = APIRouter(prefix="/resume", tags=["Resume Analysis"])

# Upload directory
UPLOAD_DIR = Path("uploads/resumes")
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


def _ensure_upload_dir(user_id: str) -> Path:
    """Create user-specific upload directory."""
    user_dir = UPLOAD_DIR / user_id
    user_dir.mkdir(parents=True, exist_ok=True)
    return user_dir


def _serialize_analysis(analysis: ResumeAnalysis) -> dict:
    """Convert a ResumeAnalysis Beanie Document to a dict with parsed JSON fields."""
    def _load_json(val, default=None):
        if val is None:
            return default
        try:
            return json.loads(val)
        except (json.JSONDecodeError, TypeError):
            return default

    return {
        "id": str(analysis.id),
        "resume_id": str(analysis.resume_id),
        "skills": _load_json(analysis.skills, []),
        "education": _load_json(analysis.education, []),
        "experience": _load_json(analysis.experience, []),
        "projects": _load_json(analysis.projects, []),
        "certifications": _load_json(analysis.certifications, []),
        "technologies": _load_json(analysis.technologies, []),
        "achievements": _load_json(analysis.achievements, []),
        "summary_text": analysis.summary_text,
        "overall_score": analysis.overall_score,
        "ats_score": analysis.ats_score,
        "technical_score": analysis.technical_score,
        "project_score": analysis.project_score,
        "communication_score": analysis.communication_score,
        "readability_score": analysis.readability_score,
        "experience_score": analysis.experience_score,
        "confidence_score": analysis.confidence_score,
        "missing_sections": _load_json(analysis.missing_sections, []),
        "weak_areas": _load_json(analysis.weak_areas, []),
        "ats_issues": _load_json(analysis.ats_issues, []),
        "suggestions": _load_json(analysis.suggestions, []),
        "keyword_analysis": _load_json(analysis.keyword_analysis, {}),
        "skill_gap_analysis": _load_json(analysis.skill_gap_analysis, {}),
        "strengths": _load_json(analysis.strengths, []),
        "weaknesses": _load_json(analysis.weaknesses, []),
        "ats_breakdown": _load_json(analysis.ats_breakdown, {}),
        "improvement_roadmap": _load_json(analysis.improvement_roadmap, []),
        "target_role": analysis.target_role,
        "target_company": analysis.target_company,
        "created_at": analysis.created_at.isoformat() if analysis.created_at else None,
    }


# ─── Upload Resume ────────────────────────────────────────────────────────────

@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_resume(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
):
    """Upload a PDF resume."""
    # Validate file type
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Only PDF files are accepted.")
    if file.content_type and file.content_type != "application/pdf":
        raise HTTPException(400, "Only PDF files are accepted.")

    # Read and validate size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(400, f"File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB.")
    if len(content) == 0:
        raise HTTPException(400, "Uploaded file is empty.")

    # Save file
    user_dir = _ensure_upload_dir(str(user.id))
    stored_name = f"{uuid.uuid4().hex}.pdf"
    file_path = user_dir / stored_name
    file_path.write_bytes(content)

    # Calculate version (count existing resumes + 1)
    existing_count = await Resume.find(
        Resume.user_id == str(user.id), Resume.is_active == True
    ).count()

    # Create DB record
    resume = Resume(
        user_id=str(user.id),
        filename=stored_name,
        original_filename=file.filename,
        file_path=str(file_path),
        file_size=len(content),
        version=existing_count + 1,
    )
    await resume.insert()

    return {
        "id": str(resume.id),
        "original_filename": resume.original_filename,
        "file_size": resume.file_size,
        "version": resume.version,
        "created_at": resume.created_at.isoformat() if resume.created_at else None,
        "message": "Resume uploaded successfully.",
    }


# ─── List Resumes ────────────────────────────────────────────────────────────

@router.get("/list")
async def list_resumes(
    user: User = Depends(get_current_user),
):
    """List all resumes for the current user."""
    resumes = await Resume.find(
        Resume.user_id == str(user.id), Resume.is_active == True
    ).sort(-Resume.created_at).to_list()

    result = []
    for r in resumes:
        analysis = await ResumeAnalysis.find(
            ResumeAnalysis.resume_id == str(r.id)
        ).sort(-ResumeAnalysis.created_at).first_or_none()

        result.append({
            "id": str(r.id),
            "original_filename": r.original_filename,
            "file_size": r.file_size,
            "version": r.version,
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "has_analysis": analysis is not None,
            "overall_score": analysis.overall_score if analysis else None,
        })

    return result


# ─── Get Resume Details ──────────────────────────────────────────────────────

@router.get("/{resume_id}")
async def get_resume(
    resume_id: str,
    user: User = Depends(get_current_user),
):
    """Get resume details by ID."""
    try:
        res_obj_id = PydanticObjectId(resume_id)
    except Exception:
        raise HTTPException(400, "Invalid resume_id format")

    resume = await Resume.find_one(
        Resume.id == res_obj_id, Resume.user_id == str(user.id)
    )
    if not resume:
        raise HTTPException(404, "Resume not found.")

    analysis = await ResumeAnalysis.find(
        ResumeAnalysis.resume_id == str(resume.id)
    ).sort(-ResumeAnalysis.created_at).first_or_none()

    return {
        "id": str(resume.id),
        "original_filename": resume.original_filename,
        "file_size": resume.file_size,
        "version": resume.version,
        "created_at": resume.created_at.isoformat() if resume.created_at else None,
        "has_analysis": analysis is not None,
        "overall_score": analysis.overall_score if analysis else None,
    }


# ─── Analyze Resume ─────────────────────────────────────────────────────────

@router.post("/{resume_id}/analyze")
async def analyze_resume_endpoint(
    resume_id: str,
    body: ResumeAnalysisRequest = None,
    user: User = Depends(get_current_user),
):
    """Run AI analysis on a resume — parse, score, and generate feedback."""
    try:
        res_obj_id = PydanticObjectId(resume_id)
    except Exception:
        raise HTTPException(400, "Invalid resume_id format")

    resume = await Resume.find_one(
        Resume.id == res_obj_id, Resume.user_id == str(user.id)
    )
    if not resume:
        raise HTTPException(404, "Resume not found.")

    # 1. Extract text from PDF
    try:
        text = extract_text_from_pdf(resume.file_path)
    except Exception as e:
        raise HTTPException(500, f"Failed to parse PDF: {str(e)}")

    if not text or len(text.strip()) < 20:
        raise HTTPException(400, "Could not extract meaningful text from the PDF. Ensure the PDF contains selectable text (not scanned images).")

    # 2. Extract sections
    parsed = extract_resume_sections(text)

    # 3. Run AI analysis
    target_role = body.target_role if body else None
    target_company = body.target_company if body else None
    analysis_result = await analyze_resume(parsed, target_role, target_company)

    # 4. Save analysis to DB
    analysis = ResumeAnalysis(
        resume_id=str(resume.id),
        user_id=str(user.id),
        skills=json.dumps(parsed.get("skills", [])),
        education=json.dumps(parsed.get("education", [])),
        experience=json.dumps(parsed.get("experience", [])),
        projects=json.dumps(parsed.get("projects", [])),
        certifications=json.dumps(parsed.get("certifications", [])),
        technologies=json.dumps(parsed.get("technologies", [])),
        achievements=json.dumps(parsed.get("achievements", [])),
        summary_text=parsed.get("summary", ""),
        overall_score=analysis_result.get("overall_score", 0),
        ats_score=analysis_result.get("ats_score", 0),
        technical_score=analysis_result.get("technical_score", 0),
        project_score=analysis_result.get("project_score", 0),
        communication_score=analysis_result.get("communication_score", 0),
        readability_score=analysis_result.get("readability_score"),
        experience_score=analysis_result.get("experience_score"),
        confidence_score=analysis_result.get("confidence_score"),
        missing_sections=json.dumps(analysis_result.get("missing_sections", [])),
        weak_areas=json.dumps(analysis_result.get("weak_areas", [])),
        ats_issues=json.dumps(analysis_result.get("ats_issues", [])),
        suggestions=json.dumps(analysis_result.get("suggestions", [])),
        keyword_analysis=json.dumps(analysis_result.get("keyword_analysis", {})),
        skill_gap_analysis=json.dumps(analysis_result.get("skill_gap_analysis", {})),
        strengths=json.dumps(analysis_result.get("strengths", [])),
        weaknesses=json.dumps(analysis_result.get("weaknesses", [])),
        ats_breakdown=json.dumps(analysis_result.get("ats_breakdown", {})),
        improvement_roadmap=json.dumps(analysis_result.get("improvement_roadmap", [])),
        target_role=target_role,
        target_company=target_company,
    )
    await analysis.insert()

    # 5. Generate interview questions
    interview_qs = await generate_interview_questions(parsed, target_role)

    # Delete old questions for this resume, then insert new ones
    await ResumeInterviewQuestion.find(
        ResumeInterviewQuestion.resume_id == str(resume.id),
        ResumeInterviewQuestion.user_id == str(user.id),
    ).delete()

    docs = []
    for q in interview_qs:
        db_q = ResumeInterviewQuestion(
            resume_id=str(resume.id),
            user_id=str(user.id),
            question_text=q.get("question_text", ""),
            category=q.get("category", "technical"),
            difficulty=q.get("difficulty", "medium"),
            source_section=q.get("source_section"),
            source_detail=q.get("source_detail"),
        )
        docs.append(db_q)
    
    if docs:
        await ResumeInterviewQuestion.insert_many(docs)

    return {
        "analysis": _serialize_analysis(analysis),
        "questions_generated": len(interview_qs),
        "message": "Resume analyzed successfully.",
    }


# ─── Get Analysis Results ────────────────────────────────────────────────────

@router.get("/{resume_id}/analysis")
async def get_analysis(
    resume_id: str,
    user: User = Depends(get_current_user),
):
    """Get the latest analysis for a resume."""
    try:
        res_obj_id = PydanticObjectId(resume_id)
    except Exception:
        raise HTTPException(400, "Invalid resume_id format")

    resume = await Resume.find_one(
        Resume.id == res_obj_id, Resume.user_id == str(user.id)
    )
    if not resume:
        raise HTTPException(404, "Resume not found.")

    analysis = await ResumeAnalysis.find(
        ResumeAnalysis.resume_id == str(resume.id)
    ).sort(-ResumeAnalysis.created_at).first_or_none()

    if not analysis:
        raise HTTPException(404, "No analysis found. Please analyze the resume first.")

    return _serialize_analysis(analysis)


# ─── Get Interview Questions ─────────────────────────────────────────────────

@router.get("/{resume_id}/questions")
async def get_questions(
    resume_id: str,
    user: User = Depends(get_current_user),
):
    """Get AI-generated interview questions for a resume."""
    try:
        res_obj_id = PydanticObjectId(resume_id)
    except Exception:
        raise HTTPException(400, "Invalid resume_id format")

    resume = await Resume.find_one(
        Resume.id == res_obj_id, Resume.user_id == str(user.id)
    )
    if not resume:
        raise HTTPException(404, "Resume not found.")

    questions = await ResumeInterviewQuestion.find(
        ResumeInterviewQuestion.resume_id == str(resume.id),
        ResumeInterviewQuestion.user_id == str(user.id),
    ).to_list()

    return [
        {
            "id": str(q.id),
            "question_text": q.question_text,
            "category": q.category,
            "difficulty": q.difficulty,
            "source_section": q.source_section,
            "source_detail": q.source_detail,
        }
        for q in questions
    ]


# ─── Dashboard Analytics ─────────────────────────────────────────────────────

@router.get("/analytics/summary")
async def resume_analytics(
    user: User = Depends(get_current_user),
):
    """Get aggregate resume analytics for the dashboard."""
    resumes = await Resume.find(
        Resume.user_id == str(user.id), Resume.is_active == True
    ).to_list()

    analyses = await ResumeAnalysis.find(
        ResumeAnalysis.user_id == str(user.id)
    ).sort(-ResumeAnalysis.created_at).to_list()

    total_questions = await ResumeInterviewQuestion.find(
        ResumeInterviewQuestion.user_id == str(user.id)
    ).count()

    # Best scores
    best_overall = max((a.overall_score for a in analyses if a.overall_score is not None), default=0)
    scores = [a.overall_score for a in analyses if a.overall_score is not None]
    avg_overall = sum(scores) / len(scores) if scores else 0
    latest_analysis = analyses[0] if analyses else None

    # Score history for trend chart
    score_history = [
        {
            "date": a.created_at.isoformat() if a.created_at else "",
            "overall": a.overall_score,
            "ats": a.ats_score,
            "technical": a.technical_score,
        }
        for a in reversed(analyses[:10])
    ]

    return {
        "total_resumes": len(resumes),
        "total_analyses": len(analyses),
        "total_questions": total_questions,
        "best_score": best_overall,
        "avg_score": round(avg_overall, 1),
        "latest_scores": {
            "overall": latest_analysis.overall_score if latest_analysis else None,
            "ats": latest_analysis.ats_score if latest_analysis else None,
            "technical": latest_analysis.technical_score if latest_analysis else None,
            "project": latest_analysis.project_score if latest_analysis else None,
            "communication": latest_analysis.communication_score if latest_analysis else None,
        } if latest_analysis else None,
        "score_history": score_history,
    }


# ─── Delete Resume ───────────────────────────────────────────────────────────

@router.delete("/{resume_id}")
async def delete_resume(
    resume_id: str,
    user: User = Depends(get_current_user),
):
    """Soft-delete a resume."""
    try:
        res_obj_id = PydanticObjectId(resume_id)
    except Exception:
        raise HTTPException(400, "Invalid resume_id format")

    resume = await Resume.find_one(
        Resume.id == res_obj_id, Resume.user_id == str(user.id)
    )
    if not resume:
        raise HTTPException(404, "Resume not found.")

    resume.is_active = False
    await resume.save()

    return {"message": "Resume deleted successfully."}


# ─── Optimize Resume ─────────────────────────────────────────────────────────

class OptimizeRequest(BaseModel):
    target_company: str
    target_role: str
    template: str = "faang"  # classic | minimal | faang | executive


@router.post("/{resume_id}/optimize")
async def optimize_resume_endpoint(
    resume_id: str,
    body: OptimizeRequest,
    user: User = Depends(get_current_user),
):
    """Run AI-powered company-specific resume optimization."""
    try:
        res_obj_id = PydanticObjectId(resume_id)
    except Exception:
        raise HTTPException(400, "Invalid resume_id format")

    resume = await Resume.find_one(
        Resume.id == res_obj_id, Resume.user_id == str(user.id)
    )
    if not resume:
        raise HTTPException(404, "Resume not found.")

    # Load latest analysis
    analysis = await ResumeAnalysis.find(
        ResumeAnalysis.resume_id == str(resume.id)
    ).sort(-ResumeAnalysis.created_at).first_or_none()
    if not analysis:
        raise HTTPException(400, "Please analyze this resume first before optimizing.")

    # Re-parse resume text for full data
    try:
        text = extract_text_from_pdf(resume.file_path)
        parsed_data = extract_resume_sections(text)
    except Exception as e:
        raise HTTPException(500, f"Failed to re-parse resume: {str(e)}")

    # Convert analysis to dict for the optimizer
    def _j(val, default=None):
        if val is None: return default
        try: return json.loads(val)
        except: return default

    original_analysis_dict = {
        "ats_score": analysis.ats_score or 50,
        "overall_score": analysis.overall_score or 50,
        "technical_score": analysis.technical_score or 50,
        "missing_sections": _j(analysis.missing_sections, []),
        "keyword_analysis": _j(analysis.keyword_analysis, {}),
    }

    # Run Gemini optimization
    try:
        opt_result = await optimize_resume(
            parsed_data=parsed_data,
            target_company=body.target_company,
            target_role=body.target_role,
            original_analysis=original_analysis_dict,
        )
    except Exception as e:
        raise HTTPException(500, f"Optimization failed: {str(e)}")

    # Generate PDF
    pdf_path = None
    try:
        pdf_path = generate_optimized_pdf(
            optimization_data=opt_result,
            original_parsed=parsed_data,
            user_name=user.name or "Candidate",
            template=body.template,
        )
    except Exception as e:
        print(f"[PDF] Generation failed: {e}")

    # Save to DB
    opt_doc = ResumeOptimization(
        resume_id=str(resume.id),
        user_id=str(user.id),
        target_company=body.target_company,
        target_role=body.target_role,
        original_ats_score=opt_result.get("original_ats_score"),
        optimized_ats_score=opt_result.get("optimized_ats_score"),
        original_overall_score=original_analysis_dict["overall_score"],
        optimized_overall_score=opt_result.get("optimized_ats_score"),
        ats_improvement=opt_result.get("ats_improvement"),
        optimized_summary=opt_result.get("optimized_summary", ""),
        optimized_skills=json.dumps(opt_result.get("optimized_skills", [])),
        optimized_projects=json.dumps(opt_result.get("optimized_projects", [])),
        optimized_experience=json.dumps(opt_result.get("optimized_experience", [])),
        modifications=json.dumps(opt_result.get("modifications", [])),
        added_keywords=json.dumps(opt_result.get("added_keywords", [])),
        company_tips=json.dumps(opt_result.get("company_tips", [])),
        pdf_path=pdf_path,
    )
    await opt_doc.insert()

    return {
        "optimization_id": str(opt_doc.id),
        "company": body.target_company,
        "role": body.target_role,
        "original_ats_score": opt_result.get("original_ats_score"),
        "optimized_ats_score": opt_result.get("optimized_ats_score"),
        "ats_improvement": opt_result.get("ats_improvement"),
        "optimized_summary": opt_result.get("optimized_summary", ""),
        "optimized_skills": opt_result.get("optimized_skills", []),
        "optimized_projects": opt_result.get("optimized_projects", []),
        "optimized_experience": opt_result.get("optimized_experience", []),
        "modifications": opt_result.get("modifications", []),
        "added_keywords": opt_result.get("added_keywords", []),
        "company_tips": opt_result.get("company_tips", []),
        "optimization_summary": opt_result.get("optimization_summary", ""),
        "company_accent": opt_result.get("company_accent", "#6c63ff"),
        "has_pdf": pdf_path is not None,
        "source": opt_result.get("source", "unknown"),
    }


# ─── List Optimization History ───────────────────────────────────────────────

@router.get("/{resume_id}/optimizations")
async def list_optimizations(
    resume_id: str,
    user: User = Depends(get_current_user),
):
    """List all optimizations for a resume."""
    try:
        res_obj_id = PydanticObjectId(resume_id)
    except Exception:
        raise HTTPException(400, "Invalid resume_id format")

    resume = await Resume.find_one(
        Resume.id == res_obj_id, Resume.user_id == str(user.id)
    )
    if not resume:
        raise HTTPException(404, "Resume not found.")

    opts = await ResumeOptimization.find(
        ResumeOptimization.resume_id == str(resume.id),
        ResumeOptimization.user_id == str(user.id),
    ).sort(-ResumeOptimization.created_at).to_list()

    return [
        {
            "id": str(o.id),
            "target_company": o.target_company,
            "target_role": o.target_role,
            "original_ats_score": o.original_ats_score,
            "optimized_ats_score": o.optimized_ats_score,
            "ats_improvement": o.ats_improvement,
            "has_pdf": o.pdf_path is not None,
            "created_at": o.created_at.isoformat() if o.created_at else None,
        }
        for o in opts
    ]


# ─── Download Optimized PDF ──────────────────────────────────────────────────

@router.get("/{resume_id}/optimization/{opt_id}/pdf")
async def download_optimized_pdf(
    resume_id: str,
    opt_id: str,
    user: User = Depends(get_current_user),
):
    """Download the PDF for a specific optimization."""
    try:
        opt_obj_id = PydanticObjectId(opt_id)
    except Exception:
        raise HTTPException(400, "Invalid optimization_id format")

    opt = await ResumeOptimization.find_one(
        ResumeOptimization.id == opt_obj_id,
        ResumeOptimization.user_id == str(user.id),
    )
    if not opt:
        raise HTTPException(404, "Optimization not found.")

    if not opt.pdf_path or not os.path.exists(opt.pdf_path):
        raise HTTPException(404, "PDF not available. Please re-run optimization.")

    safe_name = f"resume_{opt.target_company}_{opt.target_role}.pdf".replace(" ", "_")
    return FileResponse(
        path=opt.pdf_path,
        media_type="application/pdf",
        filename=safe_name,
    )


# ─── Preview Optimized Resume as HTML ──────────────────────────────────────


@router.get("/{resume_id}/optimization/{opt_id}/preview", response_class=HTMLResponse)
async def preview_optimized_resume(
    resume_id: str,
    opt_id: str,
    user: User = Depends(get_current_user),
):
    """Return the rendered resume HTML for live preview (iframe embedding).

    Reads the stored optimization data and re-renders it using the same Jinja2
    template so the frontend can embed it as an iframe without generating a PDF.
    """
    try:
        opt_obj_id = PydanticObjectId(opt_id)
    except Exception:
        raise HTTPException(400, "Invalid optimization_id format")

    opt = await ResumeOptimization.find_one(
        ResumeOptimization.id == opt_obj_id,
        ResumeOptimization.user_id == str(user.id),
    )
    if not opt:
        raise HTTPException(404, "Optimization not found.")

    # Re-load the origial resume to rebuild context
    try:
        res_obj_id = PydanticObjectId(resume_id)
    except Exception:
        raise HTTPException(400, "Invalid resume_id format")

    resume = await Resume.find_one(
        Resume.id == res_obj_id, Resume.user_id == str(user.id)
    )
    if not resume:
        raise HTTPException(404, "Resume not found.")

    # Re-parse PDF text
    try:
        text = extract_text_from_pdf(resume.file_path)
        original_parsed = extract_resume_sections(text)
    except Exception as exc:
        raise HTTPException(500, f"Failed to re-parse resume: {exc}")

    # Reconstruct optimization_data from stored DB fields
    def _j(val, default=None):
        if val is None:
            return default
        try:
            return json.loads(val)
        except Exception:
            return default

    optimization_data = {
        "company":              opt.target_company,
        "role":                 opt.target_role,
        "optimized_summary":    opt.optimized_summary or "",
        "optimized_skills":     _j(opt.optimized_skills, []),
        "optimized_projects":   _j(opt.optimized_projects, []),
        "optimized_experience": _j(opt.optimized_experience, []),
    }

    # Determine template from the PDF filename (stored in opt.pdf_path)
    template = "classic"
    if opt.pdf_path:
        for key in ["faang", "classic", "minimal", "executive"]:
            if f"_{key}_" in opt.pdf_path:
                template = key
                break

    ctx = build_resume_context(
        optimization_data=optimization_data,
        original_parsed=original_parsed,
        user_name=user.name or "Candidate",
    )
    html_content = render_resume_html(ctx, template)
    return HTMLResponse(content=html_content, status_code=200)
