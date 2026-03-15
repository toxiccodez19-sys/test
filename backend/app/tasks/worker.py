"""Celery task definitions for DevForge AI."""

import asyncio
import json
from datetime import datetime

from app.tasks.celery_app import celery_app
from app.workflow.engine import run_workflow
from app.logging_system.logger import activity_logger, logger
from app.models.schemas import AgentType, LogEvent


# In-memory task store (in production, use Redis or a database)
task_store: dict = {}


def _run_async(coro):
    """Run an async function from sync context."""
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as pool:
                future = pool.submit(asyncio.run, coro)
                return future.result()
        else:
            return loop.run_until_complete(coro)
    except RuntimeError:
        return asyncio.run(coro)


@celery_app.task(bind=True, name="devforge.run_task")
def run_development_task(self, task_id: str, prompt: str, language: str = "python", framework: str = None):
    """Execute the full development workflow as a Celery task."""
    logger.info(f"Starting Celery task for {task_id}")

    activity_logger.log(
        task_id=task_id,
        agent=AgentType.PLANNER,
        event=LogEvent.TASK_RECEIVED,
        message=f"Task received: {prompt[:100]}",
    )

    # Update task store
    task_store[task_id] = {
        "id": task_id,
        "prompt": prompt,
        "language": language,
        "framework": framework,
        "status": "running",
        "celery_task_id": self.request.id,
        "started_at": datetime.utcnow().isoformat(),
    }

    try:
        # Run the async workflow
        final_state = _run_async(
            run_workflow(task_id, prompt, language, framework)
        )

        # Update task store with results
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

        return task_store[task_id]

    except Exception as e:
        logger.error(f"Task {task_id} failed: {e}")
        task_store[task_id].update({
            "status": "failed",
            "error": str(e),
            "completed_at": datetime.utcnow().isoformat(),
        })
        raise
