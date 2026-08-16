"""RAG helpers. Chat answers use Gemini via app.llm; vector retrieve is optional."""

from app.config import settings


class RAGService:
    """
    Optional Pinecone retrieval.

    Generation always happens through get_llm() (Gemini by default) in graph.py,
    so missing vector embeddings will not block chat.
    """

    def retrieve(self, query: str) -> str:
        if not settings.PINECONE_API_KEY or settings.PINECONE_API_KEY.startswith(
            "your_"
        ):
            return ""

        # Soft dependency path — if LlamaIndex/Pinecone stack is not configured
        # for Gemini embeddings yet, callers fall back to pure LLM answers.
        try:
            from llama_index.core import VectorStoreIndex
            from llama_index.vector_stores.pinecone import PineconeVectorStore
            from pinecone import Pinecone

            pinecone_client = Pinecone(api_key=settings.PINECONE_API_KEY)
            index = pinecone_client.Index(settings.PINECONE_INDEX_NAME)
            vector_store = PineconeVectorStore(pinecone_index=index)
            vector_index = VectorStoreIndex.from_vector_store(vector_store)
            response = vector_index.as_query_engine().query(query)
            source_nodes = getattr(response, "source_nodes", [])
            if not source_nodes:
                return str(response)
            return "\n\n".join(node.get_content() for node in source_nodes)
        except Exception:
            return ""


rag_service = RAGService()
