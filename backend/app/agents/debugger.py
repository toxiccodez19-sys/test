"""Debugger Agent - Fixes errors based on logs and failing tests."""

import json
from typing import Dict, Any, Optional

from app.agents.base import ollama_client
from app.memory.store import memory_store
from app.logging_system.logger import activity_logger
from app.models.schemas import AgentType, LogEvent


SYSTEM_PROMPT = """You are an expert debugger. Analyze the error and fix the code.

You MUST respond with valid JSON:
{
    "diagnosis": "Description of what went wrong",
    "fix_description": "What was fixed",
    "fixed_files": {
        "filename.py": "complete corrected file content"
    }
}

Rules:
1. Analyze the error message and traceback carefully
2. Fix the ROOT CAUSE, not just the symptoms
3. Return the complete fixed file contents
4. Preserve all working code - only change what's broken"""


async def run_debugger(
    task_id: str,
    code_files: Dict[str, str],
    error_output: str,
    test_output: str,
    language: str = "python",
    iteration: int = 1,
) -> Dict[str, Any]:
    """Debug and fix code errors."""
    activity_logger.log(
        task_id=task_id,
        agent=AgentType.DEBUGGER,
        event=LogEvent.ERROR_DETECTED,
        message=f"Debug iteration {iteration}: Analyzing errors...",
    )

    # Search memory for similar bugs
    similar_bugs = memory_store.search_similar_bugs(error_output[:500])
    memory_context = ""
    if similar_bugs:
        memory_context = "\n\nSimilar bugs found in memory:\n"
        for bug in similar_bugs:
            memory_context += f"- {bug['document'][:200]}\n"

    user_prompt = f"""Fix the following code errors:

Error Output:
{error_output[:2000]}

Test Output:
{test_output[:2000]}

Current Code:
{json.dumps(code_files, indent=2)}

Debug Iteration: {iteration}
{memory_context}

Analyze the error and provide the fixed code."""

    response = await ollama_client.generate(
        prompt=user_prompt,
        system_prompt=SYSTEM_PROMPT,
        temperature=0.2,
    )

    try:
        fix_result = json.loads(response)
        fixed_files = fix_result.get("fixed_files", code_files)
        diagnosis = fix_result.get("diagnosis", "Error analyzed and fixed")
        fix_desc = fix_result.get("fix_description", "Applied fix")
    except json.JSONDecodeError:
        fixed_files = code_files
        diagnosis = "Unable to parse fix response"
        fix_desc = response[:200]

    # Store the bug fix in memory
    memory_store.store_bug_fix(
        error=error_output[:500],
        fix=fix_desc,
        language=language,
        task_id=task_id,
    )

    activity_logger.log(
        task_id=task_id,
        agent=AgentType.DEBUGGER,
        event=LogEvent.BUG_FIXED,
        message=f"Fix applied: {fix_desc[:100]}",
        data={
            "diagnosis": diagnosis,
            "fix_description": fix_desc,
            "iteration": iteration,
        },
    )

    return {
        "fixed_files": fixed_files,
        "diagnosis": diagnosis,
        "fix_description": fix_desc,
    }
