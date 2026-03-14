"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Building2,
  Scissors,
  Code2,
  FlaskConical,
  Play,
  Bug,
  Sparkles,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { AgentLog } from "@/types";

interface AgentTimelineProps {
  logs: AgentLog[];
  currentStatus: string;
}

const agentIcons: Record<string, React.ElementType> = {
  planner: Brain,
  architect: Building2,
  decomposer: Scissors,
  coder: Code2,
  test_generator: FlaskConical,
  executor: Play,
  debugger: Bug,
  refactor: Sparkles,
};

const agentColors: Record<string, string> = {
  planner: "from-purple-500 to-purple-600",
  architect: "from-indigo-500 to-indigo-600",
  decomposer: "from-cyan-500 to-cyan-600",
  coder: "from-green-500 to-green-600",
  test_generator: "from-teal-500 to-teal-600",
  executor: "from-orange-500 to-orange-600",
  debugger: "from-red-500 to-red-600",
  refactor: "from-violet-500 to-violet-600",
};

const eventIcons: Record<string, React.ElementType> = {
  TASK_COMPLETED: CheckCircle2,
  TASK_FAILED: XCircle,
  ERROR_DETECTED: AlertTriangle,
};

export default function AgentTimeline({ logs, currentStatus }: AgentTimelineProps) {
  const isRunning = !["completed", "failed", "pending"].includes(currentStatus);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-300">Agent Activity</h3>
        {isRunning && (
          <div className="flex items-center gap-2">
            <Loader2 className="w-3 h-3 text-violet-400 animate-spin" />
            <span className="text-xs text-violet-400 capitalize">{currentStatus.replace(/_/g, " ")}</span>
          </div>
        )}
      </div>

      <div className="relative">
        {/* Timeline line */}
        {logs.length > 0 && (
          <div className="absolute left-4 top-4 bottom-4 w-px bg-gradient-to-b from-violet-500/50 via-cyan-500/30 to-transparent" />
        )}

        <AnimatePresence>
          {logs.map((log, index) => {
            const Icon = eventIcons[log.event] || agentIcons[log.agent] || Code2;
            const colorClass = agentColors[log.agent] || "from-gray-500 to-gray-600";

            return (
              <motion.div
                key={log.id || index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative flex gap-3 pb-4"
              >
                {/* Icon */}
                <div
                  className={`relative z-10 w-8 h-8 rounded-lg bg-gradient-to-br ${colorClass} flex items-center justify-center shadow-lg flex-shrink-0`}
                >
                  <Icon className="w-4 h-4 text-white" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-400 capitalize">
                      {log.agent.replace(/_/g, " ")}
                    </span>
                    <span className="text-xs text-gray-600">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-200 mt-0.5">{log.message}</p>
                  {log.event === "ERROR_DETECTED" && (
                    <div className="mt-1 px-2 py-1 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-300">
                      Error detected
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {logs.length === 0 && (
          <div className="text-center py-8">
            <Bot className="w-8 h-8 text-gray-700 mx-auto mb-2" />
            <p className="text-gray-600 text-sm">Waiting for agent activity...</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Bot(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 8V4H8" /><rect width="16" height="12" x="4" y="8" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" />
    </svg>
  );
}
