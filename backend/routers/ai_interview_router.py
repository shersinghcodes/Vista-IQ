"""AI Interview Router — conversational interview with OpenAI scoring."""

import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from pydantic import BaseModel
from beanie import PydanticObjectId

from backend.models import User, AIInterviewSession, AIInterviewMessage
from backend.auth.dependencies import get_current_user
from backend.ai_engine import generate_question, score_answer

router = APIRouter(prefix="/ai-interview", tags=["AI Interview"])


# ─── Schemas ──────────────────────────────────────────────────────────────────

class StartRequest(BaseModel):
    round_type: str  # hr | technical | behavioral
    target_company: Optional[str] = None
    target_role: Optional[str] = None
    difficulty: Optional[str] = None

class RespondRequest(BaseModel):
    session_id: str
    answer: str

class EndRequest(BaseModel):
    session_id: str


# ─── Start Session ────────────────────────────────────────────────────────────

@router.post("/start")
async def start_interview(
    payload: StartRequest,
    current_user: User = Depends(get_current_user),
):
    if payload.round_type not in ("hr", "technical", "behavioral"):
        raise HTTPException(400, "round_type must be hr, technical, or behavioral")

    # Create session
    session = AIInterviewSession(
        user_id=str(current_user.id),
        round_type=payload.round_type,
        status="active",
        target_company=payload.target_company,
        target_role=payload.target_role,
        difficulty=payload.difficulty
    )
    await session.insert()

    # Generate first question
    q = await generate_question(
        payload.round_type, [], 1,
        payload.target_company, payload.target_role,
        payload.difficulty
    )

    # Save question as message
    msg = AIInterviewMessage(
        session_id=str(session.id),
        role="interviewer",
        content=q["question"],
    )
    await msg.insert()

    session.total_questions = 1
    await session.save()

    return {
        "session_id": str(session.id),
        "round_type": payload.round_type,
        "question": q["question"],
        "question_number": 1,
        "source": q["source"],
    }


# ─── Respond (answer + get next question) ─────────────────────────────────────

@router.post("/respond")
async def respond(
    payload: RespondRequest,
    current_user: User = Depends(get_current_user),
):
    try:
        session_obj_id = PydanticObjectId(payload.session_id)
    except Exception:
        raise HTTPException(400, "Invalid session_id format")

    session = await AIInterviewSession.find_one(
        AIInterviewSession.id == session_obj_id,
        AIInterviewSession.user_id == str(current_user.id),
    )
    if not session:
        raise HTTPException(404, "Session not found")
    if session.status != "active":
        raise HTTPException(400, "Session already completed")

    # Get last question
    last_q = await AIInterviewMessage.find(
        AIInterviewMessage.session_id == str(session.id),
        AIInterviewMessage.role == "interviewer",
    ).sort(-AIInterviewMessage.created_at).first_or_none()

    if not last_q:
        raise HTTPException(400, "No question to answer")

    # Score answer
    conversation = await _build_conversation(str(session.id))
    scoring = await score_answer(
        session.round_type, last_q.content, payload.answer,
        conversation, session.target_company, session.target_role
    )

    # Save answer
    answer_msg = AIInterviewMessage(
        session_id=str(session.id),
        role="candidate",
        content=payload.answer,
        score=scoring.get("score", 0),
        feedback=scoring.get("feedback", ""),
        strengths=json.dumps(scoring.get("strengths", [])),
        improvements=json.dumps(scoring.get("improvements", [])),
    )
    await answer_msg.insert()

    # Generate next question
    conversation.append({"role": "assistant", "content": last_q.content})
    conversation.append({"role": "user", "content": payload.answer})

    next_q_num = session.total_questions + 1
    next_q = await generate_question(
        session.round_type, conversation, next_q_num,
        session.target_company, session.target_role, session.difficulty
    )

    next_msg = AIInterviewMessage(
        session_id=str(session.id),
        role="interviewer",
        content=next_q["question"],
    )
    await next_msg.insert()
    
    session.total_questions = next_q_num
    await session.save()

    return {
        "score": scoring.get("score", 0),
        "feedback": scoring.get("feedback", ""),
        "strengths": scoring.get("strengths", []),
        "improvements": scoring.get("improvements", []),
        "next_question": next_q["question"],
        "question_number": next_q_num,
        "source": next_q["source"],
    }


