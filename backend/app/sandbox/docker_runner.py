"""Docker Sandbox Execution Runner for DevForge AI.

Runs generated code safely inside Docker containers.
"""

import docker
import tempfile
import os
import shutil
from typing import Dict, Optional

from app.config import settings
from app.logging_system.logger import logger


class DockerRunner:
    """Execute code safely in Docker containers."""

    def __init__(self):
        try:
            self._client = docker.from_env()
            self._available = True
            logger.info("Docker client initialized successfully")
        except Exception as e:
            logger.warning(f"Docker not available: {e}. Using fallback subprocess execution.")
            self._available = False

    @property
    def is_available(self) -> bool:
        return self._available

    def run_code(
        self,
        files: Dict[str, str],
        entrypoint: str = "main.py",
        language: str = "python",
        requirements: Optional[str] = None,
        timeout: int = 0,
    ) -> Dict:
        """Run code files in a Docker container.

        Args:
            files: Dict of filename -> content
            entrypoint: The main file to execute
            language: Programming language
            requirements: pip requirements content
            timeout: Execution timeout in seconds (0 = use default)

        Returns:
            Dict with stdout, stderr, exit_code, and timed_out
        """
        if timeout <= 0:
            timeout = settings.sandbox_timeout

        if not self._available:
            return self._run_subprocess(files, entrypoint, language, requirements, timeout)

        return self._run_docker(files, entrypoint, language, requirements, timeout)

    def _run_docker(
        self,
        files: Dict[str, str],
        entrypoint: str,
        language: str,
        requirements: Optional[str],
        timeout: int,
    ) -> Dict:
        """Run code in Docker container."""
        tmpdir = tempfile.mkdtemp(prefix="devforge_")
        try:
            # Write files to temp directory
            for filename, content in files.items():
                filepath = os.path.join(tmpdir, filename)
                os.makedirs(os.path.dirname(filepath), exist_ok=True)
                with open(filepath, "w") as f:
                    f.write(content)

            # Build the command
            if language == "python":
                image = settings.sandbox_image
                if requirements:
                    req_path = os.path.join(tmpdir, "requirements.txt")
                    with open(req_path, "w") as f:
                        f.write(requirements)
                    cmd = f"pip install -r /workspace/requirements.txt --quiet && python /workspace/{entrypoint}"
                else:
                    cmd = f"python /workspace/{entrypoint}"
            elif language == "javascript":
                image = "node:20-slim"
                cmd = f"node /workspace/{entrypoint}"
            else:
                image = settings.sandbox_image
                cmd = f"python /workspace/{entrypoint}"

            container = self._client.containers.run(
                image=image,
                command=["bash", "-c", cmd],
                volumes={tmpdir: {"bind": "/workspace", "mode": "rw"}},
                mem_limit=settings.sandbox_memory_limit,
                network_mode="none",
                detach=True,
                stderr=True,
                stdout=True,
            )

            try:
                result = container.wait(timeout=timeout)
                stdout = container.logs(stdout=True, stderr=False).decode("utf-8", errors="replace")
                stderr = container.logs(stdout=False, stderr=True).decode("utf-8", errors="replace")
                exit_code = result.get("StatusCode", -1)
                timed_out = False
            except Exception:
                container.kill()
                stdout = container.logs(stdout=True, stderr=False).decode("utf-8", errors="replace")
                stderr = "Execution timed out"
                exit_code = -1
                timed_out = True
            finally:
                container.remove(force=True)

            return {
                "stdout": stdout,
                "stderr": stderr,
                "exit_code": exit_code,
                "timed_out": timed_out,
            }
        finally:
            shutil.rmtree(tmpdir, ignore_errors=True)

    def _run_subprocess(
        self,
        files: Dict[str, str],
        entrypoint: str,
        language: str,
        requirements: Optional[str],
        timeout: int,
    ) -> Dict:
        """Fallback: run code via subprocess when Docker is not available."""
        import subprocess

        tmpdir = tempfile.mkdtemp(prefix="devforge_")
        try:
            for filename, content in files.items():
                filepath = os.path.join(tmpdir, filename)
                os.makedirs(os.path.dirname(filepath), exist_ok=True)
                with open(filepath, "w") as f:
                    f.write(content)

            if language == "python":
                cmd = ["python", os.path.join(tmpdir, entrypoint)]
            elif language == "javascript":
                cmd = ["node", os.path.join(tmpdir, entrypoint)]
            else:
                cmd = ["python", os.path.join(tmpdir, entrypoint)]

            try:
                proc = subprocess.run(
                    cmd,
                    capture_output=True,
                    text=True,
                    timeout=timeout,
                    cwd=tmpdir,
                )
                return {
                    "stdout": proc.stdout,
                    "stderr": proc.stderr,
                    "exit_code": proc.returncode,
                    "timed_out": False,
                }
            except subprocess.TimeoutExpired:
                return {
                    "stdout": "",
                    "stderr": "Execution timed out",
                    "exit_code": -1,
                    "timed_out": True,
                }
        finally:
            shutil.rmtree(tmpdir, ignore_errors=True)

    def run_tests(
        self,
        files: Dict[str, str],
        test_file: str = "test_main.py",
        language: str = "python",
        requirements: Optional[str] = None,
    ) -> Dict:
        """Run test files and return results."""
        if language == "python":
            # Add pytest to requirements
            req = (requirements or "") + "\npytest\n"
            all_files = dict(files)
            entrypoint = "_run_tests.py"
            all_files[entrypoint] = f"""
import subprocess
import sys

# Install requirements
subprocess.run([sys.executable, "-m", "pip", "install", "pytest", "--quiet"], check=False)

# Run pytest
result = subprocess.run(
    [sys.executable, "-m", "pytest", "{test_file}", "-v", "--tb=short"],
    capture_output=True, text=True
)
print(result.stdout)
if result.stderr:
    print(result.stderr, file=sys.stderr)
sys.exit(result.returncode)
"""
            return self.run_code(all_files, entrypoint, language, requirements, timeout=120)
        else:
            return self.run_code(files, test_file, language, requirements)


# Singleton instance
docker_runner = DockerRunner()
