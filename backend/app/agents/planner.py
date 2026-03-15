"""Planner Agent - Analyzes the task and generates a high-level development plan."""

import json
from typing import Dict, Any

from app.agents.base import ollama_client
from app.logging_system.logger import activity_logger
from app.models.schemas import AgentType, LogEvent


SYSTEM_PROMPT = """You are a senior software architect and planner. Your job is to analyze a development task
and create a detailed, structured development plan.

You MUST respond with valid JSON in this exact format:
{
    "title": "Brief title for the plan",
    "steps": [
        {"step": 1, "description": "Step description"},
        {"step": 2, "description": "Step description"}
    ],
    "estimated_complexity": "low|medium|high",
    "key_considerations": ["consideration 1", "consideration 2"],
    "technologies": ["tech1", "tech2"]
}

Be thorough but practical. Focus on actionable steps."""


async def run_planner(task_id: str, prompt: str, language: str, framework: str = None) -> Dict[str, Any]:
    """Analyze the task and generate a development plan."""
    activity_logger.log(
        task_id=task_id,
        agent=AgentType.PLANNER,
        event=LogEvent.TASK_RECEIVED,
        message=f"Analyzing task: {prompt[:100]}...",
    )

    user_prompt = f"""Create a development plan for the following task:

Task: {prompt}
Language: {language}
{f'Framework: {framework}' if framework else ''}

Provide a structured plan with clear steps."""

    response = await ollama_client.generate(
        prompt=user_prompt,
        system_prompt=SYSTEM_PROMPT,
        temperature=0.3,
    )

    try:
        plan = json.loads(response)
    except json.JSONDecodeError:
        plan = {
            "title": "Development Plan",
            "steps": [{"step": 1, "description": response}],
            "estimated_complexity": "medium",
        }

    activity_logger.log(
        task_id=task_id,
        agent=AgentType.PLANNER,
        event=LogEvent.PLAN_CREATED,
        message=f"Plan created: {plan.get('title', 'Untitled')}",
        data=plan,
    )

    return plan
