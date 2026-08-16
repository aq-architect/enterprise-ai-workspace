"""LLM factory — Google Gemini only, any model id via LLM_MODEL."""

from google.genai.types import AutomaticFunctionCallingConfig
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_google_genai import ChatGoogleGenerativeAI

from app.config import settings


def _has_real_key(value: str) -> bool:
    return bool(value) and not value.startswith("your_")


def get_llm(model: str | None = None, temperature: float = 0.2) -> BaseChatModel:
    """
    Create a Gemini chat model.

    Model is fully configurable via LLM_MODEL (or the model= argument),
    e.g. gemini-2.5-flash, gemini-2.5-pro, gemini-2.5-flash-lite.
    """
    if not _has_real_key(settings.GEMINI_API_KEY):
        raise ValueError(
            "GEMINI_API_KEY is missing or still a placeholder in agent-core/.env"
        )

    selected_model = (model or settings.LLM_MODEL or "gemini-2.5-flash").strip()

    llm = ChatGoogleGenerativeAI(
        model=selected_model,
        google_api_key=settings.GEMINI_API_KEY,
        temperature=temperature,
    )

    # We don't use tools; disable AFC to avoid google-genai warnings on generate_content.
    return llm.bind(
        automatic_function_calling=AutomaticFunctionCallingConfig(disable=True)
    )
