# ai-cli-agent

**Developer CLI and shared toolkit for the Enterprise AI Workspace** — a multi-agent platform with an Angular studio UI, NestJS API gateway, and a Python FastAPI / LangGraph agent core.

`ai-cli-agent` is the published npm package for the workspace’s `libs/ai-cli` library. Use it as a global CLI, or import it into scripts and tools that interact with the gateway and agent stack.

---

## What this package is for

| Use case | How |
| --- | --- |
| Quick health check of the CLI install | `ai-cli ping` |
| Discover the default gateway dispatch URL | `ai-cli gateway-url` |
| Embed CLI commands in Node scripts | `import { createAiCli, runAiCli } from 'ai-cli-agent'` |
| Extend with more workspace commands | Compose on top of `createAiCli()` |

It sits beside the full monorepo architecture (UI → Gateway → Agent Core) and gives developers a small, installable entry point without cloning the entire workspace.

---

## Architecture (Enterprise AI Workspace)

```text
┌────────────────────┐
│  Angular Client    │  Studio UI / agent terminal (:4200)
│  apps/client       │
└─────────┬──────────┘
          │  POST /api/v1/gateway/agent/dispatch
          ▼
┌────────────────────┐
│  NestJS Gateway    │  JWT, proxy, Kafka events (:3000)
│  apps/gateway-server│  Swagger: /api/docs
└─────────┬──────────┘
          │  POST /api/v1/agent/chat
          ▼
┌────────────────────┐
│  Python Agent Core │  FastAPI + LangGraph + RAG (:8000)
│  agent-core        │  Docs: /docs
└────────────────────┘
          │
          ▼
   OpenAI / Pinecone (optional vector retrieval)

┌────────────────────┐
│  ai-cli-agent      │  This npm package (libs/ai-cli)
│  (CLI + library)   │  Developer tooling around the stack
└────────────────────┘
```

### Monorepo layout

```text
enterprise-ai-workspace/
├── apps/
│   ├── client/              # Angular 17+ Studio UI
│   └── gateway-server/      # NestJS Enterprise API Gateway
├── libs/
│   └── ai-cli/              # → published as ai-cli-agent
├── agent-core/              # Python FastAPI / LangGraph engine
├── docker-compose.yml       # Full-stack orchestration
└── package.json             # Nx workspace root
```

### Request flow

1. User enters a prompt in the Angular **agent terminal** (or calls the gateway API).
2. **Gateway** validates the request and proxies to **agent-core**.
3. **LangGraph** routes to a RAG or analytics agent node.
4. The agent answers via LLM (and optionally Pinecone retrieval).
5. Gateway returns a wrapped response; events can be published to **Kafka**.

### Default local endpoints

| Layer | URL |
| --- | --- |
| Client UI | http://localhost:4200 |
| Gateway API / Swagger | http://localhost:3000 / http://localhost:3000/api/docs |
| Agent Core / Swagger | http://localhost:8000 / http://localhost:8000/docs |
| Gateway dispatch (CLI default) | http://localhost:3000/api/v1/gateway/agent/dispatch |

---

## Install

```bash
npm install -g ai-cli-agent
```

Or as a project dependency:

```bash
npm install ai-cli-agent
```

**Requirements:** Node.js 18+

---

## CLI usage

```bash
ai-cli --help
ai-cli --version

ai-cli ping
# → ai-cli is ready

ai-cli gateway-url
# → http://localhost:3000/api/v1/gateway/agent/dispatch
```

| Command | Description |
| --- | --- |
| `ping` | Confirms the CLI binary is installed and runnable |
| `gateway-url` | Prints the default NestJS gateway agent dispatch endpoint |

---

## Library usage

```ts
import { createAiCli, runAiCli } from 'ai-cli-agent';

// Run the full CLI (same as the `ai-cli` binary)
runAiCli();

// Or build/extend the Commander program
const program = createAiCli('1.0.0');
program
  .command('status')
  .description('Custom workspace status check')
  .action(() => {
    console.log('workspace online');
  });
program.parse(process.argv);
```

### Exports

| Export | Description |
| --- | --- |
| `createAiCli(version?)` | Returns a configured Commander `Command` instance |
| `runAiCli(argv?)` | Parses argv and executes the CLI |

---

## Related stack components

- **Gateway** — NestJS proxy with Swagger, JWT strategy, Kafka producer/consumer
- **Agent Core** — FastAPI + LangGraph supervisor routing (`rag_agent` / `analytics_agent`)
- **Client** — Angular standalone UI with reactive `AiGatewayService` (RxJS)
- **Docker** — `docker compose up --build` runs client, gateway, agent-core, MongoDB, and Kafka

Clone the full workspace for local development of those services. This package is the lightweight CLI surface published to npm.

---

## License

MIT
