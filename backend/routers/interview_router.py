import random
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from beanie import PydanticObjectId
from beanie.operators import In
from typing import List

from backend.models import Question, InterviewSession, SessionAnswer, User
from backend.auth.dependencies import get_current_user
from backend.question_bank import QUESTIONS

router = APIRouter(prefix="/interview", tags=["Interview"])

CATEGORIES = ["dsa", "system_design", "behavioral", "javascript", "python", "sql"]
DIFFICULTIES = ["easy", "medium", "hard"]


# ─── DB seed helper ───────────────────────────────────────────────────────────

async def seed_questions():
    """Seed question bank on first run if empty."""
    count = await Question.count()
    if count == 0:
        docs = [Question(**q) for q in QUESTIONS]
        await Question.insert_many(docs)


# ─── Schemas ──────────────────────────────────────────────────────────────────

class StartSessionRequest(BaseModel):
    category: str = "all"
    difficulty: str = "all"
    num_questions: int = 5


class SubmitAnswerRequest(BaseModel):
    question_id: str
    user_answer: str
    time_taken: Optional[int] = None  # seconds


# ─── AI Scoring Engine ────────────────────────────────────────────────────────

def score_answer(question: Question, user_answer: str) -> tuple[float, str]:
    """
    Score an answer 0-100 using:
      - Keyword coverage  (60 pts max)
      - Answer depth/length (25 pts max)
      - Structure bonus   (15 pts max)
    Returns (score, feedback_text).
    """
    answer_lower = user_answer.lower().strip()
    keywords = [k.strip().lower() for k in question.keywords.split(",")]

    # 1. Keyword score
    found = [k for k in keywords if k in answer_lower]
    keyword_score = min(60, int((len(found) / max(len(keywords), 1)) * 60))

    # 2. Depth score (word count)
    word_count = len(user_answer.split())
    if word_count < 10:
        depth_score = 0
    elif word_count < 30:
        depth_score = 8
    elif word_count < 70:
        depth_score = 16
    elif word_count < 130:
        depth_score = 22
    else:
        depth_score = 25

    # 3. Structure bonus (uses punctuation / numbers / examples)
    structure_score = 0
    if any(c in user_answer for c in [".", ",", ";"]):
        structure_score += 5
    if any(char.isdigit() for char in user_answer):
        structure_score += 5
    if any(w in answer_lower for w in ["example", "e.g.", "for instance", "such as", "like"]):
        structure_score += 5

    total = min(100, keyword_score + depth_score + structure_score)

    # Generate feedback
    missing = [k for k in keywords if k not in answer_lower][:4]
    feedback_parts = []

    if total >= 80:
        feedback_parts.append("🌟 Excellent answer! Well-structured and comprehensive.")
    elif total >= 60:
        feedback_parts.append("✅ Good answer. You covered the key points.")
    elif total >= 40:
        feedback_parts.append("📝 Partial answer. You touched on some concepts but missed important details.")
    else:
        feedback_parts.append("❌ Answer needs improvement. Try to be more specific and comprehensive.")

    if missing:
        feedback_parts.append(f"💡 Consider mentioning: {', '.join(missing[:3])}.")

    if word_count < 20:
        feedback_parts.append("📏 Your answer was very brief — try to elaborate more.")

    if question.sample_answer:
        feedback_parts.append(f"📖 Sample answer: {question.sample_answer[:200]}...")

    return round(total, 1), " ".join(feedback_parts)


# ─── Routes ───────────────────────────────────────────────────────────────────

@router.get("/questions")
async def get_questions(
    category: str = "all",
    difficulty: str = "all",
    limit: int = 5,
    current_user: User = Depends(get_current_user),
):
    """Fetch random questions filtered by category and difficulty."""
    await seed_questions()

    filters = {}
    if category != "all":
        filters["category"] = category
    if difficulty != "all":
        filters["difficulty"] = difficulty

    questions = await Question.find(filters).to_list()
    
    if not questions:
        raise HTTPException(status_code=404, detail="No questions found for the selected filter.")

    sample = random.sample(questions, min(limit, len(questions)))
    return [
        {
            "id": str(q.id), "text": q.text, "category": q.category,
            "difficulty": q.difficulty, "hint": q.hint,
        }
        for q in sample
    ]


