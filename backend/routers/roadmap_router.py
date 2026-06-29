"""Roadmap Router - personalized AI learning roadmap generation."""

from fastapi import APIRouter, Depends

from backend.models import User, CodingSubmission, ResumeAnalysis, InterviewSession, AIInterviewSession
from backend.auth.dependencies import get_current_user
from backend.roadmap_engine import generate_roadmap, analyze_weaknesses, TOPICS, COMPANY_FOCUS, RESOURCES

router = APIRouter(prefix="/roadmap", tags=["AI Roadmap"])


async def _gather_user_data(user_id: str) -> dict:
    """Pull analytics from all modules for the current user."""
    # Coding data
    subs = await CodingSubmission.find(CodingSubmission.user_id == user_id).to_list()
    solved_ids = {s.problem_id for s in subs if s.status == "accepted"}
    coding = {
        "total_problems": 20,
        "problems_solved": len(solved_ids),
        "total_submissions": len(subs),
        "easy": {"total": 9, "solved": len([s for s in subs if s.status == "accepted"])},
        "medium": {"total": 9, "solved": 0},
        "hard": {"total": 2, "solved": 0},
    }

    # Resume data
    resume_row = await ResumeAnalysis.find(
        ResumeAnalysis.user_id == user_id
    ).sort(-ResumeAnalysis.created_at).first_or_none()
    
    resume = {}
    if resume_row:
        resume = {
            "ats_score": resume_row.ats_score or 0,
            "skills": (resume_row.skills or "").split(",") if resume_row.skills else [],
        }

    # Interview data
    interviews = []
    try:
        interview_rows = await InterviewSession.find(InterviewSession.user_id == user_id).to_list()
        interviews = [{"score": i.total_score or 0} for i in interview_rows]
        
        # Also check AI interview sessions
        ai_rows = await AIInterviewSession.find(AIInterviewSession.user_id == user_id).to_list()
        interviews += [{"score": i.avg_score or 0} for i in ai_rows]
    except Exception:
        pass

    return {"coding": coding, "resume": resume, "interviews": interviews}


@router.get("/generate")
async def get_roadmap(
    company: str = "Product Company",
    role: str = "SDE",
    weeks: int = 8,
    current_user: User = Depends(get_current_user),
):
    user_data = await _gather_user_data(str(current_user.id))
    roadmap = await generate_roadmap(user_data, company, role, weeks)
    return roadmap


@router.get("/weaknesses")
async def get_weaknesses(
    current_user: User = Depends(get_current_user),
):
    user_data = await _gather_user_data(str(current_user.id))
    return analyze_weaknesses(user_data)


@router.get("/topics")
def get_topics(current_user: User = Depends(get_current_user)):
    return TOPICS


@router.get("/companies")
def get_companies(current_user: User = Depends(get_current_user)):
    return COMPANY_FOCUS


@router.get("/resources")
def get_resources(topic: str = "all", current_user: User = Depends(get_current_user)):
    if topic == "all":
        all_res = []
        for t, items in RESOURCES.items():
            for r in items:
                all_res.append({**r, "topic": t, "topic_name": TOPICS.get(t, {}).get("name", t)})
        return all_res
    return RESOURCES.get(topic, [])
