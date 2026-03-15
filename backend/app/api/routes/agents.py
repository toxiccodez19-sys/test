"""Agent status and monitoring routes for DevForge AI."""

from fastapi import APIRouter

from app.agents.base import ollama_client
from app.memory.store import memory_store
from app.sandbox.docker_runner import docker_runner
from app.models.schemas import AgentType

router = APIRouter(prefix="/api/agents", tags=["agents"])


@router.get("")
async def list_agents():
    """List all available agents and their status."""
    agents = [
        {
            "name": AgentType.PLANNER.value,
            "display_name": "Planner Agent",
            "description": "Analyzes the task and generates a high-level development plan",
            "status": "active",
            "icon": "brain",
        },
        {
            "name": AgentType.ARCHITECT.value,
            "display_name": "Architecture Agent",
            "description": "Designs the project structure and technology choices",
            "status": "active",
            "icon": "building",
        },
        {
            "name": AgentType.DECOMPOSER.value,
            "display_name": "Task Decomposer",
            "description": "Breaks the plan into smaller development steps",
            "status": "active",
            "icon": "scissors",
        },
        {
            "name": AgentType.CODER.value,
            "display_name": "Coder Agent",
            "description": "Generates code based on tasks",
            "status": "active",
            "icon": "code",
        },
        {
            "name": AgentType.TEST_GENERATOR.value,
            "display_name": "Test Generator",
            "description": "Generates unit tests before coding",
            "status": "active",
            "icon": "flask",
        },
        {
            "name": AgentType.EXECUTOR.value,
            "display_name": "Execution Runner",
            "description": "Runs code inside Docker containers",
            "status": "active" if docker_runner.is_available else "degraded",
            "icon": "play",
        },
        {
            "name": AgentType.DEBUGGER.value,
            "display_name": "Debugger Agent",
            "description": "Fixes errors based on logs and failing tests",
            "status": "active",
            "icon": "bug",
        },
        {
            "name": AgentType.REFACTOR.value,
            "display_name": "Refactor Agent",
            "description": "Improves code quality and performance",
            "status": "active",
            "icon": "sparkles",
        },
    ]
    return {"agents": agents}


@router.get("/health")
async def agent_health():
    """Check health of all agent dependencies."""
    ollama_available = await ollama_client.check_health()
    memory_stats = memory_store.get_stats()

    return {
        "ollama": {
            "available": ollama_available,
            "model": ollama_client.model,
            "url": ollama_client.base_url,
        },
        "docker": {
            "available": docker_runner.is_available,
        },
        "memory": memory_stats,
    }


@router.get("/memory/stats")
async def memory_stats():
    """Get memory store statistics."""
    return memory_store.get_stats()
