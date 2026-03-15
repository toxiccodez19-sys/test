"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  History,
  FolderTree,
  Bot,
  ChevronRight,
  Trash2,
  Zap,
} from "lucide-react";
import { Task, Agent } from "@/types";
import { listTasks, getAgents, deleteTask, ApiError } from "@/lib/api";

const SIDEBAR_POLL_INTERVAL = 5000;
const MAX_POLL_INTERVAL = 60000;
const BACKOFF_MULTIPLIER = 2;

interface SidebarProps {
  onNewTask: () => void;
  onSelectTask: (taskId: string) => void;
  selectedTaskId: string | null;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-400",
  running: "bg-blue-400 animate-pulse",
  planning: "bg-purple-400 animate-pulse",
  architecting: "bg-indigo-400 animate-pulse",
  decomposing: "bg-cyan-400 animate-pulse",
  generating_tests: "bg-teal-400 animate-pulse",
  coding: "bg-green-400 animate-pulse",
  executing: "bg-orange-400 animate-pulse",
  testing: "bg-sky-400 animate-pulse",
  debugging: "bg-red-400 animate-pulse",
  refactoring: "bg-violet-400 animate-pulse",
  completed: "bg-emerald-400",
  failed: "bg-red-500",
};

export default function Sidebar({ onNewTask, onSelectTask, selectedTaskId }: SidebarProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [activeSection, setActiveSection] = useState<string>("history");
  const errorCountRef = useRef(0);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchTasks = async () => {
    try {
      const data = await listTasks();
      setTasks(data.tasks || []);
      errorCountRef.current = 0;
    } catch (err) {
      if (err instanceof ApiError && err.isRateLimited) {
        errorCountRef.current += 1;
        console.warn(
          `Rate limited fetching tasks list. Backing off (attempt ${errorCountRef.current}).`,
        );
      }
      // API not available or rate limited
    }
  };

  const fetchAgents = async () => {
    try {
      const data = await getAgents();
      setAgents(data.agents || []);
    } catch {
      // API not available
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchAgents();

    let stopped = false;
    const schedulePoll = () => {
      if (stopped) return;
      const delay = errorCountRef.current > 0
        ? Math.min(
            SIDEBAR_POLL_INTERVAL * Math.pow(BACKOFF_MULTIPLIER, errorCountRef.current),
            MAX_POLL_INTERVAL,
          )
        : SIDEBAR_POLL_INTERVAL;
      pollTimeoutRef.current = setTimeout(async () => {
        await fetchTasks();
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
  }, []);

  const handleDelete = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteTask(taskId);
      fetchTasks();
    } catch {
      // ignore
    }
  };

  return (
    <div className="w-72 h-full flex flex-col bg-gray-950/80 backdrop-blur-xl border-r border-white/5">
      {/* Logo */}
      <div className="p-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">DevForge</h1>
            <p className="text-xs text-gray-500 -mt-0.5">AI Developer Platform</p>
          </div>
        </div>
      </div>

      {/* New Task Button */}
      <div className="p-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onNewTask}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white rounded-xl font-medium text-sm shadow-lg shadow-violet-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          New Task
        </motion.button>
      </div>

      {/* Navigation */}
      <nav className="px-3 space-y-1">
        {[
          { id: "history", icon: History, label: "Task History" },
          { id: "agents", icon: Bot, label: "Agent Status" },
          { id: "explorer", icon: FolderTree, label: "File Explorer" },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
              activeSection === item.id
                ? "bg-white/10 text-white"
                : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
            }`}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
            <ChevronRight
              className={`w-3 h-3 ml-auto transition-transform ${
                activeSection === item.id ? "rotate-90" : ""
              }`}
            />
          </button>
        ))}
      </nav>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-3 py-3 scrollbar-thin scrollbar-thumb-white/10">
        <AnimatePresence mode="wait">
          {activeSection === "history" && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-2"
            >
              {tasks.length === 0 ? (
                <p className="text-gray-600 text-sm text-center py-8">No tasks yet</p>
              ) : (
                tasks.map((task) => (
                  <motion.div
                    key={task.id}
                    layout
                    onClick={() => onSelectTask(task.id)}
                    className={`group p-3 rounded-xl cursor-pointer transition-all border ${
                      selectedTaskId === task.id
                        ? "bg-white/10 border-violet-500/30"
                        : "bg-white/5 border-transparent hover:bg-white/8 hover:border-white/10"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <p className="text-sm text-gray-200 line-clamp-2 flex-1">
                        {task.prompt}
                      </p>
                      <button
                        onClick={(e) => handleDelete(task.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all"
                      >
                        <Trash2 className="w-3 h-3 text-red-400" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`w-2 h-2 rounded-full ${statusColors[task.status] || "bg-gray-500"}`} />
                      <span className="text-xs text-gray-500 capitalize">{task.status}</span>
                      <span className="text-xs text-gray-600 ml-auto">{task.language}</span>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}

          {activeSection === "agents" && (
            <motion.div
              key="agents"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-2"
            >
              {agents.map((agent) => (
                <div
                  key={agent.name}
                  className="p-3 rounded-xl bg-white/5 border border-transparent"
                >
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-violet-400" />
                    <span className="text-sm text-gray-200">{agent.display_name}</span>
                    <span
                      className={`ml-auto w-2 h-2 rounded-full ${
                        agent.status === "active" ? "bg-emerald-400" : "bg-yellow-400"
                      }`}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{agent.description}</p>
                </div>
              ))}
            </motion.div>
          )}

          {activeSection === "explorer" && (
            <motion.div
              key="explorer"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-center py-8"
            >
              <FolderTree className="w-8 h-8 text-gray-700 mx-auto mb-2" />
              <p className="text-gray-600 text-sm">Select a task to view files</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
