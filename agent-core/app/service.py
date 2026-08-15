"""Advanced RAG pipeline using LlamaIndex and Pinecone."""

from llama_index.core import Settings as LlamaSettings
from llama_index.core import VectorStoreIndex
from llama_index.core.query_engine import BaseQueryEngine
from llama_index.embeddings.openai import OpenAIEmbedding
from llama_index.llms.openai import OpenAI
from llama_index.vector_stores.pinecone import PineconeVectorStore
from pinecone import Pinecone

from app.config import Settings, get_settings


class RAGService:
    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()
        self._query_engine: BaseQueryEngine | None = None

    def _configure_llama_index(self) -> None:
        LlamaSettings.llm = OpenAI(
            model=self.settings.llama_index_llm_model,
            api_key=self.settings.openai_api_key,
        )
        LlamaSettings.embed_model = OpenAIEmbedding(
            model=self.settings.llama_index_embed_model,
            api_key=self.settings.openai_api_key,
        )

    def _build_query_engine(self) -> BaseQueryEngine:
        self._configure_llama_index()
        pinecone_client = Pinecone(api_key=self.settings.pinecone_api_key)
        index = pinecone_client.Index(self.settings.pinecone_index_name)
        vector_store = PineconeVectorStore(pinecone_index=index)
        vector_index = VectorStoreIndex.from_vector_store(vector_store)
        return vector_index.as_query_engine()

    @property
    def query_engine(self) -> BaseQueryEngine:
        if self._query_engine is None:
            self._query_engine = self._build_query_engine()
        return self._query_engine

    def retrieve(self, query: str) -> str:
        response = self.query_engine.query(query)
        source_nodes = getattr(response, "source_nodes", [])
        if not source_nodes:
            return str(response)
        return "\n\n".join(node.get_content() for node in source_nodes)

    def generate(self, query: str, context: str) -> str:
        prompt = (
            "Answer the user query using only the provided context.\n\n"
            f"Context:\n{context}\n\nQuery:\n{query}"
        )
        response = self.query_engine.query(prompt)
        return str(response)

    def query(self, query: str) -> str:
        return str(self.query_engine.query(query))


rag_service = RAGService()
