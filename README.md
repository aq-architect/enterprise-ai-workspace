# Enterprise AI Workspace

Nx monorepo for an enterprise multi-agent stack: Angular studio UI, NestJS/Docker option for full local stack, and a **100% free Vercel serverless** path (Angular + Node gateway + Python Gemini) for portfolio hosting without paid container plans.

## Architecture

```
enterprise-ai-workspace/
├── apps/
│   ├── client/             # Angular 17+ Studio UI
│   └── gateway-server/     # NestJS gateway (local/Docker)
├── api/                    # Vercel serverless backends (free host)
│   ├── gateway.ts          # Node proxy → agent
│   ├── agent.py            # Python Gemini worker
│   └── requirements.txt
├── libs/
│   └── ai-cli/             # npm: ai-cli-agent
├── agent-core/             # Full FastAPI + LangGraph (local/Docker)
├── vercel.json             # Vercel build + routes
├── docker-compose.yml
└── package.json
```

### Free Vercel serverless flow (recommended for portfolio)

```
Browser (same Vercel domain)
      ↓  POST /api/v1/gateway/dispatch
api/gateway.ts  (Node serverless)
      ↓  POST /api/v1/agent/chat
api/agent.py    (Python serverless → Gemini)
      ↓
JSON answer → Angular terminal
```

No always-on containers. Functions run on demand. Set `GEMINI_API_KEY` in the Vercel project env.

### Local / Docker flow (full Nest + FastAPI)

```
Angular Client (:4200)
      ↓
NestJS Gateway (:3000)
      ↓
Python Agent Core (:8000) → Gemini
```

| Layer | Role | Default URL |
| --- | --- | --- |
| `apps/client` | Studio UI | http://localhost:4200 (local) or Vercel domain |
| `api/*` | Free serverless gateway + agent | `/api/v1/gateway/dispatch` |
| `apps/gateway-server` | NestJS (optional local) | http://localhost:3000 |
| `agent-core` | FastAPI LangGraph (optional local) | http://localhost:8000 |
| `libs/ai-cli` | Developer CLI | — |

### API docs

| Surface | Docs URL |
| --- | --- |
| Vercel (serverless catalog) | `https://YOUR_DOMAIN/api/docs` (alias: `/api/agent/docs`) |
| Local Nest gateway Swagger | http://localhost:3000/api/docs |
| Local FastAPI agent Swagger | http://localhost:8000/docs |
| Local FastAPI ReDoc | http://localhost:8000/redoc |

On Vercel there is **no** FastAPI Swagger UI — only the JSON catalog above. Chat via `POST /api/v1/gateway/dispatch`.

---

## Who installs what?

| Audience | Installs | Adds API keys? |
| --- | --- | --- |
| **End user** | Nothing — opens the Studio URL | No |
| **Platform admin / you** | This repo (Docker or local) | Yes — `GEMINI_API_KEY` in `agent-core/.env` |
| **Developer (CLI helper)** | `npm i -g ai-cli-agent` | No (CLI does not call Gemini) |

LLM keys stay on the **server** (`agent-core`). End users and the npm CLI never paste keys.

---

## Deploy free on Vercel (no credit card)

Host the Angular UI + serverless Node gateway + serverless Python Gemini agent on one domain.

### 1. Prerequisites

