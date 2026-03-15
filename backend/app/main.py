"""DevForge AI - Main FastAPI Application."""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import asyncio

from app.api.routes import tasks, agents, health
from app.logging_system.logger import activity_logger
from app.config import settings

app = FastAPI(
    title="DevForge AI",
    description="Autonomous AI Developer Platform",
    version="1.0.0",
)

# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Include routers
app.include_router(health.router)
app.include_router(tasks.router)
app.include_router(agents.router)


# WebSocket connections for real-time updates
_ws_connections: dict[str, list[WebSocket]] = {}


@app.websocket("/ws/{task_id}")
async def websocket_endpoint(websocket: WebSocket, task_id: str):
    """WebSocket endpoint for real-time task updates."""
    await websocket.accept()

    if task_id not in _ws_connections:
        _ws_connections[task_id] = []
    _ws_connections[task_id].append(websocket)

    try:
        last_log_count = 0
        while True:
            logs = activity_logger.get_logs(task_id)
            if len(logs) > last_log_count:
                new_logs = logs[last_log_count:]
                for log in new_logs:
                    await websocket.send_json({
                        "type": "log",
                        "data": {
                            "id": log.id,
                            "agent": log.agent.value,
                            "event": log.event.value,
                            "message": log.message,
                            "data": log.data,
                            "timestamp": log.timestamp.isoformat(),
                        },
                    })
                last_log_count = len(logs)

            from app.tasks.worker import task_store
            task = task_store.get(task_id, {})
            if task.get("status") in ("completed", "failed"):
                await websocket.send_json({
                    "type": "complete",
                    "data": {
                        "status": task.get("status"),
                        "final_code": task.get("final_code"),
                    },
                })
                break

            await asyncio.sleep(1)
    except WebSocketDisconnect:
        pass
    finally:
        if task_id in _ws_connections:
            _ws_connections[task_id].remove(websocket)
            if not _ws_connections[task_id]:
                del _ws_connections[task_id]


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": "DevForge AI",
        "version": "1.0.0",
        "description": "Autonomous AI Developer Platform",
        "docs": "/docs",
    }
