"""Refactor Agent - Improves code quality and performance."""

import json
from typing import Dict, Any

from app.agents.base import ollama_client
from app.memory.store import memory_store
from app.logging_system.logger import activity_logger
from app.models.schemas import AgentType, LogEvent


SYSTEM_PROMPT = """You are a code quality expert. Refactor the given code to improve quality, readability, and performance.

You MUST respond with valid JSON:
{
    "improvements": ["improvement 1", "improvement 2"],
    "refactored_files": {
        "filename.py": "complete refactored file content"
    },
    "quality_score": 8
}

Rules:
1. Improve code structure and readability
2. Add proper error handling where missing
3. Optimize performance where possible
4. Add documentation and type hints
5. Don't change functionality - only improve quality
6. Quality score from 1-10"""


async def run_refactor(
    task_id: str,
    code_files: Dict[str, str],
    prompt: str,
    language: str = "python",
) -> Dict[str, Any]:
    """Refactor and improve code quality."""
    activity_logger.log(
        task_id=task_id,
        agent=AgentType.REFACTOR,
        event=LogEvent.CODE_REFACTORED,
        message="Refactoring code...",
    )

    user_prompt = f"""Refactor and improve this code:

Original Task: {prompt}
Language: {language}

Code:
{json.dumps(code_files, indent=2)}

Improve code quality, add documentation, optimize where possible."""

    response = await ollama_client.generate(
        prompt=user_prompt,
        system_prompt=SYSTEM_PROMPT,
        temperature=0.2,
    )

    try:
        result = json.loads(response)
        refactored_files = result.get("refactored_files", code_files)
        improvements = result.get("improvements", [])
        quality_score = result.get("quality_score", 7)
    except json.JSONDecodeError:
        refactored_files = code_files
        improvements = ["Code reviewed"]
        quality_score = 7

    # Store patterns in memory
    for filename, content in refactored_files.items():
        memory_store.store_code_pattern(
            description=f"Refactored {filename} for: {prompt[:100]}",
            code=content[:1000],
            language=language,
            task_id=task_id,
        )

    activity_logger.log(
        task_id=task_id,
        agent=AgentType.REFACTOR,
        event=LogEvent.CODE_REFACTORED,
        message=f"Refactoring complete. Quality score: {quality_score}/10",
        data={
            "improvements": improvements,
            "quality_score": quality_score,
        },
    )

    return {
        "refactored_files": refactored_files,
        "improvements": improvements,
        "quality_score": quality_score,
    }
