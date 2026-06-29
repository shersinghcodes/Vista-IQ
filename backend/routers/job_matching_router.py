"""Job Matching Router — AI-powered job/company recommendations."""

import json
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from beanie import PydanticObjectId

from backend.models import User, Resume, ResumeAnalysis, AIInterviewSession, CodingSubmission, JobMatchReport, SavedCompany
from backend.auth.dependencies import get_current_user
from backend.job_matching_engine import generate_job_matches, calculate_company_fit, predict_salary, COMPANY_DB

router = APIRouter(prefix="/job-match", tags=["Job Matching"])


def _load(val, default=None):
    if val is None: return default
    if isinstance(val, (dict, list)): return val
    try: return json.loads(val)
    except: return default


async def _build_user_profile(user: User) -> dict:
    """Aggregate user data from resume, interviews, and coding for matching."""
    # Latest resume analysis
    latest_analysis = await ResumeAnalysis.find(
        ResumeAnalysis.user_id == str(user.id)
    ).sort(-ResumeAnalysis.created_at).first_or_none()

    resume_analysis = {}
    if latest_analysis:
        resume_analysis = {
            "overall_score":       latest_analysis.overall_score or 0,
            "ats_score":           latest_analysis.ats_score or 0,
            "technical_score":     latest_analysis.technical_score or 0,
            "project_score":       latest_analysis.project_score or 0,
            "communication_score": latest_analysis.communication_score or 0,
            "experience_score":    latest_analysis.experience_score or 0,
            "confidence_score":    latest_analysis.confidence_score or 0,
            "technologies":        _load(latest_analysis.technologies, []),
            "skills":              _load(latest_analysis.skills, []),
            "projects":            _load(latest_analysis.projects, []),
            "experience":          _load(latest_analysis.experience, []),
            "weak_areas":          _load(latest_analysis.weak_areas, []),
            "keyword_analysis":    _load(latest_analysis.keyword_analysis, {}),
        }

    # AI interview average
    sessions = await AIInterviewSession.find(
        AIInterviewSession.user_id == str(user.id),
        AIInterviewSession.status == "completed"
    ).to_list()
    interview_avg = 0
    if sessions:
        scores = [s.avg_score for s in sessions if s.avg_score is not None]
        interview_avg = round(sum(scores) / len(scores), 1) if scores else 0

    # Coding success rate
    submissions = await CodingSubmission.find(
        CodingSubmission.user_id == str(user.id)
    ).to_list()
    coding_rate = 0
    if submissions:
        passed = sum(1 for s in submissions if s.status == "accepted")
        coding_rate = round(passed / len(submissions) * 100, 1)

    return {
        "user_id": str(user.id),
        "resume_analysis": resume_analysis,
        "interview_avg_score": interview_avg,
        "coding_success_rate": coding_rate,
        "target_role": "SDE",
    }


# ── Generate Full Match Report ────────────────────────────────────────────────

class GenerateRequest(BaseModel):
    target_role: Optional[str] = "SDE"
    target_domain: Optional[str] = "any"
    experience_years: Optional[int] = 0


@router.post("/generate")
async def generate_match_report(
    body: GenerateRequest,
    user: User = Depends(get_current_user),
):
    """Generate full AI job matching report for the current user."""
    # Require at least one resume analysis
    latest_analysis = await ResumeAnalysis.find(
        ResumeAnalysis.user_id == str(user.id)
    ).sort(-ResumeAnalysis.created_at).first_or_none()

    if not latest_analysis:
        raise HTTPException(
            400,
            detail="No resume analysis found. Please upload and analyze your resume first."
        )

    profile = await _build_user_profile(user)
    profile["target_role"] = body.target_role
    profile["target_domain"] = body.target_domain
    profile["experience_years"] = body.experience_years

    report = await generate_job_matches(profile)

    # Save to DB
    doc = JobMatchReport(
        user_id=str(user.id),
        resume_id=str(latest_analysis.resume_id),
        target_role=body.target_role,
        report_data=json.dumps(report),
        top_match_company=report.get("top_match_company", "N/A"),
        top_match_score=report.get("top_match_score", 0),
        hiring_probability=report.get("hiring_probability", {}).get("hiring_probability", 0),
        source=report.get("source", "fallback"),
    )
    await doc.insert()

    return {"report_id": str(doc.id), **report}


# ── Get Match History ─────────────────────────────────────────────────────────

