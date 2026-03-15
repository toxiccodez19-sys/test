"use client";

import { motion } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Bug,
  FileCode,
  ListTree,
  FlaskConical,
  Loader2,
} from "lucide-react";
import { Task } from "@/types";

interface TaskDetailsProps {
  task: Task;
}

export default function TaskDetails({ task }: TaskDetailsProps) {
  const isCompleted = task.status === "completed";
  const isFailed = task.status === "failed";
  const isRunning = !isCompleted && !isFailed && task.status !== "pending";

  return (
    <div className="space-y-4">
      {/* Status Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-xl p-4 border ${
          isCompleted
            ? "bg-emerald-500/10 border-emerald-500/20"
            : isFailed
            ? "bg-red-500/10 border-red-500/20"
            : "bg-violet-500/10 border-violet-500/20"
        }`}
      >
        <div className="flex items-center gap-3">
          {isCompleted && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          {isFailed && <XCircle className="w-5 h-5 text-red-400" />}
          {isRunning && <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />}
          {task.status === "pending" && <Clock className="w-5 h-5 text-yellow-400" />}
          <div>
            <p className="text-sm font-medium text-white capitalize">
              {task.status.replace(/_/g, " ")}
            </p>
            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{task.prompt}</p>
          </div>
          {task.debug_iterations > 0 && (
            <div className="ml-auto flex items-center gap-1 px-2 py-1 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <Bug className="w-3 h-3 text-yellow-400" />
              <span className="text-xs text-yellow-400">{task.debug_iterations} debug cycles</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Plan */}
      {task.plan && (
        <DetailSection title="Development Plan" icon={ListTree} color="purple">
          <div className="space-y-2">
            {task.plan.title && (
              <p className="text-sm text-gray-200 font-medium">{task.plan.title}</p>
            )}
            {task.plan.steps?.map((step, i) => (
              <div key={i} className="flex gap-2 text-xs">
                <span className="text-violet-400 font-mono w-5 flex-shrink-0">{step.step}.</span>
                <span className="text-gray-300">{step.description}</span>
              </div>
            ))}
            {task.plan.estimated_complexity && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-gray-500">Complexity:</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  task.plan.estimated_complexity === "high"
                    ? "bg-red-500/20 text-red-300"
                    : task.plan.estimated_complexity === "medium"
                    ? "bg-yellow-500/20 text-yellow-300"
                    : "bg-green-500/20 text-green-300"
                }`}>
                  {task.plan.estimated_complexity}
                </span>
              </div>
            )}
          </div>
        </DetailSection>
      )}

      {/* Architecture */}
      {task.architecture && (
        <DetailSection title="Architecture" icon={FileCode} color="indigo">
          <div className="space-y-2">
            {task.architecture.structure && (
              <div className="space-y-1">
                {Object.entries(task.architecture.structure).map(([file, desc]) => (
                  <div key={file} className="flex gap-2 text-xs">
                    <span className="text-cyan-400 font-mono flex-shrink-0">{file}</span>
                    <span className="text-gray-500">{desc}</span>
                  </div>
                ))}
              </div>
            )}
            {task.architecture.dependencies?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {task.architecture.dependencies.map((dep) => (
                  <span key={dep} className="px-2 py-0.5 text-xs bg-indigo-500/10 text-indigo-300 rounded-full border border-indigo-500/20">
                    {dep}
                  </span>
                ))}
              </div>
            )}
          </div>
        </DetailSection>
      )}

      {/* Test Results */}
      {task.test_results && (
        <DetailSection title="Test Results" icon={FlaskConical} color="teal">
          <div className={`p-3 rounded-lg text-xs font-mono ${
            task.test_results.passed
              ? "bg-emerald-500/10 border border-emerald-500/20"
              : "bg-red-500/10 border border-red-500/20"
          }`}>
            <pre className="whitespace-pre-wrap text-gray-300 max-h-40 overflow-y-auto">
              {task.test_results.stdout || "No output"}
            </pre>
          </div>
        </DetailSection>
      )}
    </div>
  );
}

function DetailSection({
  title,
  icon: Icon,
  color,
  children,
}: {
  title: string;
  icon: React.ElementType;
  color: string;
  children: React.ReactNode;
}) {
  const colorMap: Record<string, string> = {
    purple: "text-purple-400",
    indigo: "text-indigo-400",
    teal: "text-teal-400",
    green: "text-green-400",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-white/5 border border-white/10 p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-4 h-4 ${colorMap[color] || "text-gray-400"}`} />
        <h4 className="text-sm font-medium text-gray-300">{title}</h4>
      </div>
      {children}
    </motion.div>
  );
}
