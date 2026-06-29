from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, Text, func
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)

    # Password auth — nullable for OAuth-only accounts
    hashed_password = Column(String, nullable=True)

    # Google OAuth
    google_id = Column(String, unique=True, nullable=True, index=True)

    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


# ─── Interview Models ──────────────────────────────────────────────────────────

class Question(Base):
    __tablename__ = "questions"

    id          = Column(Integer, primary_key=True, index=True)
    text        = Column(Text, nullable=False)
    category    = Column(String, nullable=False, index=True)   # dsa|system_design|behavioral|javascript|python|sql
    difficulty  = Column(String, nullable=False, index=True)   # easy|medium|hard
    keywords    = Column(Text, nullable=False)                  # comma-separated scoring keywords
    hint        = Column(Text, nullable=True)
    sample_answer = Column(Text, nullable=True)


class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, nullable=False, index=True)
    category    = Column(String, nullable=False)
    difficulty  = Column(String, nullable=False)
    total_score = Column(Float, nullable=True)           # 0-100 avg across answers
    status      = Column(String, default="in_progress")  # in_progress|completed
    num_questions = Column(Integer, default=5)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())
    finished_at = Column(DateTime(timezone=True), nullable=True)


class SessionAnswer(Base):
    __tablename__ = "session_answers"

    id           = Column(Integer, primary_key=True, index=True)
    session_id   = Column(Integer, nullable=False, index=True)
    question_id  = Column(Integer, nullable=False)
    user_answer  = Column(Text, nullable=False)
    ai_score     = Column(Float, nullable=False)   # 0-100
    ai_feedback  = Column(Text, nullable=False)
    time_taken   = Column(Integer, nullable=True)  # seconds
    created_at   = Column(DateTime(timezone=True), server_default=func.now())


# ─── Coding Submission ─────────────────────────────────────────────────────────

class CodingSubmission(Base):
    __tablename__ = "coding_submissions"

    id            = Column(Integer, primary_key=True, index=True)
    user_id       = Column(Integer, nullable=False, index=True)
    problem_id    = Column(Integer, nullable=False, index=True)
    problem_title = Column(String, nullable=True)
    language      = Column(String, nullable=False)          # python | javascript
    code          = Column(Text, nullable=False)
    status        = Column(String, nullable=False)          # accepted | wrong_answer | tle | error
    score         = Column(Float, nullable=False, default=0)
    passed_cases  = Column(Integer, nullable=False, default=0)
    total_cases   = Column(Integer, nullable=False, default=0)
    runtime_ms    = Column(Integer, nullable=True)
    created_at    = Column(DateTime(timezone=True), server_default=func.now())


# ─── AI Interview ──────────────────────────────────────────────────────────────

class AIInterviewSession(Base):
    __tablename__ = "ai_interview_sessions"

    id            = Column(Integer, primary_key=True, index=True)
    user_id       = Column(Integer, nullable=False, index=True)
    round_type    = Column(String, nullable=False)          # hr | technical | behavioral
    status        = Column(String, nullable=False, default="active")  # active | completed
    
    # Company Specific Config
    target_company = Column(String, nullable=True)
    target_role    = Column(String, nullable=True)
    difficulty     = Column(String, nullable=True)
    
    total_questions = Column(Integer, nullable=False, default=0)
    avg_score     = Column(Float, nullable=True)
    duration_secs = Column(Integer, nullable=True)
    created_at    = Column(DateTime(timezone=True), server_default=func.now())
    completed_at  = Column(DateTime(timezone=True), nullable=True)


class AIInterviewMessage(Base):
    __tablename__ = "ai_interview_messages"

    id            = Column(Integer, primary_key=True, index=True)
    session_id    = Column(Integer, nullable=False, index=True)
    role          = Column(String, nullable=False)           # interviewer | candidate
    content       = Column(Text, nullable=False)
    score         = Column(Float, nullable=True)             # only for candidate answers
    feedback      = Column(Text, nullable=True)
    strengths     = Column(Text, nullable=True)              # JSON array
    improvements  = Column(Text, nullable=True)              # JSON array
    created_at    = Column(DateTime(timezone=True), server_default=func.now())


