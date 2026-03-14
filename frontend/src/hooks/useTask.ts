"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Task, AgentLog } from "@/types";
import { getTask, getTaskLogs, connectWebSocket } from "@/lib/api";

export function useTask(taskId: string | null) {
  const [task, setTask] = useState<Task | null>(null);
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [loading, setLoading] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const fetchTask = useCallback(async () => {
    if (!taskId) return;
    setLoading(true);
    try {
      const data = await getTask(taskId);
      setTask(data);
    } catch (err) {
      console.error("Failed to fetch task:", err);
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  const fetchLogs = useCallback(async () => {
    if (!taskId) return;
    try {
      const data = await getTaskLogs(taskId);
      setLogs(data.logs || []);
    } catch (err) {
      console.error("Failed to fetch logs:", err);
    }
  }, [taskId]);

  useEffect(() => {
    if (!taskId) return;

    fetchTask();
    fetchLogs();

    // Connect WebSocket for real-time updates
    try {
      const ws = connectWebSocket(taskId, (data: unknown) => {
        const msg = data as { type: string; data: Record<string, unknown> };
        if (msg.type === "log") {
          setLogs((prev) => [...prev, msg.data as unknown as AgentLog]);
        }
        if (msg.type === "complete") {
          fetchTask();
        }
      });
      wsRef.current = ws;
    } catch {
      // WebSocket not available, use polling
      const interval = setInterval(() => {
        fetchTask();
        fetchLogs();
      }, 3000);
      return () => clearInterval(interval);
    }

    return () => {
      wsRef.current?.close();
    };
  }, [taskId, fetchTask, fetchLogs]);

  // Polling fallback for task status updates
  useEffect(() => {
    if (!taskId || !task) return;
    if (task.status === "completed" || task.status === "failed") return;

    const interval = setInterval(fetchTask, 5000);
    return () => clearInterval(interval);
  }, [taskId, task, fetchTask]);

  return { task, logs, loading, refetch: fetchTask };
}