@router.post("/sessions", status_code=201)
async def start_session(
    payload: StartSessionRequest,
    current_user: User = Depends(get_current_user),
):
    """Start a new interview session and return the questions."""
    await seed_questions()

    if payload.category not in CATEGORIES + ["all"]:
        raise HTTPException(status_code=400, detail=f"Invalid category. Choose from: {CATEGORIES}")
    if payload.difficulty not in DIFFICULTIES + ["all"]:
        raise HTTPException(status_code=400, detail=f"Invalid difficulty. Choose from: {DIFFICULTIES}")

    num = max(1, min(payload.num_questions, 10))

    # Fetch questions
    filters = {}
    if payload.category != "all":
        filters["category"] = payload.category
    if payload.difficulty != "all":
        filters["difficulty"] = payload.difficulty

    questions = await Question.find(filters).to_list()
    
    if len(questions) < 1:
        raise HTTPException(status_code=404, detail="No questions available for these filters.")

    selected = random.sample(questions, min(num, len(questions)))

    session = InterviewSession(
        user_id=str(current_user.id),
        category=payload.category,
        difficulty=payload.difficulty,
        num_questions=len(selected),
        status="in_progress",
    )
    await session.insert()

    return {
        "session_id": str(session.id),
        "category": session.category,
        "difficulty": session.difficulty,
        "num_questions": session.num_questions,
        "questions": [
            {"id": str(q.id), "text": q.text, "category": q.category,
             "difficulty": q.difficulty, "hint": q.hint}
            for q in selected
        ],
    }


