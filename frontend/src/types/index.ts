export interface Task {
  id: string;
  prompt: string;
  status: TaskStatus;
  language: string;
  framework?: string;
  created_at: string;
  completed_at?: string;
  plan?: Plan;
  architecture?: Architecture;
  subtasks?: Subtask[];
  generated_tests?: string;
  generated_code?: Record<string, string>;
  execution_result?: ExecutionResult;
  test_results?: TestResult;
  debug_iterations: number;
  error_log: ErrorLogEntry[];
  final_code?: Record<string, string>;
}

export type TaskStatus =
  | "pending"
  | "running"
  | "planning"
  | "architecting"
  | "decomposing"
  | "generating_tests"
  | "coding"
  | "executing"
  | "testing"
  | "debugging"
  | "refactoring"
  | "completed"
  | "failed";

export interface Plan {
  title: string;
  steps: { step: number; description: string }[];
  estimated_complexity: string;
  key_considerations?: string[];
  technologies?: string[];
}

export interface Architecture {
  project_name: string;
  structure: Record<string, string>;
  dependencies: string[];
  patterns: string[];
  entry_point?: string;
}

export interface Subtask {
  id: number;
  title: string;
  description?: string;
  priority: string;
  dependencies: number[];
  files_involved?: string[];
}

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exit_code: number;
  timed_out: boolean;
}

export interface TestResult {
  passed: boolean;
  stdout: string;
  stderr: string;
  exit_code: number;
}

export interface ErrorLogEntry {
  iteration: number;
  error: string;
  test_output: string;
}

export interface AgentLog {
  id: string;
  agent: string;
  event: string;
  message: string;
  data?: Record<string, unknown>;
  timestamp: string;
}

export interface Agent {
  name: string;
  display_name: string;
  description: string;
  status: string;
  icon: string;
}
