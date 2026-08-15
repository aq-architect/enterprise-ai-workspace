# Enterprise AI Workspace

Nx monorepo for an enterprise multi-agent stack: Angular studio UI, NestJS API gateway, shared developer CLI, and a Python FastAPI / LangGraph agent core.

## Architecture

```
enterprise-ai-workspace/
├── apps/
│   ├── client/             # Angular 17+ Studio UI
│   └── gateway-server/     # NestJS API Gateway (JWT, Kafka, proxy)
├── libs/
│   └── ai-cli/             # Shared developer CLI library
├── agent-core/             # Python FastAPI + LangGraph engine
├── docker-compose.yml      # Full-stack Docker orchestration
├── package.json            # Single Node.js dependency root
├── nx.json
├── workspace.json
└── tsconfig.base.json
```

### Docker layout

| File | Purpose |
| --- | --- |
| `docker-compose.yml` | Runs client, gateway, agent-core, MongoDB, Kafka |
| `agent-core/Dockerfile` | Python FastAPI image |
| `apps/gateway-server/Dockerfile` | NestJS gateway image |
| `apps/client/Dockerfile` | Angular + nginx image |

### Request flow

```
Angular Client  →  NestJS Gateway (:3000)  →  Python Agent Core (:8000)
                         ↓
                      Kafka events
```

| Layer | Role | Default URL |
| --- | --- | --- |
| `apps/client` | Prompt console / studio UI | `http://localhost:4200` |
| `apps/gateway-server` | Auth, proxy, event publishing | `http://localhost:3000` |
| `agent-core` | LangGraph agent + RAG pipeline | `http://localhost:8000` |
| `libs/ai-cli` | Shared developer CLI utilities | — |

### Key endpoints

| Method | Path | Service |
| --- | --- | --- |
| `POST` | `/api/v1/gateway/agent/dispatch` | Gateway → Agent Core proxy |
| `POST` | `/api/v1/agent/chat` | Agent Core chat entry |
| `GET` | `/` | Agent Core health/status |

### API docs (Swagger / OpenAPI)

| Service | Docs URL | OpenAPI JSON |
| --- | --- | --- |
| Gateway (NestJS) | http://localhost:3000/api/docs | http://localhost:3000/api/docs-json |
| Agent Core (FastAPI) | http://localhost:8000/docs | http://localhost:8000/openapi.json |
| Agent Core ReDoc | http://localhost:8000/redoc | — |

## Prerequisites

- **Node.js** 20+
- **npm** 10+
- **Python** 3.11+
- **Git**
- Optional: MongoDB (`localhost:27017`), Kafka (`localhost:9092`), OpenAI + Pinecone API keys

## Quick start

### 1. Clone and install Node workspace

```bash
git clone <your-repo-url> enterprise-ai-workspace
cd enterprise-ai-workspace
npm install
```

### 2. Configure environment files

Copy the example env files and fill in real values:

```bash
# Windows PowerShell
Copy-Item agent-core\.env.example agent-core\.env
Copy-Item apps\gateway-server\.env.example apps\gateway-server\.env

# macOS / Linux
cp agent-core/.env.example agent-core/.env
cp apps/gateway-server/.env.example apps/gateway-server/.env
```

Never commit `.env` files. Only `.env.example` files are tracked.

### 3. Start Python Agent Core

```bash
cd agent-core
python -m venv .venv

# Windows
.\.venv\Scripts\Activate.ps1

# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 4. Start NestJS Gateway

From the workspace root (another terminal):

```bash
npm run start:gateway
# or
npx nx serve gateway-server
```

Gateway listens on `http://localhost:3000`.

### 5. Start Angular Client

From the workspace root (another terminal):

```bash
npm run start:client
# or
npx nx serve client
```

Client listens on `http://localhost:4200` and posts prompts to:

`http://localhost:3000/api/v1/gateway/agent/dispatch`

## Environment variables

### `agent-core/.env`

| Variable | Required | Description |
| --- | --- | --- |
| `APP_ENV` | No | Runtime environment (`development`, `production`) |
| `DEBUG` | No | Enable debug mode (`true` / `false`) |
| `OPENAI_API_KEY` | Yes | OpenAI API key for LLM / embeddings |
| `PINECONE_API_KEY` | Yes | Pinecone vector DB API key |
| `PINECONE_ENVIRONMENT` | No | Pinecone region / environment (default `us-east-1`) |

