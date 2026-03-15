"""Pydantic models for DevForge AI."""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from enum import Enum
from datetime import datetime
import uuid


class TaskStatus(str, Enum):
    PENDING = "pending"
    PLANNING = "planning"
    ARCHITECTING = "architecting"
    DECOMPOSING = "decomposing"
    GENERATING_TESTS = "generating_tests"
    CODING = "coding"
    EXECUTING = "executing"
    TESTING = "testing"
    DEBUGGING = "debugging"
    REFACTORING = "refactoring"
    COMPLETED = "completed"
    FAILED = "failed"


class AgentType(str, Enum):
    PLANNER = "planner"
    ARCHITECT = "architect"
    DECOMPOSER = "decomposer"
    CODER = "coder"
    TEST_GENERATOR = "test_generator"
    EXECUTOR = "executor"
    DEBUGGER = "debugger"
    REFACTOR = "refactor"


class LogEvent(str, Enum):
    TASK_RECEIVED = "TASK_RECEIVED"
    PLAN_CREATED = "PLAN_CREATED"
    ARCHITECTURE_DESIGNED = "ARCHITECTURE_DESIGNED"
    TASKS_DECOMPOSED = "TASKS_DECOMPOSED"
    TESTS_GENERATED = "TESTS_GENERATED"
    CODE_GENERATED = "CODE_GENERATED"
    CODE_EXECUTED = "CODE_EXECUTED"
    TESTS_EXECUTED = "TESTS_EXECUTED"
    ERROR_DETECTED = "ERROR_DETECTED"
    BUG_FIXED = "BUG_FIXED"
    CODE_REFACTORED = "CODE_REFACTORED"
    TASK_COMPLETED = "TASK_COMPLETED"
    TASK_FAILED = "TASK_FAILED"


# --- Request Models ---

class TaskCreate(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=5000, description="Development task description")
    language: Optional[str] = Field(default="python", description="Primary programming language")
    framework: Optional[str] = Field(default=None, description="Framework preference")


# --- Response Models ---

class TaskResponse(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    prompt: str
    status: TaskStatus = TaskStatus.PENDING
    language: str = "python"
    framework: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    plan: Optional[Dict[str, Any]] = None
    architecture: Optional[Dict[str, Any]] = None
    subtasks: Optional[list] = None
    generated_tests: Optional[str] = None
    generated_code: Optional[Dict[str, str]] = None
    execution_result: Optional[Dict[str, Any]] = None
    test_results: Optional[Dict[str, Any]] = None
    debug_iterations: int = 0
    final_code: Optional[Dict[str, str]] = None
    error_log: Optional[list] = None


class AgentActivityLog(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    task_id: str
    agent: AgentType
    event: LogEvent
    message: str
    data: Optional[Dict[str, Any]] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class TaskListResponse(BaseModel):
    tasks: list[TaskResponse]
    total: int


class WorkflowState(BaseModel):
    """State object passed through the LangGraph workflow."""
    task_id: str
    prompt: str
    language: str = "python"
    framework: Optional[str] = None
    status: TaskStatus = TaskStatus.PENDING
    plan: Optional[Dict[str, Any]] = None
    architecture: Optional[Dict[str, Any]] = None
    subtasks: Optional[list] = None
    generated_tests: Optional[str] = None
    generated_code: Optional[Dict[str, str]] = None
    execution_result: Optional[Dict[str, Any]] = None
    test_results: Optional[Dict[str, Any]] = None
    debug_iterations: int = 0
    error_log: list = Field(default_factory=list)
    final_code: Optional[Dict[str, str]] = None
    memory_context: Optional[str] = None