- GitHub repo pushed
- Free [Vercel](https://vercel.com) account
- Gemini key from [Google AI Studio](https://aistudio.google.com/apikey)

### 2. Project files used

| File | Purpose |
| --- | --- |
| `vercel.json` | Build Angular + rewrite API routes |
| `api/gateway.ts` | Serverless Node proxy |
| `api/agent.py` | Serverless Python → Gemini |
| `api/requirements.txt` | Python deps for the agent function |

### 3. Deploy

1. Push code to GitHub  
2. Vercel → **Add New** → **Project** → import repo  
3. Framework preset: leave default / Other (reads `vercel.json`)  
4. Environment variables:

| Key | Value |
| --- | --- |
| `GEMINI_API_KEY` | your Google AI Studio key |
| `LLM_MODEL` | `gemini-2.5-flash` (optional) |

5. Click **Deploy**

### Troubleshoot `404 NOT_FOUND` on `/api/*`

Common causes:

1. **Wrong path** — `/api/agent/docs` is not FastAPI Swagger on Vercel. Use `/api/docs` (or wait for redeploy of the alias). Valid routes: `GET /api/health`, `GET /api/docs`, `POST /api/v1/gateway/dispatch`, `POST /api/v1/agent/chat`.
2. **Framework preset** — set **Other** (not Angular) so `api/*.ts` serverless functions deploy. Build: `npm run build:client`, Output: `dist/apps/client/browser`, Root: repo root.
3. After fixing, **Redeploy** and smoke-test `/api/health`.

### Troubleshoot `401` on `/api/v1/gateway/dispatch`

Your URL looks like a **git preview** deployment (`…-git-main-….vercel.app`). Vercel often enables **Deployment Protection**, which returns **401** to anonymous API calls (the Angular app then shows “Gateway communication failure”).

Fix:

1. Vercel → your project → **Settings** → **Deployment Protection**
2. Set protection to **None** / disable for Production (and Preview if you use preview URLs)
3. Prefer the **Production** domain (`your-project.vercel.app`), not only the `git-main` URL
4. Confirm `GEMINI_API_KEY` is set under **Settings → Environment Variables** (Production)
5. Smoke-test: open `https://YOUR_DOMAIN/api/health` — should return `{ "status": "ok", ... }` without login

### 4. Local serverless preview

```powershell
npm install
npx vercel login
npx vercel env pull   # optional
npm run vercel:dev
```

Studio + APIs share one origin. The Angular client calls `/api/v1/gateway/dispatch` (same domain).

### 5. End-user flow on Vercel

1. Open your `*.vercel.app` URL  
2. Type a prompt in the terminal UI  
3. Gateway function → agent function → Gemini → answer  

No Nest/FastAPI processes required for this free host path. Keep `apps/gateway-server` and `agent-core` for rich local/Docker development.

---

## Prerequisites

- Node.js 22+ (24 recommended for CI/Vercel)
- npm 10+
- Python 3.11+ (for local `agent-core` only)
- Git
- Gemini API key
- Optional: MongoDB, Kafka, Pinecone, Docker

---

## Quick start (local)

### 1. Clone and install Node workspace

```bash
git clone <your-repo-url> enterprise-ai-workspace
cd enterprise-ai-workspace
npm install
```

### 2. Configure environment files

```powershell
Copy-Item agent-core\.env.example agent-core\.env
Copy-Item apps\gateway-server\.env.example apps\gateway-server\.env
```

Edit `agent-core/.env`:

```env
LLM_PROVIDER=gemini
LLM_MODEL=gemini-2.5-flash
GEMINI_API_KEY=your_real_gemini_key
```

Never commit `.env` files.

### 3. Start Python Agent Core

```powershell
cd agent-core
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

### 4. Start NestJS Gateway

```powershell
npm run start:gateway
```

### 5. Start Angular Client

```powershell
npm run start:client
```

Open http://localhost:4200 and submit a prompt.

---

## LLM configuration (Gemini)

Agent-core uses `app/llm.py` with Google Gemini.

| Variable | Default | Description |
| --- | --- | --- |
| `LLM_PROVIDER` | `gemini` | LLM provider |
| `LLM_MODEL` | `gemini-2.5-flash` | **Any** Gemini model id — change without code edits |
| `GEMINI_API_KEY` | — | Required Google Gemini API key |

### Switch Gemini models freely

```env
LLM_MODEL=gemini-2.5-flash
# or
LLM_MODEL=gemini-2.5-flash-lite
# or
LLM_MODEL=gemini-2.5-pro
# or
LLM_MODEL=gemini-flash-latest
```

Restart / rely on `--reload` after changing `.env`.

---

## Environment variables

### `agent-core/.env`

| Variable | Required | Description |
| --- | --- | --- |
| `APP_ENV` | No | `development` / `production` |
| `DEBUG` | No | Debug flag |
| `LLM_PROVIDER` | No | Default `gemini` |
| `LLM_MODEL` | No | Any Gemini model id (default `gemini-2.5-flash`) |
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `PINECONE_API_KEY` | No | Optional vector retrieval |
| `PINECONE_ENVIRONMENT` | No | Default `us-east-1` |
| `PINECONE_INDEX_NAME` | No | Default `agent-core` |
| `PINECONE_HOST` | No | Optional Pinecone host |

### `apps/gateway-server/.env`

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | No | Default `3000` |
| `NODE_ENV` | No | Node environment |
| `MONGO_URI` | No | Mongo connection string |
| `AI_CORE_URL` | Yes | e.g. `http://localhost:8000/api/v1/agent/chat` |
| `KAFKA_BROKERS` | No | Kafka brokers |
| `JWT_SECRET` | Yes | JWT signing secret |
| `JWT_EXPIRES_IN` | No | e.g. `1h` |
| `KAFKA_CLIENT_ID` | No | Kafka client id |
| `KAFKA_GROUP_ID` | No | Consumer group |
| `KAFKA_AI_EVENTS_TOPIC` | No | Events topic |

Templates: [`agent-core/.env.example`](agent-core/.env.example), [`apps/gateway-server/.env.example`](apps/gateway-server/.env.example)

---

## Docker (full stack)

```powershell
Copy-Item agent-core\.env.example agent-core\.env
Copy-Item apps\gateway-server\.env.example apps\gateway-server\.env
# set GEMINI_API_KEY in agent-core\.env

docker compose up --build -d
# or: npm run docker:up
```

| Service | URL |
| --- | --- |
| Client UI | http://localhost:4200 |
| Gateway Swagger | http://localhost:3000/api/docs |
| Agent Core Swagger | http://localhost:8000/docs |

```powershell
npm run docker:ps
npm run docker:logs
npm run docker:down
```

Internal networking:

- Gateway → `http://agent-core:8000/api/v1/agent/chat`
- Gateway → `mongodb://mongo:27017/enterprise-ai`
- Gateway → `kafka:29092`

---

## npm package: `ai-cli-agent`

Developer helper only (not the end-user product):

```bash
npm install -g ai-cli-agent
ai-cli ping
ai-cli gateway-url
```

Does **not** require `GEMINI_API_KEY`. See [`libs/ai-cli/README.md`](libs/ai-cli/README.md).

Publish from repo root:

```bash
npm run publish:ai-cli
```

---

## Nx commands

| Command | Description |
| --- | --- |
| `npm run start:client` | Serve Angular studio |
| `npm run start:gateway` | Serve NestJS gateway |
| `npm run build` | Build all Node projects |
| `npm run build:client` | Build Angular app |
| `npm run build:gateway` | Build NestJS gateway |
| `npm run build:ai-cli` | Build CLI library |
| `npx nx graph` | Project graph |

---

## Project details

### `apps/client`

- Angular 17+ standalone components
- Agent terminal UI
- `AiGatewayService` → gateway dispatch endpoint

### `apps/gateway-server`

- Modules: `auth`, `ai-gateway`, `events`
- Swagger at `/api/docs`
- Proxies prompts to agent-core
- Kafka events (graceful if Kafka is down)

### `agent-core`

- FastAPI + LangGraph (`app/graph.py`)
- Gemini LLM factory (`app/llm.py`) with any `LLM_MODEL`
- Optional Pinecone retrieve (`app/service.py`)
- Settings (`app/config.py`)

### `libs/ai-cli`

- Commander CLI published as `ai-cli-agent`

---

## Local checklist

1. Copy `.env.example` → `.env` for agent-core and gateway
2. Set `GEMINI_API_KEY` (+ `LLM_PROVIDER=gemini`, `LLM_MODEL=...`)
3. Set `JWT_SECRET` on gateway
4. Confirm `AI_CORE_URL=http://localhost:8000/api/v1/agent/chat`
5. Start agent-core → gateway → client
6. Open http://localhost:4200 and chat

---

## CI

- [`.github/workflows/ci-pipeline.yml`](.github/workflows/ci-pipeline.yml) — Node/Python builds
- [`.github/workflows/docker.yml`](.github/workflows/docker.yml) — Compose build

---

## Security notes

- `.env` is gitignored; commit only `.env.example`
- Keep `GEMINI_API_KEY` on the server only
- Rotate keys if they were ever committed or pasted into chat
- Prefer least-privilege cloud keys in production

## License

UNLICENSED / private repository.