# ─── End Session ──────────────────────────────────────────────────────────────

@router.post("/end")
async def end_interview(
    payload: EndRequest,
    current_user: User = Depends(get_current_user),
):
    try:
        session_obj_id = PydanticObjectId(payload.session_id)
    except Exception:
        raise HTTPException(400, "Invalid session_id format")

    session = await AIInterviewSession.find_one(
        AIInterviewSession.id == session_obj_id,
        AIInterviewSession.user_id == str(current_user.id),
    )
    if not session:
        raise HTTPException(404, "Session not found")

    # Calculate stats
    answers = await AIInterviewMessage.find(
        AIInterviewMessage.session_id == str(session.id),
        AIInterviewMessage.role == "candidate",
    ).sort(AIInterviewMessage.created_at).to_list()

    scores = [a.score for a in answers if a.score is not None]
    avg = round(sum(scores) / len(scores), 1) if scores else 0
    duration = int((datetime.now(timezone.utc) - session.created_at.replace(tzinfo=timezone.utc)).total_seconds()) if session.created_at else 0

    session.status = "completed"
    session.avg_score = avg
    session.duration_secs = duration
    session.completed_at = datetime.now(timezone.utc)
    await session.save()

    answer_data = []
    for a in answers:
        q_content = await _get_question_for_answer(str(session.id), a.created_at)
        answer_data.append({
            "question": q_content,
            "answer": a.content,
            "score": a.score,
            "feedback": a.feedback,
            "strengths": json.loads(a.strengths) if a.strengths else [],
            "improvements": json.loads(a.improvements) if a.improvements else [],
        })

    return {
        "session_id": str(session.id),
        "status": "completed",
        "total_questions": len(answers),
        "avg_score": avg,
        "duration_secs": duration,
        "answers": answer_data,
    }


# ─── History ──────────────────────────────────────────────────────────────────

@router.get("/history")
async def get_history(
    current_user: User = Depends(get_current_user),
):
    sessions = await AIInterviewSession.find(
        AIInterviewSession.user_id == str(current_user.id)
    ).sort(-AIInterviewSession.created_at).limit(20).to_list()

    return [
        {
            "id": str(s.id), "round_type": s.round_type, "status": s.status,
            "target_company": s.target_company, "target_role": s.target_role,
            "total_questions": s.total_questions, "avg_score": s.avg_score,
            "duration_secs": s.duration_secs,
            "created_at": s.created_at.isoformat() if s.created_at else None,
        }
        for s in sessions
    ]


# ─── Analytics ────────────────────────────────────────────────────────────────

@router.get("/analytics")
async def get_analytics(
    current_user: User = Depends(get_current_user),
):
    uid = str(current_user.id)
    sessions = await AIInterviewSession.find(
        AIInterviewSession.user_id == uid,
        AIInterviewSession.status == "completed",
    ).sort(-AIInterviewSession.created_at).to_list()

    by_type = {"hr": [], "technical": [], "behavioral": []}
    for s in sessions:
        if s.avg_score is not None:
            by_type.setdefault(s.round_type, []).append(s.avg_score)

    return {
        "total_sessions": len(sessions),
        "avg_score": round(sum(s.avg_score or 0 for s in sessions) / max(len(sessions), 1), 1),
        "by_round_type": {k: {"count": len(v), "avg": round(sum(v)/max(len(v),1), 1)} for k, v in by_type.items()},
        "recent_scores": [{"type": s.round_type, "company": s.target_company, "score": s.avg_score, "date": s.created_at.isoformat() if s.created_at else None} for s in sessions[:10]],
    }


