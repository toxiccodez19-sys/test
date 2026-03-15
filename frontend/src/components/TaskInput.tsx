"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Loader2, Code2, Sparkles } from "lucide-react";
import { createTask } from "@/lib/api";

interface TaskInputProps {
  onTaskCreated: (taskId: string) => void;
}

const examples = [
  "Build a FastAPI todo API with CRUD operations",
  "Create a Python CLI calculator with history",
  "Build a URL shortener service with FastAPI",
  "Create a simple blog API with posts and comments",
];

export default function TaskInput({ onTaskCreated }: TaskInputProps) {
  const [prompt, setPrompt] = useState("");
  const [language, setLanguage] = useState("python");
  const [framework, setFramework] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError("");

    try {
      const result = await createTask(prompt, language, framework || undefined);
      onTaskCreated(result.id);
      setPrompt("");
    } catch {
      setError("Failed to create task. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="text-center space-y-3">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.1 }}
            className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-2xl shadow-violet-500/30"
          >
            <Code2 className="w-8 h-8 text-white" />
          </motion.div>
          <h2 className="text-2xl font-bold text-white">What should I build?</h2>
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            Describe your development task and DevForge AI will plan, code, test, and debug it automatically.
          </p>
        </div>

        {/* Input Area */}
        <div className="relative">
          <div className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 overflow-hidden shadow-2xl shadow-black/20">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your development task..."
              rows={4}
              className="w-full bg-transparent text-white placeholder-gray-600 p-5 text-sm resize-none focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
              }}
            />

            <div className="flex items-center gap-3 px-5 py-3 border-t border-white/5">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-white/10 text-gray-300 text-xs px-3 py-1.5 rounded-lg border border-white/10 focus:outline-none focus:border-violet-500/50"
              >
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
              </select>

              <input
                type="text"
                value={framework}
                onChange={(e) => setFramework(e.target.value)}
                placeholder="Framework (optional)"
                className="bg-white/10 text-gray-300 text-xs px-3 py-1.5 rounded-lg border border-white/10 focus:outline-none focus:border-violet-500/50 w-40"
              />

              <div className="flex-1" />

              <span className="text-xs text-gray-600">
                {navigator.platform.includes("Mac") ? "Cmd" : "Ctrl"}+Enter
              </span>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSubmit}
                disabled={loading || !prompt.trim()}
                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-medium text-sm shadow-lg shadow-violet-500/20 transition-all"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {loading ? "Creating..." : "Build"}
              </motion.button>
            </div>
          </div>
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-400 text-sm text-center"
          >
            {error}
          </motion.p>
        )}

        {/* Example prompts */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 justify-center">
            <Sparkles className="w-3 h-3 text-violet-400" />
            <span className="text-xs text-gray-500">Try an example</span>
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {examples.map((example) => (
              <motion.button
                key={example}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setPrompt(example)}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-gray-400 hover:text-gray-200 rounded-lg text-xs transition-all"
              >
                {example}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
