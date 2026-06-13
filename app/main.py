import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.config import settings
from app.database import close_mongo_connection, connect_to_mongo, db_instance
from app.routers.stands import router as stands_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    try:
        await connect_to_mongo()
    except Exception as e:
        logger.error(f"Error during startup database connection: {e}")
        logger.warning("Application started but database is offline. Endpoints will fail until MongoDB is running.")
    
    yield
    
    # Shutdown actions
    await close_mongo_connection()

app = FastAPI(
    title="Conference Stand Registry API",
    description="API and Management Dashboard to register stands, games, and activities for conference events.",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS Middleware to allow open access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the API routes
app.include_router(stands_router)

# Ensure static folder exists and mount it
os.makedirs("static", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def read_index():
    """
    Serve the single-page application dashboard at the root URL.
    """
    index_path = os.path.join("static", "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {
        "message": "Conference Stand Registry API is running. Go to /docs for API documentation. Dashboard index.html is missing.",
        "docs": "/docs"
    }


@app.get("/health", tags=["Health"])
async def health():
    if db_instance.db is None:
        raise RuntimeError("MongoDB is not connected")
    await db_instance.db.command("ping")
    return {"status": "ok"}
