from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from backend.database import init_db
from backend.routers.auth_router import router as auth_router
from backend.routers.user_router import router as user_router
from backend.routers.interview_router import router as interview_router
from backend.routers.coding_router import router as coding_router
from backend.routers.ai_interview_router import router as ai_interview_router
from backend.routers.resume_router import router as resume_router
from backend.routers.roadmap_router import router as roadmap_router
from backend.routers.job_matching_router import router as job_matching_router
from backend.routers.job_market import router as job_market_router
from backend.config import get_settings

settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize MongoDB connection and Beanie ODM
    await init_db()
    yield


app = FastAPI(
    title="Vista-IQ API",
    description="Vista-IQ — AI-powered career prep platform with interviews, resume optimization, coding challenges & personalized roadmaps. Powered by Gemini AI.",
    version="2.0.0",
    lifespan=lifespan,
)

# ─── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL.rstrip('/'),
        "http://localhost:5500",
        "http://127.0.0.1:5500",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "null",  # allows file:// opened pages during dev
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ──────────────────────────────────────────────────────────────────
app.include_router(auth_router)
app.include_router(user_router)
app.include_router(interview_router)
app.include_router(coding_router)
app.include_router(ai_interview_router)
app.include_router(resume_router)
app.include_router(roadmap_router)
app.include_router(job_matching_router)
app.include_router(job_market_router)


@app.get("/", tags=["Health"])
def root():
    return {
        "name": "Vista-IQ API",
        "status": "running",
        "version": app.version,
        "documentation": "/docs",
        "redoc": "/redoc",
    }


@app.get("/health", tags=["Health"])
def health():
    return {
        "status": "healthy",
        "service": "Vista-IQ API",
        "version": app.version,
    }
