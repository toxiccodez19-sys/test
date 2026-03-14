"""LangGraph-based Agent Workflow Engine for DevForge AI.

Orchestrates the flow: Planner -> Architect -> Decomposer -> Test Generator ->
Coder -> Executor -> Tester -> Debugger (loop) -> Refactor -> Done
"""

from typing import TypedDict, Optional, Dict, Any, Annotated
from langgraph.graph import StateGraph, END

from app.agents.planner import run_planner
from app.agents.architect import run_architect
from app.agents.decomposer import run_decomposer
from app.agents.test_generator import run_test_generator
from app.agents.coder import run_coder
from app.agents.executor import run_executor, run_tests
from app.agents.debugger import run_debugger
from app.agents.refactor import run_refactor
from app.memory.store import memory_store
from app.logging_system.logger import activity_logger
from app.models.schemas import AgentType, LogEvent, TaskStatus
from app.config import settings


class WorkflowState(TypedDict, total=False):
    """State passed through the LangGraph workflow."""
    task_id: str
    prompt: str
    language: str
    framework: Optional[str]
    status: str
    plan: Optional[Dict[str, Any]]
    architecture: Optional[Dict[str, Any]]
    subtasks: Optional[list]
    generated_tests: Optional[str]
    generated_code: Optional[Dict[str, str]]
    execution_result: Optional[Dict[str, Any]]
    test_results: Optional[Dict[str, Any]]
    debug_iterations: int
    error_log: list
    final_code: Optional[Dict[str, str]]
    memory_context: Optional[str]


# --- Node Functions ---

async def planning_node(state: WorkflowState) -> WorkflowState:
    """Run the Planner Agent."""
    plan = await run_planner(
        task_id=state["task_id"],
        prompt=state["prompt"],
        language=state.get("language", "python"),
        framework=state.get("framework"),
    )
    return {**state, "plan": plan, "status": TaskStatus.PLANNING.value}


async def architecture_node(state: WorkflowState) -> WorkflowState:
    """Run the Architecture Agent."""
    architecture = await run_architect(
        task_id=state["task_id"],
        prompt=state["prompt"],
        plan=state["plan"],
        language=state.get("language", "python"),
        framework=state.get("framework"),
    )
    return {**state, "architecture": architecture, "status": TaskStatus.ARCHITECTING.value}


async def decomposition_node(state: WorkflowState) -> WorkflowState:
    """Run the Task Decomposer Agent."""
    subtasks = await run_decomposer(
        task_id=state["task_id"],
        prompt=state["prompt"],
        plan=state["plan"],
        architecture=state["architecture"],
    )
    return {**state, "subtasks": subtasks, "status": TaskStatus.DECOMPOSING.value}


async def test_generation_node(state: WorkflowState) -> WorkflowState:
    """Run the Test Generator Agent."""
    tests = await run_test_generator(
        task_id=state["task_id"],
        prompt=state["prompt"],
        architecture=state["architecture"],
        subtasks=state["subtasks"],
        language=state.get("language", "python"),
    )
    return {**state, "generated_tests": tests, "status": TaskStatus.GENERATING_TESTS.value}


async def coding_node(state: WorkflowState) -> WorkflowState:
    """Run the Coder Agent."""
    # Search memory for relevant patterns
    patterns = memory_store.search_patterns(state["prompt"])
    memory_context = None
    if patterns:
        memory_context = "\n".join([p["document"][:200] for p in patterns])

    code = await run_coder(
        task_id=state["task_id"],
        prompt=state["prompt"],
        architecture=state["architecture"],
        subtasks=state["subtasks"],
        tests=state.get("generated_tests", ""),
        language=state.get("language", "python"),
        memory_context=memory_context,
        existing_code=state.get("generated_code"),
    )
    return {
        **state,
        "generated_code": code,
        "memory_context": memory_context,
        "status": TaskStatus.CODING.value,
    }


async def execution_node(state: WorkflowState) -> WorkflowState:
    """Run the Execution Runner Agent."""
    code_files = state.get("generated_code", {})
    if not code_files:
        return {**state, "execution_result": {"exit_code": 1, "stderr": "No code to execute"}}

    # Determine entrypoint
    entrypoint = "main.py"
    arch = state.get("architecture", {})
    if isinstance(arch, dict):
        entrypoint = arch.get("entry_point", "main.py")

    result = await run_executor(
        task_id=state["task_id"],
        code_files=code_files,
        entrypoint=entrypoint,
        language=state.get("language", "python"),
    )
    return {**state, "execution_result": result, "status": TaskStatus.EXECUTING.value}