# ─── Resume Analysis ──────────────────────────────────────────────────────────

class Resume(Base):
    __tablename__ = "resumes"

    id                = Column(Integer, primary_key=True, index=True)
    user_id           = Column(Integer, nullable=False, index=True)
    filename          = Column(String, nullable=False)           # stored UUID filename
    original_filename = Column(String, nullable=False)           # user's original filename
    file_path         = Column(String, nullable=False)
    file_size         = Column(Integer, nullable=False)          # bytes
    version           = Column(Integer, nullable=False, default=1)
    is_active         = Column(Boolean, default=True)
    created_at        = Column(DateTime(timezone=True), server_default=func.now())
    updated_at        = Column(DateTime(timezone=True), onupdate=func.now())


class ResumeAnalysis(Base):
    __tablename__ = "resume_analyses"

    id                  = Column(Integer, primary_key=True, index=True)
    resume_id           = Column(Integer, nullable=False, index=True)
    user_id             = Column(Integer, nullable=False, index=True)

    # Parsed resume data (stored as JSON strings)
    skills              = Column(Text, nullable=True)         # JSON array
    education           = Column(Text, nullable=True)         # JSON array
    experience          = Column(Text, nullable=True)         # JSON array
    projects            = Column(Text, nullable=True)         # JSON array
    certifications      = Column(Text, nullable=True)         # JSON array
    technologies        = Column(Text, nullable=True)         # JSON array
    achievements        = Column(Text, nullable=True)         # JSON array
    summary_text        = Column(Text, nullable=True)

    # AI Scores (0-100)
    overall_score       = Column(Float, nullable=True)
    ats_score           = Column(Float, nullable=True)
    technical_score     = Column(Float, nullable=True)
    project_score       = Column(Float, nullable=True)
    communication_score = Column(Float, nullable=True)
    readability_score   = Column(Float, nullable=True)
    experience_score    = Column(Float, nullable=True)
    confidence_score    = Column(Float, nullable=True)        # hiring likelihood 0-100

    # AI Feedback (stored as JSON strings)
    missing_sections    = Column(Text, nullable=True)         # JSON array
    weak_areas          = Column(Text, nullable=True)         # JSON array
    ats_issues          = Column(Text, nullable=True)         # JSON array
    suggestions         = Column(Text, nullable=True)         # JSON array
    keyword_analysis    = Column(Text, nullable=True)         # JSON object
    skill_gap_analysis  = Column(Text, nullable=True)         # JSON object
    strengths           = Column(Text, nullable=True)         # JSON array
    weaknesses          = Column(Text, nullable=True)         # JSON array
    ats_breakdown       = Column(Text, nullable=True)         # JSON object (detailed ATS sub-scores)
    improvement_roadmap = Column(Text, nullable=True)         # JSON array

    # Optional targeting
    target_role         = Column(String, nullable=True)
    target_company      = Column(String, nullable=True)

    created_at          = Column(DateTime(timezone=True), server_default=func.now())


class ResumeInterviewQuestion(Base):
    __tablename__ = "resume_interview_questions"

    id              = Column(Integer, primary_key=True, index=True)
    resume_id       = Column(Integer, nullable=False, index=True)
    user_id         = Column(Integer, nullable=False, index=True)
    question_text   = Column(Text, nullable=False)
    category        = Column(String, nullable=False, index=True)  # technical|hr|behavioral|project|coding
    difficulty      = Column(String, nullable=False, index=True)  # easy|medium|hard
    source_section  = Column(String, nullable=True)               # skills|projects|experience|education
    source_detail   = Column(String, nullable=True)               # specific skill/project name
    created_at      = Column(DateTime(timezone=True), server_default=func.now())

