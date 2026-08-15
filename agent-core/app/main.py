from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from app.graph import agent_executor
from langchain_core.messages import HumanMessage

app = FastAPI(
    title="Enterprise AI Agentic Core Service",
    description=(
        "Python FastAPI / LangGraph engine that executes multi-agent "
        "workflows and returns pipeline history plus the final answer."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)


class QueryRequest(BaseModel):
    prompt: str = Field(
        ...,
        min_length=1,
        description="Natural-language instruction for the agent workflow",
        examples=["Summarize the latest enterprise RAG pipeline status"],
    )


class ChatResponse(BaseModel):
    success: bool
    pipeline_history: list[str]
    final_output: str


class HealthResponse(BaseModel):
    status: str
    engine: str


@app.get("/", response_model=HealthResponse, tags=["Health"])
async def root():
    return {"status": "operational", "engine": "LangGraph Active"}


@app.post(
    "/api/v1/agent/chat",
    response_model=ChatResponse,
    tags=["Agent"],
    summary="Run LangGraph agent chat",
)
async def chat_with_agent(request: QueryRequest):
    try:
        initial_state = {"messages": [HumanMessage(content=request.prompt)]}
        output = agent_executor.invoke(initial_state)

        response_messages = [msg.content for msg in output["messages"]]
        return {
            "success": True,
            "pipeline_history": response_messages,
            "final_output": response_messages[-1],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
