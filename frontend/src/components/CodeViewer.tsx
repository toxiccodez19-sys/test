"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Editor from "@monaco-editor/react";
import { File, Copy, Check, Download } from "lucide-react";

interface CodeViewerProps {
  files: Record<string, string>;
  title?: string;
}

export default function CodeViewer({ files, title = "Generated Code" }: CodeViewerProps) {
  const fileNames = Object.keys(files);
  const [activeFile, setActiveFile] = useState(fileNames[0] || "");
  const [copied, setCopied] = useState(false);

  if (fileNames.length === 0) {
    return (
      <div className="rounded-2xl bg-white/5 border border-white/10 p-8 text-center">
        <File className="w-8 h-8 text-gray-700 mx-auto mb-2" />
        <p className="text-gray-600 text-sm">No code generated yet</p>
      </div>
    );
  }

  const getLanguage = (filename: string) => {
    if (filename.endsWith(".py")) return "python";
    if (filename.endsWith(".js")) return "javascript";
    if (filename.endsWith(".ts") || filename.endsWith(".tsx")) return "typescript";
    if (filename.endsWith(".json")) return "json";
    if (filename.endsWith(".yaml") || filename.endsWith(".yml")) return "yaml";
    if (filename.endsWith(".md")) return "markdown";
    if (filename.endsWith(".txt")) return "plaintext";
    return "plaintext";
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(files[activeFile] || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadAll = () => {
    const content = Object.entries(files)
      .map(([name, code]) => `// === ${name} ===\n\n${code}`)
      .join("\n\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "devforge-output.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 overflow-hidden shadow-2xl shadow-black/20">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
        <h3 className="text-sm font-medium text-gray-300">{title}</h3>
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCopy}
            className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-all"
            title="Copy code"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleDownloadAll}
            className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-all"
            title="Download all"
          >
            <Download className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* File tabs */}
      <div className="flex overflow-x-auto border-b border-white/5 scrollbar-thin scrollbar-thumb-white/10">
        {fileNames.map((name) => (
          <button
            key={name}
            onClick={() => setActiveFile(name)}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs whitespace-nowrap border-b-2 transition-all ${
              activeFile === name
                ? "text-violet-300 border-violet-500 bg-white/5"
                : "text-gray-500 border-transparent hover:text-gray-300 hover:bg-white/5"
            }`}
          >
            <File className="w-3 h-3" />
            {name}
          </button>
        ))}
      </div>

      {/* Editor */}
      <div className="h-96">
        <Editor
          height="100%"
          language={getLanguage(activeFile)}
          value={files[activeFile] || ""}
          theme="vs-dark"
          options={{
            readOnly: true,
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            wordWrap: "on",
            padding: { top: 12 },
            renderLineHighlight: "none",
          }}
        />
      </div>
    </div>
  );
}
