"""Architecture Agent - Designs the project structure and technology choices."""

import json
from typing import Dict, Any

from app.agents.base import ollama_client
from app.logging_system.logger import activity_logger
from app.models.schemas import AgentType, LogEvent


SYSTEM_PROMPT = """You are a software architecture expert. Design the project structure based on the development plan.

You MUST respond with valid JSON in this exact format:
{
    "project_name": "project_name",
    "structure": {
        "filename.py": "Description of what this file does"
    },
    "dependencies": ["dep1", "dep2"],
    "patterns": ["Pattern1", "Pattern2"],
    "entry_point": "main.py"
}

Keep the architecture clean and follow best practices for the given language/framework."""


async def run_architect(task_id: str, prompt: str, plan: Dict[str, Any], language: str, framework: str = None) -> Dict[str, Any]:
    """Design the project architecture."""
    activity_logger.log(
        task_id=task_id,
        agent=AgentType.ARCHITECT,
        event=LogEvent.ARCHITECTURE_DESIGNED,
        message="Designing project architecture...",
    )

    user_prompt = f"""Design the project architecture for the following:

Original Task: {prompt}
Language: {language}
{f'Framework: {framework}' if framework else ''}

Development Plan:
{json.dumps(plan, indent=2)}

Design a clean, maintainable project structure."""

    response = await ollama_client.generate(
        prompt=user_prompt,
        system_prompt=SYSTEM_PROMPT,
        temperature=0.3,
    )

    try:
        architecture = json.loads(response)
    except json.JSONDecodeError:
        architecture = {
            "project_name": "generated_project",
            "structure": {"main.py": "Main entry point"},
            "dependencies": [],
            "patterns": [],
            "entry_point": "main.py",
        }

    activity_logger.log(
        task_id=task_id,
        agent=AgentType.ARCHITECT,
        event=LogEvent.ARCHITECTURE_DESIGNED,
        message=f"Architecture designed with {len(architecture.get('structure', {}))} files",
        data=architecture,
    )

    return architecture
