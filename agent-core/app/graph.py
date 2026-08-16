from typing import Annotated, Sequence, TypedDict

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage
from langgraph.graph import END, StateGraph

from app.config import settings
from app.llm import get_llm


class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], lambda x, y: x + y]
    next_step: str


def _latest_user_text(state: AgentState) -> str:
    for message in reversed(state["messages"]):
        if isinstance(message, HumanMessage) or message.type == "human":
            return str(message.content)
    return str(state["messages"][-1].content)


def supervisor_router(state: AgentState):
    prompt = _latest_user_text(state).lower()
    analytics_keywords = (
        "analyze",
        "analysis",
        "report",
        "metrics",
        "statistics",
        "trend",
        "compute",
    )
    if any(keyword in prompt for keyword in analytics_keywords):
        return {"next_step": "analytics_agent"}
    return {"next_step": "rag_agent"}


def _answer_with_rag(query: str) -> str:
    """Try Pinecone RAG first; fall back to direct Gemini if retrieval is unavailable."""
    try:
        from app.service import rag_service

        if settings.PINECONE_API_KEY and not settings.PINECONE_API_KEY.startswith(
            "your_"
        ):
            context = rag_service.retrieve(query)
            if context and context.strip():
                llm = get_llm()
                response = llm.invoke(
                    [
                        SystemMessage(
                            content=(
                                "You are the enterprise RAG agent. Answer using the "
                                "retrieved context when relevant. If context is weak, "
                                "say what is missing and still help with general knowledge."
                            )
                        ),
                        HumanMessage(
                            content=f"Context:\n{context}\n\nUser question:\n{query}"
                        ),
                    ]
                )
                return f"[RAG Agent]: {response.content}"
    except Exception as exc:
        fallback_note = f"(vector retrieval unavailable: {exc})"
    else:
        fallback_note = "(no indexed context found; answering with model knowledge)"

    llm = get_llm()
    response = llm.invoke(
        [
            SystemMessage(
                content=(
                    "You are the enterprise RAG agent. Provide a clear, helpful answer. "
                    f"Note for the user: {fallback_note}"
                )
            ),
            HumanMessage(content=query),
        ]
    )
    return f"[RAG Agent]: {response.content}"


def rag_agent_node(state: AgentState):
    query = _latest_user_text(state)
    answer = _answer_with_rag(query)
    return {"messages": [AIMessage(content=answer)]}


def analytics_agent_node(state: AgentState):
    query = _latest_user_text(state)
    llm = get_llm()
    response = llm.invoke(
        [
            SystemMessage(
                content=(
                    "You are the enterprise analytics agent. Provide structured analysis, "
                    "assumptions, and actionable insights."
                )
            ),
            HumanMessage(content=query),
        ]
    )
    return {"messages": [AIMessage(content=f"[Analytics Agent]: {response.content}")]}


workflow = StateGraph(AgentState)
workflow.add_node("supervisor", supervisor_router)
workflow.add_node("rag_agent", rag_agent_node)
workflow.add_node("analytics_agent", analytics_agent_node)
workflow.set_entry_point("supervisor")
workflow.add_conditional_edges(
    "supervisor",
    lambda x: x["next_step"],
    {
        "rag_agent": "rag_agent",
        "analytics_agent": "analytics_agent",
    },
)
workflow.add_edge("rag_agent", END)
workflow.add_edge("analytics_agent", END)

agent_executor = workflow.compile()
