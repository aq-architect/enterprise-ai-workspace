# agent-core

Python **FastAPI + LangGraph** service for the Enterprise AI Workspace.

LLM provider: **Google Gemini** (`GEMINI_API_KEY`).

## Run locally

```powershell
cd agent-core
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env   # if needed
# set GEMINI_API_KEY in .env
python -m uvicorn app.main:app --reload --port 8000
```

- Health: http://localhost:8000/
- Swagger: http://localhost:8000/docs
- Chat: `POST /api/v1/agent/chat` with `{ "prompt": "..." }`

## LLM setup (Gemini)

```env
LLM_PROVIDER=gemini
LLM_MODEL=gemini-2.5-flash
GEMINI_API_KEY=your_gemini_api_key_here
```

Change `LLM_MODEL` to any Gemini model id without code changes, for example:

- `gemini-2.5-flash`
- `gemini-2.5-flash-lite`
- `gemini-2.5-pro`
- `gemini-flash-latest`

## Layout

| File | Role |
| --- | --- |
| `app/main.py` | FastAPI routes |
| `app/graph.py` | LangGraph supervisor + agents |
| `app/llm.py` | Gemini chat model factory |
| `app/service.py` | Optional Pinecone retrieve |
| `app/config.py` | Settings from `.env` |

## Notes

- API keys stay in `agent-core/.env` (server-side). End users of the Studio UI do not set keys.
- If Pinecone is missing or misconfigured, agents still answer with Gemini model knowledge.
