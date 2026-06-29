"""Coding Prep Router - problems, bookmarks, roadmap, company paths, analytics."""

import json
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any

from backend.models import User, CodingSubmission
from backend.auth.dependencies import get_current_user
from backend.coding_problems import PROBLEMS, DSA_ROADMAP, COMPANY_PATHS, get_problem, get_problems

router = APIRouter(prefix="/coding", tags=["Coding Prep"])


class BookmarkRequest(BaseModel):
    problem_id: int


# ─── Static routes FIRST (before parameterized /{problem_id}) ─────────────────

@router.get("/roadmap")
def get_roadmap(current_user: User = Depends(get_current_user)):
    return DSA_ROADMAP


@router.get("/company-paths")
def get_company_paths(current_user: User = Depends(get_current_user)):
    return COMPANY_PATHS


@router.get("/analytics")
async def coding_analytics(current_user: User = Depends(get_current_user)):
    uid = str(current_user.id)
    
    bookmarks = await CodingSubmission.find(
        CodingSubmission.user_id == uid, 
        CodingSubmission.status == "bookmarked"
    ).count()
    
    solved_submissions = await CodingSubmission.find(
        CodingSubmission.user_id == uid, 
        CodingSubmission.status == "accepted"
    ).to_list()
    
    solved_ids = set(sub.problem_id for sub in solved_submissions)
    
    total = len(PROBLEMS)
    easy = len([p for p in PROBLEMS if p["difficulty"] == "easy"])
    medium = len([p for p in PROBLEMS if p["difficulty"] == "medium"])
    hard = len([p for p in PROBLEMS if p["difficulty"] == "hard"])
    solved_easy = len([p for p in PROBLEMS if p["difficulty"] == "easy" and p["id"] in solved_ids])
    solved_medium = len([p for p in PROBLEMS if p["difficulty"] == "medium" and p["id"] in solved_ids])
    solved_hard = len([p for p in PROBLEMS if p["difficulty"] == "hard" and p["id"] in solved_ids])

    topics = {}
    for p in PROBLEMS:
        topics[p["category"]] = topics.get(p["category"], 0) + 1

    return {
        "total_problems": total,
        "problems_solved": len(solved_ids),
        "bookmarks": bookmarks,
        "easy": {"total": easy, "solved": solved_easy},
        "medium": {"total": medium, "solved": solved_medium},
        "hard": {"total": hard, "solved": solved_hard},
        "topics": topics,
        "completion": round(len(solved_ids) / max(total, 1) * 100, 1),
    }


@router.get("/bookmarks")
async def get_bookmarks(current_user: User = Depends(get_current_user)):
    bms = await CodingSubmission.find(
        CodingSubmission.user_id == str(current_user.id),
        CodingSubmission.status == "bookmarked",
    ).to_list()
    ids = [b.problem_id for b in bms]
    return [p for p in [{**get_problem(pid), "bookmarked": True} for pid in ids if get_problem(pid)]]


@router.post("/bookmark")
async def toggle_bookmark(
    body: BookmarkRequest,
    current_user: User = Depends(get_current_user),
):
    existing = await CodingSubmission.find_one(
        CodingSubmission.user_id == str(current_user.id),
        CodingSubmission.problem_id == body.problem_id,
        CodingSubmission.status == "bookmarked",
    )

    if existing:
        await existing.delete()
        return {"bookmarked": False, "message": "Bookmark removed"}

    prob = get_problem(body.problem_id)
    bm = CodingSubmission(
        user_id=str(current_user.id),
        problem_id=body.problem_id,
        problem_title=prob["title"] if prob else f"Problem {body.problem_id}",
        language="n/a",
        code="",
        status="bookmarked",
        score=0, passed_cases=0, total_cases=0, runtime_ms=0,
    )
    await bm.insert()
    return {"bookmarked": True, "message": "Problem bookmarked"}


# ─── Parameterized routes AFTER static ones ───────────────────────────────────

@router.get("/problems")
async def list_problems(
    category: str = "all",
    difficulty: str = "all",
    company: str = "all",
    current_user: User = Depends(get_current_user),
):
    problems = get_problems(category, difficulty)
    if company and company != "all":
        problems = [p for p in problems if company in p.get("companies", [])]

    uid = str(current_user.id)
    
    bookmarked_subs = await CodingSubmission.find(
        CodingSubmission.user_id == uid, 
        CodingSubmission.status == "bookmarked"
    ).to_list()
    bookmarked_ids = set(sub.problem_id for sub in bookmarked_subs)
    
    solved_subs = await CodingSubmission.find(
        CodingSubmission.user_id == uid, 
        CodingSubmission.status == "accepted"
    ).to_list()
    solved_ids = set(sub.problem_id for sub in solved_subs)
    
    for p in problems:
        p["bookmarked"] = p["id"] in bookmarked_ids
        p["solved"] = p["id"] in solved_ids
    return problems


@router.get("/problems/{problem_id}")
def get_problem_detail(problem_id: int, current_user: User = Depends(get_current_user)):
    prob = get_problem(problem_id)
    if not prob:
        raise HTTPException(status_code=404, detail="Problem not found")
    safe = {k: v for k, v in prob.items() if k not in ("test_cases", "starter_python", "starter_js", "py_setup")}
    return safe
