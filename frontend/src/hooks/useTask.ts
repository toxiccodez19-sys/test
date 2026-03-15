"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Task, AgentLog } from "@/types";
import { getTask, getTaskLogs, connectWebSocket, ApiError } from "@/lib/api";

const BASE_POLL_INTERVAL = 3000;
const STATUS_POLL_INTERVAL = 5000;
const MAX_POLL_INTERVAL = 60000;
const BACKOFF_MULTIPLIER = 2;

function getBackoffDelay(errorCount: number, retryAfter: number | null): number {
  if (retryAfter && retryAfter > 0) {
    return retryAfter * 1000;
  }
  const delay = BASE_POLL_INTERVAL * Math.pow(BACKOFF_MULTIPLIER, errorCount);
  return Math.min(delay, MAX_POLL_INTERVAL);
}

export function useTask(taskId: string | null) {
  const [task, setTask] = useState<Task | null>(null);
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [loading, setLoading] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const errorCountRef = useRef(0);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statusPollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchTask = useCallback(async () => {
    if (!taskId) return;
    setLoading(true);
    try {
      const data = await getTask(taskId);
      setTask(data);
      errorCountRef.current = 0;
    } catch (err) {
      if (err instanceof ApiError && err.isRateLimited) {
        errorCountRef.current += 1;
        console.warn(
          `Rate limited fetching task. Backing off (attempt ${errorCountRef.current}).`,
        );
      } else {
        console.error("Failed to fetch task:", err);
      }
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
      if (err instanceof ApiError && err.isRateLimited) {
        console.warn("Rate limited fetching logs. Skipping until next poll.");
      } else {
        console.error("Failed to fetch logs:", err);
      }
    }
  }, [taskId]);

  // WebSocket connection with polling fallback (with backoff)
  useEffect(() => {
    if (!taskId) return;

    fetchTask();
    fetchLogs();

    let stopped = false;

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
      // WebSocket not available, use polling with backoff
      const schedulePoll = () => {
        if (stopped) return;
        const delay = getBackoffDelay(errorCountRef.current, null);
        pollTimeoutRef.current = setTimeout(async () => {
          await fetchTask();
          await fetchLogs();
          schedulePoll();
        }, delay);
      };
      schedulePoll();

      return () => {
        stopped = true;
        if (pollTimeoutRef.current) {
          clearTimeout(pollTimeoutRef.current);
        }
      };
    }

    return () => {
      stopped = true;
      wsRef.current?.close();
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
      }
    };
  }, [taskId, fetchTask, fetchLogs]);

  // Polling fallback for task status updates (with backoff)
  useEffect(() => {
    if (!taskId || !task) return;
    if (task.status === "completed" || task.status === "failed") return;

    let stopped = false;

    const scheduleStatusPoll = () => {
      if (stopped) return;
      const delay = errorCountRef.current > 0
        ? getBackoffDelay(errorCountRef.current, null)
        : STATUS_POLL_INTERVAL;
      statusPollTimeoutRef.current = setTimeout(async () => {
        await fetchTask();
        scheduleStatusPoll();
      }, delay);
    };
    scheduleStatusPoll();

    return () => {
      stopped = true;
      if (statusPollTimeoutRef.current) {
        clearTimeout(statusPollTimeoutRef.current);
      }
    };
  }, [taskId, task, fetchTask]);

  return { task, logs, loading, refetch: fetchTask };
}
