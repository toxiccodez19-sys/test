"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "@/components/Sidebar";
import TaskInput from "@/components/TaskInput";
import AgentTimeline from "@/components/AgentTimeline";
import CodeViewer from "@/components/CodeViewer";
import TaskDetails from "@/components/TaskDetails";
import TerminalPanel from "@/components/TerminalPanel";
import WorkflowProgress from "@/components/WorkflowProgress";
import { useTask } from "@/hooks/useTask";

export default function Home() {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showNewTask, setShowNewTask] = useState(true);
  const [terminalExpanded, setTerminalExpanded] = useState(true);

  const { task, logs } = useTask(selectedTaskId);

  const handleTaskCreated = useCallback((taskId: string) => {
    setSelectedTaskId(taskId);
    setShowNewTask(false);
  }, []);

  const handleSelectTask = useCallback((taskId: string) => {
    setSelectedTaskId(taskId);
    setShowNewTask(false);
  }, []);

  const handleNewTask = useCallback(() => {
    setShowNewTask(true);
    setSelectedTaskId(null);
  }, []);

  const codeFiles = task?.final_code || task?.generated_code || {};

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
      <Sidebar
        onNewTask={handleNewTask}
        onSelectTask={handleSelectTask}
        selectedTaskId={selectedTaskId}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {showNewTask ? (
              <motion.div
                key="new-task"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center min-h-full p-8"
              >
                <TaskInput onTaskCreated={handleTaskCreated} />
              </motion.div>
            ) : task ? (
              <motion.div
                key="task-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-6 space-y-6"
              >
                <WorkflowProgress currentStatus={task.status} />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <TaskDetails task={task} />
                    <AgentTimeline logs={logs} currentStatus={task.status} />
                  </div>

                  <div className="space-y-6">
                    {Object.keys(codeFiles).length > 0 && (
                      <CodeViewer files={codeFiles} />
                    )}

                    {task.generated_tests && (
                      <CodeViewer
                        files={{ "test_main.py": task.generated_tests }}
                        title="Generated Tests"
                      />
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center min-h-full"
              >
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-gray-500 text-sm">Loading task...</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <TerminalPanel
          logs={logs}
          expanded={terminalExpanded}
          onToggle={() => setTerminalExpanded(!terminalExpanded)}
        />
      </div>
    </div>
  );
}