### `apps/gateway-server/.env`

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | No | Gateway HTTP port (default `3000`) |
| `NODE_ENV` | No | Node environment |
| `MONGO_URI` | No | MongoDB connection string |
| `AI_CORE_URL` | Yes | Full agent-core chat URL |
| `KAFKA_BROKERS` | No | Comma-separated Kafka brokers |
| `JWT_SECRET` | Yes | Secret used to sign/verify JWTs |
| `JWT_EXPIRES_IN` | No | Token lifetime (e.g. `1h`) |
| `KAFKA_CLIENT_ID` | No | Kafka client id |
| `KAFKA_GROUP_ID` | No | Kafka consumer group |
| `KAFKA_AI_EVENTS_TOPIC` | No | Topic for AI gateway events |

See:

- [`agent-core/.env.example`](agent-core/.env.example)
- [`apps/gateway-server/.env.example`](apps/gateway-server/.env.example)

## Nx commands

| Command | Description |
| --- | --- |
| `npm run start:client` | Serve Angular studio |
| `npm run start:gateway` | Serve NestJS gateway |
| `npm run build` | Build all Node projects |
| `npm run build:client` | Build Angular app |
| `npm run build:gateway` | Build NestJS gateway |
| `npm run build:ai-cli` | Build shared CLI library |
| `npx nx graph` | Visualize project graph |

## Project details

### `apps/client` (Angular 17+)

- Standalone components
- `AgentTerminalComponent` for real-time prompt/console UX
- `AiGatewayService` RxJS HTTP client to the Nest gateway

### `apps/gateway-server` (NestJS)

- Domain modules: `auth`, `ai-gateway`, `events`
- JWT strategy + guard
- Proxies validated prompts to Python agent-core
- Kafka producer/consumer for gateway events (degrades gracefully if Kafka is down)

### `agent-core` (Python)

- FastAPI entrypoint (`app/main.py`)
- LangGraph workflow (`app/graph.py`)
- RAG / LlamaIndex + Pinecone service (`app/service.py`)
- Settings via `python-dotenv` + pydantic (`app/config.py`)

### `libs/ai-cli`

- Shared Commander-based CLI helpers
- Path alias: `@enterprise-ai/ai-cli`

## Docker (all services)

Prerequisites: [Docker Desktop](https://www.docker.com/products/docker-desktop/) with Compose v2.

1. Ensure env files exist and contain real keys:

```powershell
Copy-Item agent-core\.env.example agent-core\.env
Copy-Item apps\gateway-server\.env.example apps\gateway-server\.env
```

2. Build and start the full stack:

```powershell
docker compose up --build -d
# or
npm run docker:up
```

3. Open:

| Service | URL |
| --- | --- |
| Client UI | http://localhost:4200 |
| Gateway Swagger | http://localhost:3000/api/docs |
| Agent Core Swagger | http://localhost:8000/docs |

4. Useful commands:

```powershell
npm run docker:ps      # container status
npm run docker:logs    # follow logs
npm run docker:down    # stop stack
docker compose up --build agent-core gateway-server   # subset only
```

Compose wires internal networking automatically:

- Gateway → `http://agent-core:8000/api/v1/agent/chat`
- Gateway → `mongodb://mongo:27017/enterprise-ai`
- Gateway → `kafka:29092`

## Local development checklist

1. Copy both `.env.example` files to `.env`
2. Set OpenAI / Pinecone keys in `agent-core/.env`
3. Set a strong `JWT_SECRET` in `apps/gateway-server/.env`
4. Confirm `AI_CORE_URL=http://localhost:8000/api/v1/agent/chat`
5. Start agent-core → gateway → client (in that order)
6. Open the studio UI and submit a prompt

## CI

GitHub Actions workflows:

- [`.github/workflows/ci-pipeline.yml`](.github/workflows/ci-pipeline.yml) — Node/Python build checks
- [`.github/workflows/docker.yml`](.github/workflows/docker.yml) — Compose validate + image builds

Jobs (app CI):

1. **gateway-validation** — `npm ci` + `nx build gateway-server`
2. **ai-core-validation** — install Python deps + flake8 syntax checks
3. **client-validation** — `npm ci` + `nx build client`

## Security notes

- `.env` files are gitignored
- Do not commit API keys, JWT secrets, or connection strings
- Rotate any secrets that were previously committed or shared
- Prefer short-lived tokens and least-privilege cloud keys in production

## License

UNLICENSED / private repository.
