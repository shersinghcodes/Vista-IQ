from typing import Optional, List
from datetime import datetime
from pydantic import Field, EmailStr
from beanie import Document
from pymongo import IndexModel, ASCENDING

class User(Document):
    email: str
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    hashed_password: Optional[str] = None
    google_id: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    class Settings:
        name = "users"
        indexes = [
            IndexModel([("email", ASCENDING)], unique=True),
            IndexModel([("google_id", ASCENDING)], unique=True, partialFilterExpression={"google_id": {"$type": "string"}})
        ]

class Question(Document):
    text: str
    category: str
    difficulty: str
    keywords: str
    hint: Optional[str] = None
    sample_answer: Optional[str] = None

    class Settings:
        name = "questions"
        indexes = ["category", "difficulty"]

class InterviewSession(Document):
    user_id: str
    category: str
    difficulty: str
    total_score: Optional[float] = None
    status: str = "in_progress"
    num_questions: int = 5
    created_at: datetime = Field(default_factory=datetime.utcnow)
    finished_at: Optional[datetime] = None

    class Settings:
        name = "interview_sessions"
        indexes = ["user_id"]

class SessionAnswer(Document):
    session_id: str
    question_id: str
    user_answer: str
    ai_score: float
    ai_feedback: str
    time_taken: Optional[int] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "session_answers"
        indexes = ["session_id"]

class CodingSubmission(Document):
    user_id: str
    problem_id: int
    problem_title: Optional[str] = None
    language: str
    code: str
    status: str
    score: float = 0
    passed_cases: int = 0
    total_cases: int = 0
    runtime_ms: Optional[int] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "coding_submissions"
        indexes = ["user_id", "problem_id"]

class AIInterviewSession(Document):
    user_id: str
    round_type: str
    status: str = "active"
    target_company: Optional[str] = None
    target_role: Optional[str] = None
    difficulty: Optional[str] = None
    total_questions: int = 0
    avg_score: Optional[float] = None
    duration_secs: Optional[int] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None

    class Settings:
        name = "ai_interview_sessions"
        indexes = ["user_id"]

class AIInterviewMessage(Document):
    session_id: str
    role: str
    content: str
    score: Optional[float] = None
    feedback: Optional[str] = None
    strengths: Optional[str] = None
    improvements: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "ai_interview_messages"
        indexes = ["session_id"]

class Resume(Document):
    user_id: str
    filename: str
    original_filename: str
    file_path: str
    file_size: int
    version: int = 1
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    class Settings:
        name = "resumes"
        indexes = ["user_id"]

class ResumeAnalysis(Document):
    resume_id: str
    user_id: str
    skills: Optional[str] = None
    education: Optional[str] = None
    experience: Optional[str] = None
    projects: Optional[str] = None
    certifications: Optional[str] = None
    technologies: Optional[str] = None
    achievements: Optional[str] = None
    summary_text: Optional[str] = None

    overall_score: Optional[float] = None
    ats_score: Optional[float] = None
    technical_score: Optional[float] = None
    project_score: Optional[float] = None
    communication_score: Optional[float] = None
    readability_score: Optional[float] = None
    experience_score: Optional[float] = None
    confidence_score: Optional[float] = None

    missing_sections: Optional[str] = None
    weak_areas: Optional[str] = None
    ats_issues: Optional[str] = None
    suggestions: Optional[str] = None
    keyword_analysis: Optional[str] = None
    skill_gap_analysis: Optional[str] = None
    strengths: Optional[str] = None
    weaknesses: Optional[str] = None
    ats_breakdown: Optional[str] = None
    improvement_roadmap: Optional[str] = None

    target_role: Optional[str] = None
    target_company: Optional[str] = None

    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "resume_analyses"
        indexes = ["resume_id", "user_id"]

class ResumeInterviewQuestion(Document):
    resume_id: str
    user_id: str
    question_text: str
    category: str
    difficulty: str
    source_section: Optional[str] = None
    source_detail: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "resume_interview_questions"
        indexes = ["resume_id", "user_id"]

class ResumeOptimization(Document):
    resume_id: str
    user_id: str
    target_company: str
    target_role: str
    # Score comparison
    original_ats_score: Optional[float] = None
    optimized_ats_score: Optional[float] = None
    original_overall_score: Optional[float] = None
    optimized_overall_score: Optional[float] = None
    ats_improvement: Optional[float] = None
    # Optimized content (JSON strings)
    optimized_summary: Optional[str] = None
    optimized_skills: Optional[str] = None        # JSON list
    optimized_projects: Optional[str] = None      # JSON list
    optimized_experience: Optional[str] = None    # JSON list
    modifications: Optional[str] = None           # JSON list of {section, original, optimized, type}
    added_keywords: Optional[str] = None          # JSON list
    company_tips: Optional[str] = None            # JSON list
    # PDF
    pdf_path: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "resume_optimizations"
        indexes = ["resume_id", "user_id"]

class JobMatchReport(Document):
    user_id: str
    resume_id: str
    target_role: Optional[str] = None
    report_data: Optional[str] = None          # JSON blob of full report
    top_match_company: Optional[str] = None
    top_match_score: Optional[float] = None
    hiring_probability: Optional[float] = None
    source: str = "fallback"
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "job_match_reports"
        indexes = ["user_id"]


class SavedCompany(Document):
    user_id: str
    company_name: str
    role: Optional[str] = None
    fit_score: Optional[float] = None
    saved_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "saved_companies"
        indexes = ["user_id"]


__beanie_models__ = [
    User, Question, InterviewSession, SessionAnswer, CodingSubmission,
    AIInterviewSession, AIInterviewMessage, Resume, ResumeAnalysis,
    ResumeInterviewQuestion, ResumeOptimization,
    JobMatchReport, SavedCompany,
]

