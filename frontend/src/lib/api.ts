const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function createTask(prompt: string, language = "python", framework?: string) {
  const res = await fetch(`${API_URL}/api/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, language, framework }),
  });
  if (!res.ok) throw new Error("Failed to create task");
  return res.json();
}

export async function listTasks(skip = 0, limit = 20) {
  const res = await fetch(`${API_URL}/api/tasks?skip=${skip}&limit=${limit}`);
  if (!res.ok) throw new Error("Failed to fetch tasks");
  return res.json();
}

export async function getTask(taskId: string) {
  const res = await fetch(`${API_URL}/api/tasks/${taskId}`);
  if (!res.ok) throw new Error("Failed to fetch task");
  return res.json();
}

export async function getTaskLogs(taskId: string) {
  const res = await fetch(`${API_URL}/api/tasks/${taskId}/logs`);
  if (!res.ok) throw new Error("Failed to fetch logs");
  return res.json();
}

export async function getTaskCode(taskId: string) {
  const res = await fetch(`${API_URL}/api/tasks/${taskId}/code`);
  if (!res.ok) throw new Error("Failed to fetch code");
  return res.json();
}

export async function deleteTask(taskId: string) {
  const res = await fetch(`${API_URL}/api/tasks/${taskId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete task");
  return res.json();
}

export async function getAgents() {
  const res = await fetch(`${API_URL}/api/agents`);
  if (!res.ok) throw new Error("Failed to fetch agents");
  return res.json();
}

export async function getAgentHealth() {
  const res = await fetch(`${API_URL}/api/agents/health`);
  if (!res.ok) throw new Error("Failed to fetch agent health");
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
