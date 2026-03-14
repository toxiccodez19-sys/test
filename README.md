# DevForge AI

**Autonomous AI Developer Platform** — An AI agent system that automatically plans, codes, tests, debugs, and improves software tasks.

## Architecture

```
Frontend Dashboard (Next.js)
│
FastAPI API Gateway
│
Redis Task Queue
│
Celery Workers
│
Agent Workflow Engine (LangGraph)
│
┌──────────────────────────────────────────┐
│ Planner → Architect → Task Decomposer   │
│ → Test Generator → Coder → Executor     │
│ → Debugger (loop ×5) → Refactor         │
└──────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js, Tailwind CSS, Framer Motion, Monaco Editor |
| Backend | Python, FastAPI |
| Agent Orchestration | LangGraph |
| Task Queue | Celery + Redis |
| LLM Runtime | Ollama |
| Execution Sandbox | Docker |
| Memory System | ChromaDB |
| Monitoring | Prometheus + Grafana |

## Agents

| Agent | Responsibility |
|-------|---------------|
| **Planner** | Analyzes the task and generates a high-level development plan |
| **Architect** | Designs project structure and technology choices |
| **Task Decomposer** | Breaks the plan into smaller development steps |
| **Test Generator** | Generates unit tests (TDD approach) |
| **Coder** | Generates code based on tasks and architecture |
| **Execution Runner** | Runs code inside Docker containers |
| **Debugger** | Fixes errors based on logs and failing tests (max 5 iterations) |
| **Refactor** | Improves code quality and performance |

## Quick Start

### Option 1: Docker Compose (Recommended)

```bash
# Clone and start all services
docker-compose up --build

# Pull the Ollama model (in a separate terminal)
docker exec -it devforge-ai-ollama-1 ollama pull codellama:7b
```

Services will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Grafana**: http://localhost:3001 (admin/devforge)
- **Prometheus**: http://localhost:9090

### Option 2: Local Development

#### Prerequisites
- Python 3.12+
- Node.js 20+
- Redis
- Docker (for sandbox execution)
- Ollama (optional, falls back to mock responses)

#### Backend

```bash
cd backend

# Install dependencies
poetry install

# Start Redis (if not running)
redis-server &

# Start the API server
poetry run fastapi dev app/main.py

# Start Celery worker (separate terminal)
poetry run celery -A app.tasks.celery_app worker --loglevel=info
```

#### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

#### Ollama (Optional)

```bash
# Install and start Ollama
ollama serve

# Pull a code model
ollama pull codellama:7b
```

## Workflow

```
User Task → Planner → Architecture Design → Task Decomposition
→ Generate Tests → Generate Code → Run Code in Docker
→ Run Tests → (If fail → Debugger → Fix → Re-run, max 5 iterations)
→ Refactor → Return Success
```

## Memory System

The ChromaDB-based memory system stores:
- **Solved bugs and fixes** — reused when similar errors occur
- **Working code patterns** — referenced during code generation

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tasks` | Create a new development task |
| GET | `/api/tasks` | List all tasks |
| GET | `/api/tasks/{id}` | Get task details |
| GET | `/api/tasks/{id}/logs` | Get agent activity logs |
| GET | `/api/tasks/{id}/code` | Get generated code |
| DELETE | `/api/tasks/{id}` | Delete a task |
| GET | `/api/agents` | List all agents |
| GET | `/api/agents/health` | Check agent dependencies |
| WS | `/ws/{task_id}` | Real-time task updates |

## Environment Variables

See `.env.example` files in `backend/` and `frontend/` directories.

## Project Structure

```
devforge-ai/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application
│   │   ├── config.py            # Settings & configuration
│   │   ├── api/routes/          # API endpoints
│   │   ├── agents/              # All 8 AI agents
│   │   ├── workflow/engine.py   # LangGraph workflow
│   │   ├── tasks/               # Celery task queue
│   │   ├── memory/store.py      # ChromaDB memory
│   │   ├── sandbox/             # Docker execution
│   │   ├── models/schemas.py    # Pydantic models
│   │   └── logging_system/      # Activity logging
│   ├── Dockerfile
│   └── pyproject.toml
├── frontend/
│   ├── src/
│   │   ├── app/                 # Next.js app router
│   │   ├── components/          # React components
│   │   ├── hooks/               # Custom hooks
│   │   ├── lib/api.ts           # API client
│   │   └── types/               # TypeScript types
│   ├── Dockerfile
│   └── package.json
├── monitoring/
│   └── prometheus.yml
├── docker-compose.yml
└── README.md
```
