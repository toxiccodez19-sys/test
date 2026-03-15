"use client";

import { useRef, useEffect } from "react";
import { Terminal, ChevronUp, ChevronDown } from "lucide-react";
import { AgentLog } from "@/types";

interface TerminalPanelProps {
  logs: AgentLog[];
  expanded: boolean;
  onToggle: () => void;
}

const eventColors: Record<string, string> = {
  TASK_RECEIVED: "text-blue-400",
  PLAN_CREATED: "text-purple-400",
  ARCHITECTURE_DESIGNED: "text-indigo-400",
  TASKS_DECOMPOSED: "text-cyan-400",
  TESTS_GENERATED: "text-teal-400",
  CODE_GENERATED: "text-green-400",
  CODE_EXECUTED: "text-orange-400",
  TESTS_EXECUTED: "text-sky-400",
  ERROR_DETECTED: "text-red-400",
  BUG_FIXED: "text-yellow-400",
  CODE_REFACTORED: "text-violet-400",
  TASK_COMPLETED: "text-emerald-400",
  TASK_FAILED: "text-red-500",
};

export default function TerminalPanel({ logs, expanded, onToggle }: TerminalPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div
      className={`bg-gray-950/90 backdrop-blur-xl border-t border-white/5 transition-all duration-300 ${
        expanded ? "h-64" : "h-10"
      }`}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-4 py-2 hover:bg-white/5 transition-all"
      >
        <Terminal className="w-4 h-4 text-gray-400" />
        <span className="text-xs font-medium text-gray-400">Terminal Logs</span>
        <span className="text-xs text-gray-600 ml-1">({logs.length})</span>
        <div className="flex-1" />
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        )}
      </button>

      {/* Log content */}
      {expanded && (
        <div ref={scrollRef} className="h-52 overflow-y-auto px-4 font-mono text-xs space-y-0.5 scrollbar-thin scrollbar-thumb-white/10">
          {logs.map((log, i) => (
            <div key={log.id || i} className="flex gap-2">
              <span className="text-gray-600 flex-shrink-0">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
              <span className={`flex-shrink-0 ${eventColors[log.event] || "text-gray-400"}`}>
                [{log.event}]
              </span>
              <span className="text-gray-500 flex-shrink-0">[{log.agent}]</span>
              <span className="text-gray-300">{log.message}</span>
            </div>
          ))}
          {logs.length === 0 && (
            <div className="text-gray-700 py-4 text-center">
              $ waiting for task output...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
