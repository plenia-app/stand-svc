import logging
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

logger = logging.getLogger(__name__)

class Database:
    client: AsyncIOMotorClient = None
    db = None

db_instance = Database()

async def connect_to_mongo():
    logger.info(f"Connecting to MongoDB at {settings.mongodb_url.split('@')[-1]}...")
    db_instance.client = AsyncIOMotorClient(settings.mongodb_url)
    # Ping the server to check connection
    await db_instance.client.admin.command('ping')
    db_instance.db = db_instance.client[settings.database_name]
    logger.info("Connected to MongoDB successfully.")

async def close_mongo_connection():
    if db_instance.client:
        db_instance.client.close()
        logger.info("MongoDB connection closed.")

def get_collection(name: str):
    if db_instance.db is None:
        raise RuntimeError("Database not initialized. Call connect_to_mongo() first.")
    return db_instance.db[name]
