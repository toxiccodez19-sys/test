"""Test Generator Agent - Generates unit tests before coding (TDD approach)."""

import json
from typing import Dict, Any

from app.agents.base import ollama_client
from app.logging_system.logger import activity_logger
from app.models.schemas import AgentType, LogEvent


SYSTEM_PROMPT = """You are a test-driven development expert. Generate comprehensive unit tests based on the task requirements.

Output ONLY valid Python test code using pytest. Include:
- Import statements
- Test functions with clear names
- Assertions that verify the expected behavior
- Edge cases

Do NOT include any explanatory text before or after the code. Only output code."""


async def run_test_generator(
    task_id: str,
    prompt: str,
    architecture: Dict[str, Any],
    subtasks: list,
    language: str = "python",
) -> str:
    """Generate unit tests for the project."""
    activity_logger.log(
        task_id=task_id,
        agent=AgentType.TEST_GENERATOR,
        event=LogEvent.TESTS_GENERATED,
        message="Generating unit tests...",
    )

    user_prompt = f"""Generate unit tests for the following project:

Task: {prompt}
Language: {language}

Architecture:
{json.dumps(architecture, indent=2)}

Subtasks:
{json.dumps(subtasks, indent=2)}

Generate comprehensive pytest tests that cover the main functionality.
Output ONLY Python test code, no explanations."""

    response = await ollama_client.generate(
        prompt=user_prompt,
        system_prompt=SYSTEM_PROMPT,
        temperature=0.2,
    )

    # Clean up the response - extract only code
    tests = _extract_code(response)

    activity_logger.log(
        task_id=task_id,
        agent=AgentType.TEST_GENERATOR,
        event=LogEvent.TESTS_GENERATED,
        message="Unit tests generated",
        data={"test_length": len(tests)},
    )

    return tests


def _extract_code(response: str) -> str:
    """Extract code from a response that may contain markdown code blocks."""
    if "```python" in response:
        blocks = response.split("```python")
        code_parts = []
        for block in blocks[1:]:
            code = block.split("```")[0]
            code_parts.append(code.strip())
        return "\n\n".join(code_parts)
    elif "```" in response:
        blocks = response.split("```")
        if len(blocks) >= 3:
            return blocks[1].strip()
    return response.strip()
