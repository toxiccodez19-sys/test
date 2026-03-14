"""DevForge AI Logging System."""

import logging
from datetime import datetime
from typing import Optional, Dict, Any
from app.models.schemas import AgentType, LogEvent, AgentActivityLog

logger = logging.getLogger("devforge")
logger.setLevel(logging.DEBUG)

handler = logging.StreamHandler()
handler.setFormatter(logging.Formatter(
    "[%(asctime)s] %(levelname)s %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
))
logger.addHandler(handler)


class ActivityLogger:
    """Logs agent activities and stores them in memory for real-time streaming."""

    def __init__(self):
        self._logs: Dict[str, list[AgentActivityLog]] = {}

    def log(
        self,
        task_id: str,
        agent: AgentType,
        event: LogEvent,
        message: str,
        data: Optional[Dict[str, Any]] = None,
    ) -> AgentActivityLog:
        entry = AgentActivityLog(
            task_id=task_id,
            agent=agent,
            event=event,
            message=message,
            data=data,
        )

        if task_id not in self._logs:
            self._logs[task_id] = []
        self._logs[task_id].append(entry)

        logger.info(f"[{task_id[:8]}] [{agent.value}] {event.value}: {message}")
        return entry

    def get_logs(self, task_id: str) -> list[AgentActivityLog]:
        return self._logs.get(task_id, [])

    def get_all_logs(self) -> Dict[str, list[AgentActivityLog]]:
        return self._logs

    def clear_logs(self, task_id: str):
        self._logs.pop(task_id, None)


# Singleton instance
activity_logger = ActivityLogger()
