from fastapi import APIRouter
from backend.job_market_service import search_jobs

router = APIRouter()

@router.get("/jobs/search")
async def jobs(
    role: str,
    location: str = "",
    lat: float = None,
    lng: float = None,
    page: int = 1
):
    return search_jobs(
        role=role,
        location=location,
        lat=lat,
        lng=lng,
        page=page
    )