@router.post("/sessions/{session_id}/answer")
async def submit_answer(
    session_id: str,
    payload: SubmitAnswerRequest,
    current_user: User = Depends(get_current_user),
):
    """Submit an answer to a question — returns AI score and feedback."""
    try:
        sess_obj_id = PydanticObjectId(session_id)
        q_obj_id = PydanticObjectId(payload.question_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid session_id or question_id format")

    session = await InterviewSession.find_one(
        InterviewSession.id == sess_obj_id,
        InterviewSession.user_id == str(current_user.id),
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")
    if session.status == "completed":
        raise HTTPException(status_code=400, detail="Session already completed.")

    question = await Question.get(q_obj_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found.")

    if not payload.user_answer or len(payload.user_answer.strip()) < 3:
        raise HTTPException(status_code=400, detail="Answer is too short.")

    score, feedback = score_answer(question, payload.user_answer)

    answer = SessionAnswer(
        session_id=str(session.id),
        question_id=str(question.id),
        user_answer=payload.user_answer,
        ai_score=score,
        ai_feedback=feedback,
        time_taken=payload.time_taken,
    )
    await answer.insert()

    return {
        "answer_id": str(answer.id),
        "ai_score": score,
        "ai_feedback": feedback,
        "question": {"text": question.text, "sample_answer": question.sample_answer},
    }


@router.post("/sessions/{session_id}/finish")
async def finish_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
):
    """Mark session as complete, compute total score."""
    try:
        sess_obj_id = PydanticObjectId(session_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid session_id format")

    session = await InterviewSession.find_one(
        InterviewSession.id == sess_obj_id,
        InterviewSession.user_id == str(current_user.id),
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")

    answers = await SessionAnswer.find(SessionAnswer.session_id == session_id).to_list()
    if not answers:
        raise HTTPException(status_code=400, detail="No answers submitted yet.")

    avg_score = round(sum(a.ai_score for a in answers) / len(answers), 1)
    session.total_score = avg_score
    session.status = "completed"
    session.finished_at = datetime.now(timezone.utc)
    await session.save()

    return {
        "session_id": str(session.id),
        "total_score": avg_score,
        "num_answered": len(answers),
        "answers": [
            {"question_id": a.question_id, "score": a.ai_score, "feedback": a.ai_feedback}
            for a in answers
        ],
    }


@router.get("/sessions")
async def get_sessions(
    limit: int = 20,
    current_user: User = Depends(get_current_user),
):
    """Get user's session history."""
    sessions = await InterviewSession.find(
        InterviewSession.user_id == str(current_user.id),
        InterviewSession.status == "completed",
    ).sort(-InterviewSession.created_at).limit(limit).to_list()

    return [
        {
            "id": str(s.id), "category": s.category, "difficulty": s.difficulty,
            "total_score": s.total_score, "num_questions": s.num_questions,
            "created_at": s.created_at.isoformat() if s.created_at else None,
        }
        for s in sessions
    ]


@router.get("/analytics")
async def get_analytics(
    current_user: User = Depends(get_current_user),
):
    """Aggregated analytics data for Chart.js dashboard."""
    await seed_questions()
    uid = str(current_user.id)

    sessions = await InterviewSession.find(
        InterviewSession.user_id == uid, 
        InterviewSession.status == "completed"
    ).sort(InterviewSession.created_at).to_list()

    answers = await SessionAnswer.find(
        In(SessionAnswer.session_id, [str(s.id) for s in sessions]) if sessions else {"_id": None}
    ).to_list()
    
    # We need to emulate the join manually.
    # Group answers by session ID
    session_dict = {str(s.id): s for s in sessions}
    
    q_ids = [a.question_id for a in answers]
    # In Beanie we can't easily fetch multiple IDs from list of strings without casting
    try:
        q_obj_ids = [PydanticObjectId(q_id) for q_id in set(q_ids)]
        questions = await Question.find({"_id": {"$in": q_obj_ids}}).to_list()
    except:
        questions = []
        
    q_dict = {str(q.id): q for q in questions}

    # ── Stat cards ────────────────────────────────────────
    total_sessions = len(sessions)
    avg_score = round(sum(s.total_score for s in sessions if s.total_score) / max(total_sessions, 1), 1)
    best_score = max((s.total_score for s in sessions if s.total_score), default=0)
    total_answers = len(answers)

    # ── Trend (last 10 sessions) ──────────────────────────
    trend_sessions = sessions[-10:]
    trend = {
        "labels": [s.created_at.strftime("%b %d") if s.created_at else f"S{i}" for i, s in enumerate(trend_sessions)],
        "scores": [round(s.total_score, 1) if s.total_score else 0 for s in trend_sessions],
    }

    # ── Radar — avg score per category ───────────────────
    cat_scores: dict[str, list] = {c: [] for c in CATEGORIES}
    for ans in answers:
        q = q_dict.get(ans.question_id)
        if q and q.category in cat_scores:
            cat_scores[q.category].append(ans.ai_score)
            
    radar = {
        "labels": [c.replace("_", " ").title() for c in CATEGORIES],
        "scores": [
            round(sum(v) / len(v), 1) if v else 0
            for v in cat_scores.values()
        ],
    }

    # ── Doughnut — questions attempted per category ───────
    cat_counts = {c: 0 for c in CATEGORIES}
    for ans in answers:
        q = q_dict.get(ans.question_id)
        if q and q.category in cat_counts:
            cat_counts[q.category] += 1
            
    doughnut = {
        "labels": [c.replace("_", " ").title() for c in CATEGORIES],
        "counts": list(cat_counts.values()),
    }

    # ── Bar — score distribution (bands of 20) ────────────
    bands = ["0-20", "20-40", "40-60", "60-80", "80-100"]
    band_counts = [0, 0, 0, 0, 0]
    for ans in answers:
        idx = min(int(ans.ai_score // 20), 4)
        band_counts[idx] += 1
    distribution = {"labels": bands, "counts": band_counts}

    # ── Weekly activity (last 7 days) ─────────────────────
    from datetime import date, timedelta
    today = date.today()
    weekly_labels = [(today - timedelta(days=i)).strftime("%a") for i in range(6, -1, -1)]
    weekly_counts = [0] * 7
    for s in sessions:
        if s.created_at:
            delta = (today - s.created_at.date()).days
            if 0 <= delta <= 6:
                weekly_counts[6 - delta] += 1
    weekly = {"labels": weekly_labels, "counts": weekly_counts}

    # ── Recent sessions ───────────────────────────────────
    recent = [
        {
            "id": str(s.id),
            "category": s.category.replace("_", " ").title(),
            "difficulty": s.difficulty.title(),
            "score": round(s.total_score, 1) if s.total_score else 0,
            "date": s.created_at.strftime("%b %d, %Y") if s.created_at else "—",
        }
        for s in reversed(sessions[-5:])
    ]

    return {
        "stats": {
            "total_sessions": total_sessions,
            "avg_score": avg_score,
            "best_score": best_score,
            "total_answers": total_answers,
        },
        "charts": {
            "trend": trend,
            "radar": radar,
            "doughnut": doughnut,
            "distribution": distribution,
            "weekly": weekly,
        },
        "recent_sessions": recent,
    }
