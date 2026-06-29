from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


# ─── Auth Schemas ──────────────────────────────────────────────────────────────

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, description="Minimum 8 characters")
    name: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class AccessTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ─── User Schemas ──────────────────────────────────────────────────────────────

class UserOut(BaseModel):
    id: str
    email: str
    name: Optional[str]
    avatar_url: Optional[str]
    is_active: bool
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


# ─── Resume Schemas ────────────────────────────────────────────────────────────

class ResumeOut(BaseModel):
    id: str
    user_id: str
    filename: str
    original_filename: str
    file_size: int
    version: int
    is_active: bool
    created_at: Optional[datetime]
    # Optionally attached analysis summary
    has_analysis: bool = False
    overall_score: Optional[float] = None

    class Config:
        from_attributes = True


class ResumeAnalysisRequest(BaseModel):
    target_role: Optional[str] = None
    target_company: Optional[str] = None


class ResumeAnalysisOut(BaseModel):
    id: str
    resume_id: str
    # Parsed data
    skills: Optional[list] = None
    education: Optional[list] = None
    experience: Optional[list] = None
    projects: Optional[list] = None
    certifications: Optional[list] = None
    technologies: Optional[list] = None
    achievements: Optional[list] = None
    summary_text: Optional[str] = None
    # Scores
    overall_score: Optional[float] = None
    ats_score: Optional[float] = None
    technical_score: Optional[float] = None
    project_score: Optional[float] = None
    communication_score: Optional[float] = None
    # Feedback
    missing_sections: Optional[list] = None
    weak_areas: Optional[list] = None
    ats_issues: Optional[list] = None
    suggestions: Optional[list] = None
    keyword_analysis: Optional[dict] = None
    # Targeting
    target_role: Optional[str] = None
    target_company: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ResumeInterviewQuestionOut(BaseModel):
    id: str
    resume_id: str
    question_text: str
    category: str
    difficulty: str
    source_section: Optional[str] = None
    source_detail: Optional[str] = None

    class Config:
        from_attributes = True
