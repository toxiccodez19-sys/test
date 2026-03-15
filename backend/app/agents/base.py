"""Base agent interface for DevForge AI."""

import httpx
import json
from typing import Optional, Dict, Any

from app.config import settings
from app.logging_system.logger import logger


class OllamaClient:
    """Client for communicating with Ollama LLM."""

    def __init__(self):
        self.base_url = settings.ollama_base_url
        self.model = settings.ollama_model

    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.3,
        max_tokens: int = 4096,
    ) -> str:
        """Generate a completion from Ollama."""
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        try:
            async with httpx.AsyncClient(timeout=300.0) as client:
                response = await client.post(
                    f"{self.base_url}/api/chat",
                    json={
                        "model": self.model,
                        "messages": messages,
                        "stream": False,
                        "options": {
                            "temperature": temperature,
                            "num_predict": max_tokens,
                        },
                    },
                )
                response.raise_for_status()
                data = response.json()
                return data.get("message", {}).get("content", "")
        except httpx.ConnectError:
            logger.warning("Ollama not available, using mock response")
            return self._mock_response(prompt, system_prompt)
        except Exception as e:
            logger.error(f"Ollama error: {e}")
            return self._mock_response(prompt, system_prompt)

    def _mock_response(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        """Provide a structured mock response when Ollama is unavailable.

        This allows the system to demonstrate the workflow without a running LLM.
        """
        prompt_lower = prompt.lower()

        if "plan" in (system_prompt or "").lower() or "plan" in prompt_lower:
            return json.dumps({
                "title": "Development Plan",
                "steps": [
                    {"step": 1, "description": "Set up project structure and dependencies"},
                    {"step": 2, "description": "Define data models and schemas"},
                    {"step": 3, "description": "Implement core business logic"},
                    {"step": 4, "description": "Create API endpoints"},
                    {"step": 5, "description": "Add error handling and validation"},
                    {"step": 6, "description": "Write unit tests"},
                    {"step": 7, "description": "Test and debug"},
                ],
                "estimated_complexity": "medium",
            })

        if "architect" in (system_prompt or "").lower():
            return json.dumps({
                "project_name": "generated_project",
                "structure": {
                    "main.py": "Main application entry point",
                    "models.py": "Data models",
                    "routes.py": "API routes",
                    "utils.py": "Utility functions",
                    "test_main.py": "Unit tests",
                    "requirements.txt": "Dependencies",
                },
                "dependencies": ["fastapi", "uvicorn", "pydantic"],
                "patterns": ["MVC", "Repository"],
            })

        if "decompos" in (system_prompt or "").lower():
            return json.dumps({
                "subtasks": [
                    {"id": 1, "title": "Create data models", "priority": "high", "dependencies": []},
                    {"id": 2, "title": "Implement business logic", "priority": "high", "dependencies": [1]},
                    {"id": 3, "title": "Create API endpoints", "priority": "high", "dependencies": [1, 2]},
                    {"id": 4, "title": "Add validation", "priority": "medium", "dependencies": [3]},
                    {"id": 5, "title": "Error handling", "priority": "medium", "dependencies": [3]},
                ],
            })

        if "test" in (system_prompt or "").lower():
            return '''import pytest


def test_example():
    """Test basic functionality."""
    assert True


def test_main_exists():
    """Test that main module can be imported."""
    try:
        import main
        assert main is not None
    except ImportError:
        pytest.skip("Main module not yet created")
'''

        if "code" in (system_prompt or "").lower() or "implement" in prompt_lower:
            return '''"""Auto-generated code by DevForge AI."""


def main():
    """Main entry point."""
    print("Hello from DevForge AI!")
    return True


if __name__ == "__main__":
    main()
'''

        if "debug" in (system_prompt or "").lower() or "fix" in prompt_lower:
            return json.dumps({
                "diagnosis": "Identified the error in the code",
                "fix_description": "Applied fix to resolve the issue",
                "fixed": True,
            })

        if "refactor" in (system_prompt or "").lower():
            return json.dumps({
                "improvements": [
                    "Added type hints",
                    "Improved error handling",
                    "Added docstrings",
                ],
                "refactored": True,
            })

        return json.dumps({"response": "Task processed successfully"})

    async def check_health(self) -> bool:
        """Check if Ollama is available."""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{self.base_url}/api/tags")
                return response.status_code == 200
        except Exception:
            return False


# Singleton
ollama_client = OllamaClient()
