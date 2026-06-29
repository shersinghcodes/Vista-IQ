from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from backend.config import get_settings
from backend.models import __beanie_models__  # We will define this list in models.py
import certifi

settings = get_settings()

async def init_db():
    """Initialize MongoDB connection and Beanie ODM."""
    client = AsyncIOMotorClient(settings.MONGODB_URI, tlsCAFile=certifi.where())
    # The database name is parsed from the URI or we can specify it explicitly.
    # We'll just pass the default db from the client (e.g. client.vista_iq)
    # Motor doesn't have a default db if not specified in URI, so we extract it.
    db_name = settings.MONGODB_URI.split('/')[-1].split('?')[0]
    if not db_name:
        db_name = "vista_iq"
    
    await init_beanie(
        database=client[db_name],
        document_models=__beanie_models__
    )
