const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  retryAfter: number | null;

  constructor(message: string, status: number, retryAfter: number | null = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.retryAfter = retryAfter;
  }

  get isRateLimited(): boolean {
    return this.status === 429;
  }
}

async function handleResponse(res: Response, errorMessage: string): Promise<Response> {
  if (!res.ok) {
    const retryAfterHeader = res.headers.get("Retry-After");
    const retryAfter = retryAfterHeader ? parseInt(retryAfterHeader, 10) : null;
    throw new ApiError(
      `${errorMessage} (${res.status})`,
      res.status,
      retryAfter,
    );
  }
  return res;
}

export async function createTask(prompt: string, language = "python", framework?: string) {
  const res = await fetch(`${API_URL}/api/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, language, framework }),
  });
  await handleResponse(res, "Failed to create task");
  return res.json();
}

export async function listTasks(skip = 0, limit = 20) {
  const res = await fetch(`${API_URL}/api/tasks?skip=${skip}&limit=${limit}`);
  await handleResponse(res, "Failed to fetch tasks");
  return res.json();
}

export async function getTask(taskId: string) {
  const res = await fetch(`${API_URL}/api/tasks/${taskId}`);
  await handleResponse(res, "Failed to fetch task");
  return res.json();
}

export async function getTaskLogs(taskId: string) {
  const res = await fetch(`${API_URL}/api/tasks/${taskId}/logs`);
  await handleResponse(res, "Failed to fetch logs");
  return res.json();
}

export async function getTaskCode(taskId: string) {
  const res = await fetch(`${API_URL}/api/tasks/${taskId}/code`);
  await handleResponse(res, "Failed to fetch code");
  return res.json();
}

export async function deleteTask(taskId: string) {
  const res = await fetch(`${API_URL}/api/tasks/${taskId}`, { method: "DELETE" });
  await handleResponse(res, "Failed to delete task");
  return res.json();
}

export async function getAgents() {
  const res = await fetch(`${API_URL}/api/agents`);
  await handleResponse(res, "Failed to fetch agents");
  return res.json();
}

export async function getAgentHealth() {
  const res = await fetch(`${API_URL}/api/agents/health`);
  await handleResponse(res, "Failed to fetch agent health");
  return res.json();
}

export function connectWebSocket(taskId: string, onMessage: (data: unknown) => void) {
  const wsUrl = API_URL.replace("http", "ws");
  const ws = new WebSocket(`${wsUrl}/ws/${taskId}`);

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    onMessage(data);
  };

  ws.onerror = (err) => {
    console.error("WebSocket error:", err);
  };

  return ws;
}