# ─── Helpers ──────────────────────────────────────────────────────────────────

async def _build_conversation(session_id: str) -> list[dict]:
    msgs = await AIInterviewMessage.find(
        AIInterviewMessage.session_id == session_id
    ).sort(AIInterviewMessage.created_at).to_list()
    
    conv = []
    for m in msgs:
        role = "assistant" if m.role == "interviewer" else "user"
        conv.append({"role": role, "content": m.content})
    return conv


async def _get_question_for_answer(session_id: str, answer_created_at: datetime) -> str:
    q = await AIInterviewMessage.find(
        AIInterviewMessage.session_id == session_id,
        AIInterviewMessage.role == "interviewer",
        AIInterviewMessage.created_at < answer_created_at,
    ).sort(-AIInterviewMessage.created_at).first_or_none()
    return q.content if q else ""


# ─── Companies ────────────────────────────────────────────────────────────────

@router.get("/companies")
def get_companies():
    return [
        {"name": "Google", "logo": "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg", "roles": ["SDE", "Frontend", "Backend", "Data Science"], "difficulty": "Advanced", "rounds": ["Technical", "System Design", "Behavioral"]},
        {"name": "Amazon", "logo": "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg", "roles": ["SDE", "Frontend", "Backend", "Data Science"], "difficulty": "Advanced", "rounds": ["Technical", "System Design", "Leadership"]},
        {"name": "Microsoft", "logo": "https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%(2012%).svg", "roles": ["SDE", "Frontend", "Backend"], "difficulty": "Advanced", "rounds": ["Technical", "System Design", "HR"]},
        {"name": "Meta", "logo": "https://upload.wikimedia.org/wikipedia/commons/7/7b/Meta_Platforms_Inc._logo.svg", "roles": ["SDE", "Frontend", "Backend"], "difficulty": "Advanced", "rounds": ["Technical", "System Design", "Behavioral"]},
        {"name": "Apple", "logo": "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg", "roles": ["SDE", "Frontend", "Backend"], "difficulty": "Advanced", "rounds": ["Technical", "System Design", "HR"]},
        {"name": "Netflix", "logo": "https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg", "roles": ["SDE", "Backend", "Data Science"], "difficulty": "Advanced", "rounds": ["Technical", "System Design", "Behavioral"]},
        {"name": "Adobe", "logo": "https://upload.wikimedia.org/wikipedia/commons/d/d5/Adobe_Corporate_Logo.svg", "roles": ["SDE", "Frontend", "Backend"], "difficulty": "Intermediate", "rounds": ["Technical", "HR"]},
        {"name": "Flipkart", "logo": "https://upload.wikimedia.org/wikipedia/en/7/7a/Flipkart_logo.svg", "roles": ["SDE", "Frontend", "Backend"], "difficulty": "Intermediate", "rounds": ["Technical", "System Design", "HR"]},
        {"name": "TCS", "logo": "https://upload.wikimedia.org/wikipedia/commons/b/b1/Tata_Consultancy_Services_Logo.svg", "roles": ["System Engineer", "Digital"], "difficulty": "Beginner", "rounds": ["Aptitude", "Technical", "HR"]},
        {"name": "Infosys", "logo": "https://upload.wikimedia.org/wikipedia/commons/9/95/Infosys_logo.svg", "roles": ["Systems Engineer", "Specialist Programmer"], "difficulty": "Beginner", "rounds": ["Aptitude", "Technical", "HR"]},
        {"name": "Wipro", "logo": "https://upload.wikimedia.org/wikipedia/commons/a/a0/Wipro_Primary_Logo_Color_RGB.svg", "roles": ["Project Engineer"], "difficulty": "Beginner", "rounds": ["Aptitude", "Technical", "HR"]},
        {"name": "Accenture", "logo": "https://upload.wikimedia.org/wikipedia/commons/c/cd/Accenture.svg", "roles": ["ASE", "FSE"], "difficulty": "Beginner", "rounds": ["Aptitude", "Technical", "HR"]}
    ]