@router.get("/history")
async def get_match_history(user: User = Depends(get_current_user)):
    """Get list of past match reports for the user."""
    reports = await JobMatchReport.find(
        JobMatchReport.user_id == str(user.id)
    ).sort(-JobMatchReport.created_at).to_list()

    return [
        {
            "id": str(r.id),
            "target_role": r.target_role,
            "top_match_company": r.top_match_company,
            "top_match_score": r.top_match_score,
            "hiring_probability": r.hiring_probability,
            "source": r.source,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in reports
    ]


# ── Get Specific Report ───────────────────────────────────────────────────────

@router.get("/{report_id}")
async def get_report(report_id: str, user: User = Depends(get_current_user)):
    try:
        obj_id = PydanticObjectId(report_id)
    except Exception:
        raise HTTPException(400, "Invalid report_id")

    report = await JobMatchReport.find_one(
        JobMatchReport.id == obj_id,
        JobMatchReport.user_id == str(user.id),
    )
    if not report:
        raise HTTPException(404, "Report not found")

    data = _load(report.report_data, {})
    return {"report_id": str(report.id), **data}


# ── Save / Unsave Company ─────────────────────────────────────────────────────

class SaveCompanyRequest(BaseModel):
    company: str
    role: str
    fit_score: float = 0


@router.post("/favorites")
async def save_company(body: SaveCompanyRequest, user: User = Depends(get_current_user)):
    existing = await SavedCompany.find_one(
        SavedCompany.user_id == str(user.id),
        SavedCompany.company_name == body.company,
    )
    if existing:
        return {"message": "Already saved", "id": str(existing.id)}

    doc = SavedCompany(
        user_id=str(user.id),
        company_name=body.company,
        role=body.role,
        fit_score=body.fit_score,
    )
    await doc.insert()
    return {"message": "Company saved", "id": str(doc.id)}


@router.get("/favorites/list")
async def get_favorites(user: User = Depends(get_current_user)):
    favs = await SavedCompany.find(
        SavedCompany.user_id == str(user.id)
    ).sort(-SavedCompany.saved_at).to_list()
    return [
        {
            "id": str(f.id),
            "company": f.company_name,
            "role": f.role,
            "fit_score": f.fit_score,
            "saved_at": f.saved_at.isoformat() if f.saved_at else None,
            "accent": COMPANY_DB.get(f.company_name, {}).get("accent", "#6c63ff"),
        }
        for f in favs
    ]


@router.delete("/favorites/{company_name}")
async def remove_favorite(company_name: str, user: User = Depends(get_current_user)):
    result = await SavedCompany.find_one(
        SavedCompany.user_id == str(user.id),
        SavedCompany.company_name == company_name,
    )
    if result:
        await result.delete()
    return {"message": "Removed from favorites"}


# ── Company Comparison ────────────────────────────────────────────────────────

class CompareRequest(BaseModel):
    companies: list[str]
    role: str = "SDE"


@router.post("/compare")
async def compare_companies(body: CompareRequest, user: User = Depends(get_current_user)):
    if len(body.companies) < 2 or len(body.companies) > 4:
        raise HTTPException(400, "Provide 2–4 companies to compare.")

    latest_analysis = await ResumeAnalysis.find(
        ResumeAnalysis.user_id == str(user.id)
    ).sort(-ResumeAnalysis.created_at).first_or_none()

    resume_analysis = {}
    if latest_analysis:
        resume_analysis = {
            "overall_score": latest_analysis.overall_score or 40,
            "ats_score": latest_analysis.ats_score or 40,
            "technical_score": latest_analysis.technical_score or 40,
            "project_score": latest_analysis.project_score or 40,
            "communication_score": latest_analysis.communication_score or 40,
            "experience_score": latest_analysis.experience_score or 40,
            "technologies": _load(latest_analysis.technologies, []),
            "skills": _load(latest_analysis.skills, []),
        }

    results = [calculate_company_fit(resume_analysis, co, body.role) for co in body.companies]
    return {"comparisons": results, "role": body.role}


# ── Salary Estimate ───────────────────────────────────────────────────────────

@router.get("/salary/estimate")
async def salary_estimate(
    company: str,
    experience: int = 0,
    user: User = Depends(get_current_user),
):
    latest_analysis = await ResumeAnalysis.find(
        ResumeAnalysis.user_id == str(user.id)
    ).sort(-ResumeAnalysis.created_at).first_or_none()
    ra = {}
    if latest_analysis:
        ra = {"technical_score": latest_analysis.technical_score or 50}
    return predict_salary(ra, company, experience)