async def testing_node(state: WorkflowState) -> WorkflowState:
    """Run tests against the generated code."""
    code_files = state.get("generated_code", {})
    tests = state.get("generated_tests", "")

    if not code_files or not tests:
        return {
            **state,
            "test_results": {"passed": True, "stdout": "No tests to run", "exit_code": 0},
            "status": TaskStatus.TESTING.value,
        }

    result = await run_tests(
        task_id=state["task_id"],
        code_files=code_files,
        test_code=tests,
        language=state.get("language", "python"),
    )
    return {**state, "test_results": result, "status": TaskStatus.TESTING.value}


async def debugging_node(state: WorkflowState) -> WorkflowState:
    """Run the Debugger Agent."""
    iteration = state.get("debug_iterations", 0) + 1
    error_log = list(state.get("error_log", []))

    exec_result = state.get("execution_result", {})
    test_result = state.get("test_results", {})

    error_output = exec_result.get("stderr", "") or ""
    test_output = test_result.get("stdout", "") + "\n" + test_result.get("stderr", "")

    error_log.append({
        "iteration": iteration,
        "error": error_output[:500],
        "test_output": test_output[:500],
    })

    fix = await run_debugger(
        task_id=state["task_id"],
        code_files=state.get("generated_code", {}),
        error_output=error_output,
        test_output=test_output,
        language=state.get("language", "python"),
        iteration=iteration,
    )

    return {
        **state,
        "generated_code": fix.get("fixed_files", state.get("generated_code", {})),
        "debug_iterations": iteration,
        "error_log": error_log,
        "status": TaskStatus.DEBUGGING.value,
    }


async def refactoring_node(state: WorkflowState) -> WorkflowState:
    """Run the Refactor Agent."""
    result = await run_refactor(
        task_id=state["task_id"],
        code_files=state.get("generated_code", {}),
        prompt=state["prompt"],
        language=state.get("language", "python"),
    )

    final_code = result.get("refactored_files", state.get("generated_code", {}))

    activity_logger.log(
        task_id=state["task_id"],
        agent=AgentType.REFACTOR,
        event=LogEvent.TASK_COMPLETED,
        message="Task completed successfully!",
        data={"files": list(final_code.keys())},
    )

    return {
        **state,
        "final_code": final_code,
        "generated_code": final_code,
        "status": TaskStatus.COMPLETED.value,
    }


# --- Routing Functions ---

def should_debug(state: WorkflowState) -> str:
    """Determine if debugging is needed."""
    exec_result = state.get("execution_result", {})
    test_result = state.get("test_results", {})

    exec_failed = exec_result.get("exit_code", 0) != 0
    tests_failed = not test_result.get("passed", True)

    if exec_failed or tests_failed:
        if state.get("debug_iterations", 0) >= settings.max_debug_iterations:
            activity_logger.log(
                task_id=state["task_id"],
                agent=AgentType.DEBUGGER,
                event=LogEvent.TASK_FAILED,
                message=f"Max debug iterations ({settings.max_debug_iterations}) reached",
            )
            return "refactor"  # Give up debugging, refactor what we have
        return "debug"

    return "refactor"


def after_debug(state: WorkflowState) -> str:
    """After debugging, re-run execution and tests."""
    return "execute"


# --- Build the Workflow Graph ---

def build_workflow() -> StateGraph:
    """Build and compile the LangGraph workflow."""
    workflow = StateGraph(WorkflowState)

    # Add nodes
    workflow.add_node("plan", planning_node)
    workflow.add_node("architect", architecture_node)
    workflow.add_node("decompose", decomposition_node)
    workflow.add_node("generate_tests", test_generation_node)
    workflow.add_node("code", coding_node)
    workflow.add_node("execute", execution_node)
    workflow.add_node("test", testing_node)
    workflow.add_node("debug", debugging_node)
    workflow.add_node("refactor", refactoring_node)

    # Define edges
    workflow.set_entry_point("plan")
    workflow.add_edge("plan", "architect")
    workflow.add_edge("architect", "decompose")
    workflow.add_edge("decompose", "generate_tests")
    workflow.add_edge("generate_tests", "code")
    workflow.add_edge("code", "execute")
    workflow.add_edge("execute", "test")

    # Conditional: after testing, decide debug or refactor
    workflow.add_conditional_edges(
        "test",
        should_debug,
        {
            "debug": "debug",
            "refactor": "refactor",
        },
    )

    # After debugging, re-execute
    workflow.add_edge("debug", "execute")

    # Refactor is the final step
    workflow.add_edge("refactor", END)

    return workflow.compile()


# Compiled workflow instance
agent_workflow = build_workflow()


async def run_workflow(task_id: str, prompt: str, language: str = "python", framework: str = None) -> WorkflowState:
    """Execute the full agent workflow for a task."""
    initial_state: WorkflowState = {
        "task_id": task_id,
        "prompt": prompt,
        "language": language,
        "framework": framework,
        "status": TaskStatus.PENDING.value,
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
        "memory_context": None,
    }

    final_state = await agent_workflow.ainvoke(initial_state)
    return final_state
