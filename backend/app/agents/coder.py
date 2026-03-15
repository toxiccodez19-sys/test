"""Coder Agent - Generates code based on tasks and architecture."""

import json
from typing import Dict, Any, Optional

from app.agents.base import ollama_client
from app.logging_system.logger import activity_logger
from app.models.schemas import AgentType, LogEvent


SYSTEM_PROMPT = """You are an expert software developer. Generate production-quality code based on the given specifications.

Rules:
1. Write clean, well-documented code
2. Follow best practices for the given language
3. Include proper error handling
4. Add type hints (Python) or types (TypeScript)
5. Make the code modular and testable

You MUST respond with valid JSON mapping filenames to their contents:
{
    "main.py": "file content here",
    "models.py": "file content here",
    "requirements.txt": "dep1\\ndep2"
}

Output ONLY the JSON object, no explanations."""


async def run_coder(
    task_id: str,
    prompt: str,
    architecture: Dict[str, Any],
    subtasks: list,
    tests: str,
    language: str = "python",
    memory_context: Optional[str] = None,
    existing_code: Optional[Dict[str, str]] = None,
) -> Dict[str, str]:
    """Generate code for the project."""
    activity_logger.log(
        task_id=task_id,
        agent=AgentType.CODER,
        event=LogEvent.CODE_GENERATED,
        message="Generating code...",
    )

    user_prompt = f"""Generate the complete code for this project:

Task: {prompt}
Language: {language}

Architecture:
{json.dumps(architecture, indent=2)}

Subtasks:
{json.dumps(subtasks, indent=2)}

Tests to pass:
{tests}
"""

    if memory_context:
        user_prompt += f"\nRelevant patterns from memory:\n{memory_context}\n"

    if existing_code:
        user_prompt += f"\nExisting code to improve:\n{json.dumps(existing_code, indent=2)}\n"

    user_prompt += "\nGenerate ALL files needed. Output as JSON mapping filenames to contents."

    response = await ollama_client.generate(
        prompt=user_prompt,
        system_prompt=SYSTEM_PROMPT,
        temperature=0.2,
        max_tokens=8192,
    )

    try:
        code_files = json.loads(response)
        if not isinstance(code_files, dict):
            code_files = {"main.py": response}
    except json.JSONDecodeError:
        code_files = _extract_code_files(response)

    activity_logger.log(
        task_id=task_id,
        agent=AgentType.CODER,
        event=LogEvent.CODE_GENERATED,
        message=f"Generated {len(code_files)} files",
        data={"files": list(code_files.keys())},
    )

    return code_files


def _extract_code_files(response: str) -> Dict[str, str]:
    """Try to extract code files from a non-JSON response."""
    if "```" in response:
        blocks = response.split("```")
        code = blocks[1] if len(blocks) >= 3 else response
        if code.startswith("python\n"):
            code = code[7:]
        elif code.startswith("json\n"):
            code = code[5:]
            try:
                return json.loads(code)
            except json.JSONDecodeError:
                pass
        return {"main.py": code.strip()}
    return {"main.py": response.strip()}
