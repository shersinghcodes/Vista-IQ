import asyncio
import os
import sys

# Add parent directory to path to allow imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.old_models_sqlite import (
    User as SqlUser,
    Question as SqlQuestion,
    InterviewSession as SqlInterviewSession,
    SessionAnswer as SqlSessionAnswer,
    CodingSubmission as SqlCodingSubmission,
    AIInterviewSession as SqlAIInterviewSession,
    AIInterviewMessage as SqlAIInterviewMessage,
    Resume as SqlResume,
    ResumeAnalysis as SqlResumeAnalysis,
    ResumeInterviewQuestion as SqlResumeInterviewQuestion,
)

from backend.models import (
    User as MongoUser,
    Question as MongoQuestion,
    InterviewSession as MongoInterviewSession,
    SessionAnswer as MongoSessionAnswer,
    CodingSubmission as MongoCodingSubmission,
    AIInterviewSession as MongoAIInterviewSession,
    AIInterviewMessage as MongoAIInterviewMessage,
    Resume as MongoResume,
    ResumeAnalysis as MongoResumeAnalysis,
    ResumeInterviewQuestion as MongoResumeInterviewQuestion,
)

from backend.database import init_db

# Connect to old SQLite database
SQLITE_URL = "sqlite:///./auth.db"
engine = create_engine(SQLITE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

async def migrate():
    print("Initializing MongoDB...")
    await init_db()

    db = SessionLocal()

    # Mappings to keep track of old SQLite integer IDs -> new MongoDB string ObjectIDs
    user_mapping = {}
    question_mapping = {}
    session_mapping = {}
    ai_session_mapping = {}
    resume_mapping = {}

    print("Migrating Users...")
    sql_users = db.query(SqlUser).all()
    for u in sql_users:
        mu = MongoUser(
            email=u.email,
            name=u.name,
            avatar_url=u.avatar_url,
            hashed_password=u.hashed_password,
            google_id=u.google_id,
            is_active=u.is_active,
            created_at=u.created_at,
            updated_at=u.updated_at
        )
        await mu.insert()
        user_mapping[u.id] = str(mu.id)

    print("Migrating Questions...")
    sql_questions = db.query(SqlQuestion).all()
    for q in sql_questions:
        mq = MongoQuestion(
            text=q.text,
            category=q.category,
            difficulty=q.difficulty,
            keywords=q.keywords,
            hint=q.hint,
            sample_answer=q.sample_answer
        )
        await mq.insert()
        question_mapping[q.id] = str(mq.id)

    print("Migrating Interview Sessions...")
    sql_sessions = db.query(SqlInterviewSession).all()
    for s in sql_sessions:
        if s.user_id not in user_mapping:
            continue
        ms = MongoInterviewSession(
            user_id=user_mapping[s.user_id],
            category=s.category,
            difficulty=s.difficulty,
            total_score=s.total_score,
            status=s.status,
            num_questions=s.num_questions,
            created_at=s.created_at,
            finished_at=s.finished_at
        )
        await ms.insert()
        session_mapping[s.id] = str(ms.id)

    print("Migrating Session Answers...")
    sql_answers = db.query(SqlSessionAnswer).all()
    for a in sql_answers:
        if a.session_id not in session_mapping or a.question_id not in question_mapping:
            continue
        ma = MongoSessionAnswer(
            session_id=session_mapping[a.session_id],
            question_id=question_mapping[a.question_id],
            user_answer=a.user_answer,
            ai_score=a.ai_score,
            ai_feedback=a.ai_feedback,
            time_taken=a.time_taken,
            created_at=a.created_at
        )
        await ma.insert()

    print("Migrating Coding Submissions...")
    sql_codings = db.query(SqlCodingSubmission).all()
    for c in sql_codings:
        if c.user_id not in user_mapping:
            continue
        mc = MongoCodingSubmission(
            user_id=user_mapping[c.user_id],
            problem_id=c.problem_id,
            problem_title=c.problem_title,
            language=c.language,
            code=c.code,
            status=c.status,
            score=c.score,
            passed_cases=c.passed_cases,
            total_cases=c.total_cases,
            runtime_ms=c.runtime_ms,
            created_at=c.created_at
        )
        await mc.insert()

    print("Migrating AI Interview Sessions...")
    sql_ai_sessions = db.query(SqlAIInterviewSession).all()
    for s in sql_ai_sessions:
        if s.user_id not in user_mapping:
            continue
        ms = MongoAIInterviewSession(
            user_id=user_mapping[s.user_id],
            round_type=s.round_type,
            status=s.status,
            target_company=s.target_company,
            target_role=s.target_role,
            difficulty=s.difficulty,
            total_questions=s.total_questions,
            avg_score=s.avg_score,
            duration_secs=s.duration_secs,
            created_at=s.created_at,
            completed_at=s.completed_at
        )
        await ms.insert()
        ai_session_mapping[s.id] = str(ms.id)

    print("Migrating AI Interview Messages...")
    sql_ai_messages = db.query(SqlAIInterviewMessage).all()
    for m in sql_ai_messages:
        if m.session_id not in ai_session_mapping:
            continue
        mm = MongoAIInterviewMessage(
            session_id=ai_session_mapping[m.session_id],
            role=m.role,
            content=m.content,
            score=m.score,
            feedback=m.feedback,
            strengths=m.strengths,
            improvements=m.improvements,
            created_at=m.created_at
        )
        await mm.insert()

    print("Migrating Resumes...")
    sql_resumes = db.query(SqlResume).all()
    for r in sql_resumes:
        if r.user_id not in user_mapping:
            continue
        mr = MongoResume(
            user_id=user_mapping[r.user_id],
            filename=r.filename,
            original_filename=r.original_filename,
            file_path=r.file_path,
            file_size=r.file_size,
            version=r.version,
            is_active=r.is_active,
            created_at=r.created_at,
            updated_at=r.updated_at
        )
        await mr.insert()
        resume_mapping[r.id] = str(mr.id)

    print("Migrating Resume Analyses...")
    sql_analyses = db.query(SqlResumeAnalysis).all()
    for a in sql_analyses:
        if a.resume_id not in resume_mapping or a.user_id not in user_mapping:
            continue
        ma = MongoResumeAnalysis(
            resume_id=resume_mapping[a.resume_id],
            user_id=user_mapping[a.user_id],
            skills=a.skills,
            education=a.education,
            experience=a.experience,
            projects=a.projects,
            certifications=a.certifications,
            technologies=a.technologies,
            achievements=a.achievements,
            summary_text=a.summary_text,
            overall_score=a.overall_score,
            ats_score=a.ats_score,
            technical_score=a.technical_score,
            project_score=a.project_score,
            communication_score=a.communication_score,
            readability_score=a.readability_score,
            experience_score=a.experience_score,
            confidence_score=a.confidence_score,
            missing_sections=a.missing_sections,
            weak_areas=a.weak_areas,
            ats_issues=a.ats_issues,
            suggestions=a.suggestions,
            keyword_analysis=a.keyword_analysis,
            skill_gap_analysis=a.skill_gap_analysis,
            strengths=a.strengths,
            weaknesses=a.weaknesses,
            ats_breakdown=a.ats_breakdown,
            improvement_roadmap=a.improvement_roadmap,
            target_role=a.target_role,
            target_company=a.target_company,
            created_at=a.created_at
        )
        await ma.insert()

    print("Migrating Resume Interview Questions...")
    sql_resume_qs = db.query(SqlResumeInterviewQuestion).all()
    for q in sql_resume_qs:
        if q.resume_id not in resume_mapping or q.user_id not in user_mapping:
            continue
        mq = MongoResumeInterviewQuestion(
            resume_id=resume_mapping[q.resume_id],
            user_id=user_mapping[q.user_id],
            question_text=q.question_text,
            category=q.category,
            difficulty=q.difficulty,
            source_section=q.source_section,
            source_detail=q.source_detail,
            created_at=q.created_at
        )
        await mq.insert()

    print("Migration Complete! 🎉")
    db.close()

if __name__ == "__main__":
    asyncio.run(migrate())
