"""Execution Runner Agent - Runs code inside Docker containers."""

from typing import Dict, Any, Optional

from app.sandbox.docker_runner import docker_runner
from app.logging_system.logger import activity_logger
from app.models.schemas import AgentType, LogEvent


async def run_executor(
    task_id: str,
    code_files: Dict[str, str],
    entrypoint: str = "main.py",
    language: str = "python",
) -> Dict[str, Any]:
    """Run the generated code in a sandbox."""
    activity_logger.log(
        task_id=task_id,
        agent=AgentType.EXECUTOR,
        event=LogEvent.CODE_EXECUTED,
        message=f"Executing code ({len(code_files)} files)...",
    )

    requirements = code_files.get("requirements.txt")
    result = docker_runner.run_code(
        files=code_files,
        entrypoint=entrypoint,
        language=language,
        requirements=requirements,
    )

    if result["exit_code"] == 0:
        activity_logger.log(
            task_id=task_id,
            agent=AgentType.EXECUTOR,
            event=LogEvent.CODE_EXECUTED,
            message="Code executed successfully",
            data={"stdout": result["stdout"][:500]},
        )
    else:
        activity_logger.log(
            task_id=task_id,
            agent=AgentType.EXECUTOR,
            event=LogEvent.ERROR_DETECTED,
            message=f"Execution failed (exit code {result['exit_code']})",
            data={"stderr": result["stderr"][:500]},
        )

    return result


async def run_tests(
    task_id: str,
    code_files: Dict[str, str],
    test_code: str,
    language: str = "python",
) -> Dict[str, Any]:
    """Run tests against the generated code."""
    activity_logger.log(
        task_id=task_id,
        agent=AgentType.EXECUTOR,
        event=LogEvent.TESTS_EXECUTED,
        message="Running tests...",
    )

    all_files = dict(code_files)
    all_files["test_main.py"] = test_code

    result = docker_runner.run_tests(
        files=all_files,
        test_file="test_main.py",
        language=language,
        requirements=code_files.get("requirements.txt"),
    )

    passed = result["exit_code"] == 0
    activity_logger.log(
        task_id=task_id,
        agent=AgentType.EXECUTOR,
        event=LogEvent.TESTS_EXECUTED,
        message=f"Tests {'passed' if passed else 'failed'}",
        data={
            "passed": passed,
            "stdout": result["stdout"][:500],
            "stderr": result["stderr"][:500],
        },
    )

    return {**result, "passed": passed}
