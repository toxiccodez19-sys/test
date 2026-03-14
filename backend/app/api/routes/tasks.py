"""Task API routes for DevForge AI."""

import uuid
import asyncio
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse

from app.models.schemas import TaskCreate, TaskResponse, TaskStatus
from app.workflow.engine import run_workflow
from app.logging_system.logger import activity_logger
from app.tasks.worker import task_store

router = APIRouter(prefix="/api/tasks", tags=["tasks"])

# In-memory store for direct (non-Celery) execution
_running_tasks: dict = {}


async def _execute_workflow(task_id: str, prompt: str, language: str, framework: Optional[str]):
    """Execute workflow in background."""
    try:
        task_store[task_id]["status"] = "running"
        final_state = await run_workflow(task_id, prompt, language, framework)

        task_store[task_id].update({
            "status": final_state.get("status", "completed"),
            "plan": final_state.get("plan"),
            "architecture": final_state.get("architecture"),
            "subtasks": final_state.get("subtasks"),
            "generated_tests": final_state.get("generated_tests"),
            "generated_code": final_state.get("generated_code"),
            "execution_result": final_state.get("execution_result"),
            "test_results": final_state.get("test_results"),
            "debug_iterations": final_state.get("debug_iterations", 0),
            "error_log": final_state.get("error_log", []),
            "final_code": final_state.get("final_code"),
            "completed_at": datetime.utcnow().isoformat(),
        })
    except Exception as e:
        task_store[task_id].update({
            "status": "failed",
            "error": str(e),
            "completed_at": datetime.utcnow().isoformat(),
        })


@router.post("", response_model=None)
async def create_task(task: TaskCreate, background_tasks: BackgroundTasks):
    """Create a new development task."""
    task_id = str(uuid.uuid4())

    task_data = {
        "id": task_id,
        "prompt": task.prompt,
        "language": task.language or "python",
        "framework": task.framework,
        "status": "pending",
        "created_at": datetime.utcnow().isoformat(),
        "plan": None,
        "architecture": None,
        "subtasks": None,
        "generated_tests": None,
        "generated_code": None,
        "execution_result": None,
        "test_results": None,
        "debug_iterations": 0,
        "error_log": [],
        "final_code": None,
    }
    task_store[task_id] = task_data

    # Try Celery first, fall back to background task
    try:
        from app.tasks.worker import run_development_task
        celery_result = run_development_task.delay(
            task_id, task.prompt, task.language or "python", task.framework
        )
        task_store[task_id]["celery_task_id"] = celery_result.id
    except Exception:
        # Celery not available, use FastAPI background tasks
        background_tasks.add_task(
            _execute_workflow,
            task_id,
            task.prompt,
            task.language or "python",
            task.framework,
        )

    return JSONResponse(
        status_code=202,
        content={"id": task_id, "status": "pending", "message": "Task created and queued"},
    )


@router.get("")
async def list_tasks(skip: int = 0, limit: int = 20):
    """List all tasks."""
    tasks = list(task_store.values())
    tasks.sort(key=lambda t: t.get("created_at", ""), reverse=True)
    return {
        "tasks": tasks[skip:skip + limit],
        "total": len(tasks),
    }


@router.get("/{task_id}")
async def get_task(task_id: str):
    """Get task details by ID."""
    if task_id not in task_store:
        raise HTTPException(status_code=404, detail="Task not found")
    return task_store[task_id]


@router.get("/{task_id}/logs")
async def get_task_logs(task_id: str):
    """Get activity logs for a task."""
    logs = activity_logger.get_logs(task_id)
    return {
        "task_id": task_id,
        "logs": [
            {
                "id": log.id,
                "agent": log.agent.value,
                "event": log.event.value,
                "message": log.message,
                "data": log.data,
                "timestamp": log.timestamp.isoformat(),
            }
            for log in logs
        ],
    }


@router.get("/{task_id}/code")
async def get_task_code(task_id: str):
    """Get the generated code for a task."""
    if task_id not in task_store:
        raise HTTPException(status_code=404, detail="Task not found")

    task = task_store[task_id]
    return {
        "task_id": task_id,
        "final_code": task.get("final_code"),
        "generated_code": task.get("generated_code"),
        "generated_tests": task.get("generated_tests"),
    }


@router.delete("/{task_id}")
async def delete_task(task_id: str):
    """Delete a task."""
    if task_id not in task_store:
        raise HTTPException(status_code=404, detail="Task not found")
    del task_store[task_id]
    activity_logger.clear_logs(task_id)
    return {"message": "Task deleted"}
