"use client";

import { motion } from "framer-motion";
import {
  Brain,
  Building2,
  Scissors,
  FlaskConical,
  Code2,
  Play,
  Bug,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

interface WorkflowProgressProps {
  currentStatus: string;
}

const steps = [
  { key: "planning", label: "Plan", icon: Brain },
  { key: "architecting", label: "Architect", icon: Building2 },
  { key: "decomposing", label: "Decompose", icon: Scissors },
  { key: "generating_tests", label: "Tests", icon: FlaskConical },
  { key: "coding", label: "Code", icon: Code2 },
  { key: "executing", label: "Execute", icon: Play },
  { key: "testing", label: "Test", icon: FlaskConical },
  { key: "debugging", label: "Debug", icon: Bug },
  { key: "refactoring", label: "Refactor", icon: Sparkles },
  { key: "completed", label: "Done", icon: CheckCircle2 },
];

const statusOrder = [
  "pending", "running", "planning", "architecting", "decomposing",
  "generating_tests", "coding", "executing", "testing", "debugging",
  "refactoring", "completed",
];

export default function WorkflowProgress({ currentStatus }: WorkflowProgressProps) {
  const currentIndex = statusOrder.indexOf(currentStatus);

  return (
    <div className="py-3">
      <div className="flex items-center gap-1 overflow-x-auto">
        {steps.map((step, index) => {
          const stepIndex = statusOrder.indexOf(step.key);
          const isActive = step.key === currentStatus;
          const isCompleted = stepIndex < currentIndex && currentIndex > 0;
          return (
            <div key={step.key} className="flex items-center">
              <motion.div
                animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 1.5, repeat: isActive ? Infinity : 0 }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                  isActive
                    ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                    : isCompleted
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "text-gray-600"
                }`}
              >
                <step.icon className="w-3 h-3" />
                <span className="hidden sm:inline whitespace-nowrap">{step.label}</span>
              </motion.div>
              {index < steps.length - 1 && (
                <div
                  className={`w-4 h-px mx-0.5 ${
                    isCompleted ? "bg-emerald-500/50" : "bg-white/10"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
