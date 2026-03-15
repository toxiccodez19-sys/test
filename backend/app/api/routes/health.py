"""Health check routes for DevForge AI."""

from fastapi import APIRouter
import redis.asyncio as aioredis

from app.config import settings

router = APIRouter(tags=["health"])


@router.get("/healthz")
async def healthz():
    """Basic health check."""
    return {"status": "ok", "service": "DevForge AI"}


@router.get("/api/health")
async def detailed_health():
    """Detailed health check with dependency statuses."""
    health = {
        "status": "ok",
        "service": "DevForge AI",
        "dependencies": {},
    }

    # Check Redis
    try:
        r = aioredis.from_url(settings.redis_url, socket_timeout=2)
        await r.ping()
        health["dependencies"]["redis"] = {"status": "connected"}
        await r.close()
    except Exception as e:
        health["dependencies"]["redis"] = {"status": "disconnected", "error": str(e)}

    return health
