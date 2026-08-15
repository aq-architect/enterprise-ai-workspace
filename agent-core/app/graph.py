from typing import Annotated, Sequence, TypedDict

from langchain_core.messages import AIMessage, BaseMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import END, StateGraph

from app.config import settings


class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], lambda x, y: x + y]
    next_step: str


def get_llm() -> ChatOpenAI:
    return ChatOpenAI(
        model="gpt-4o",
        temperature=0,
        api_key=settings.OPENAI_API_KEY or None,
    )


def supervisor_router(state: AgentState):
    messages = state["messages"]
    last_message = messages[-1].content

    if "analyze" in last_message.lower() or "report" in last_message.lower():
        return {"next_step": "analytics_agent"}
    return {"next_step": "rag_agent"}


def rag_agent_node(state: AgentState):
    return {
        "messages": [
            AIMessage(
                content="[RAG Agent]: Querying vector logs for enterprise data variables..."
            )
        ]
    }


def analytics_agent_node(state: AgentState):
    return {
        "messages": [
            AIMessage(
                content="[Analytics Agent]: Computing high-volume matrix schemas and log states."
            )
        ]
    }


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
