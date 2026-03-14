"""Task Decomposer Agent - Breaks the plan into smaller development steps."""

import json
from typing import Dict, Any, List

from app.agents.base import ollama_client
from app.logging_system.logger import activity_logger
from app.models.schemas import AgentType, LogEvent


SYSTEM_PROMPT = """You are a project manager expert at breaking down complex tasks into smaller, actionable subtasks.

You MUST respond with valid JSON in this exact format:
{
    "subtasks": [
        {
            "id": 1,
            "title": "Task title",
            "description": "Detailed description",
            "priority": "high|medium|low",
            "dependencies": [],
            "files_involved": ["filename.py"]
        }
    ]
}

Each subtask should be small enough to implement in a single coding session."""


async def run_decomposer(
    task_id: str,
    prompt: str,
    plan: Dict[str, Any],
    architecture: Dict[str, Any],
) -> List[Dict[str, Any]]:
    """Break the plan into smaller development steps."""
    activity_logger.log(
        task_id=task_id,
        agent=AgentType.DECOMPOSER,
        event=LogEvent.TASKS_DECOMPOSED,
        message="Decomposing plan into subtasks...",
    )

    user_prompt = f"""Break down this development plan into smaller implementation subtasks:

Task: {prompt}

Plan:
{json.dumps(plan, indent=2)}

Architecture:
{json.dumps(architecture, indent=2)}

Create actionable subtasks that can be implemented step by step."""

    response = await ollama_client.generate(
        prompt=user_prompt,
        system_prompt=SYSTEM_PROMPT,
        temperature=0.3,
    )

    try:
        result = json.loads(response)
        subtasks = result.get("subtasks", [])
    except json.JSONDecodeError:
        subtasks = [
            {"id": 1, "title": "Implement main functionality", "priority": "high", "dependencies": []},
        ]

    activity_logger.log(
        task_id=task_id,
        agent=AgentType.DECOMPOSER,
        event=LogEvent.TASKS_DECOMPOSED,
        message=f"Decomposed into {len(subtasks)} subtasks",
        data={"subtasks": subtasks},
    )

    return subtasks
