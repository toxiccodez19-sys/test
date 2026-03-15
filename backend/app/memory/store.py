"""ChromaDB Memory System for DevForge AI.

Stores solved bugs, fixes, and working code patterns for reuse.
"""

import os
import chromadb
from chromadb.config import Settings as ChromaSettings
from typing import Optional

from app.config import settings


class MemoryStore:
    """Vector memory store using ChromaDB for pattern matching."""

    def __init__(self):
        os.makedirs(settings.chroma_persist_directory, exist_ok=True)
        self._client = chromadb.Client(ChromaSettings(
            anonymized_telemetry=False,
            is_persistent=True,
            persist_directory=settings.chroma_persist_directory,
        ))
        self._bugs_collection = self._client.get_or_create_collection(
            name="bugs_and_fixes",
            metadata={"description": "Solved bugs and their fixes"},
        )
        self._patterns_collection = self._client.get_or_create_collection(
            name="code_patterns",
            metadata={"description": "Working code patterns"},
        )

    def store_bug_fix(self, error: str, fix: str, language: str, task_id: str):
        """Store a bug and its fix for future reference."""
        doc = f"Error: {error}\nFix: {fix}"
        self._bugs_collection.add(
            documents=[doc],
            metadatas=[{"language": language, "task_id": task_id, "error": error[:500], "fix": fix[:500]}],
            ids=[f"bug_{task_id}_{self._bugs_collection.count()}"],
        )

    def search_similar_bugs(self, error: str, n_results: int = 3) -> list[dict]:
        """Search for similar bugs and their fixes."""
        if self._bugs_collection.count() == 0:
            return []
        results = self._bugs_collection.query(
            query_texts=[error],
            n_results=min(n_results, self._bugs_collection.count()),
        )
        fixes = []
        if results and results["documents"]:
            for i, doc in enumerate(results["documents"][0]):
                metadata = results["metadatas"][0][i] if results["metadatas"] else {}
                distance = results["distances"][0][i] if results["distances"] else 1.0
                fixes.append({
                    "document": doc,
                    "metadata": metadata,
                    "relevance": 1.0 - distance,
                })
        return fixes

    def store_code_pattern(self, description: str, code: str, language: str, task_id: str):
        """Store a working code pattern."""
        doc = f"Description: {description}\nCode:\n{code}"
        self._patterns_collection.add(
            documents=[doc],
            metadatas=[{"language": language, "task_id": task_id}],
            ids=[f"pattern_{task_id}_{self._patterns_collection.count()}"],
        )

    def search_patterns(self, query: str, n_results: int = 3) -> list[dict]:
        """Search for similar code patterns."""
        if self._patterns_collection.count() == 0:
            return []
        results = self._patterns_collection.query(
            query_texts=[query],
            n_results=min(n_results, self._patterns_collection.count()),
        )
        patterns = []
        if results and results["documents"]:
            for i, doc in enumerate(results["documents"][0]):
                metadata = results["metadatas"][0][i] if results["metadatas"] else {}
                patterns.append({
                    "document": doc,
                    "metadata": metadata,
                })
        return patterns

    def get_stats(self) -> dict:
        """Get memory store statistics."""
        return {
            "bugs_count": self._bugs_collection.count(),
            "patterns_count": self._patterns_collection.count(),
        }


# Singleton instance
memory_store = MemoryStore()
