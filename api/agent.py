from http.server import BaseHTTPRequestHandler
import json
import os
import traceback

import google.generativeai as genai

genai.configure(api_key=os.environ.get("GEMINI_API_KEY", ""))
MODEL_NAME = os.environ.get("LLM_MODEL", "gemini-2.5-flash")


def _cors_headers(handler: BaseHTTPRequestHandler) -> None:
    handler.send_header("Access-Control-Allow-Origin", "*")
    handler.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
    handler.send_header("Access-Control-Allow-Headers", "Content-Type")


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(204)
        _cors_headers(self)
        self.end_headers()

    def do_POST(self):
        try:
            content_length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(content_length) if content_length else b"{}"
            payload = json.loads(raw.decode("utf-8") or "{}")
            prompt = (payload.get("prompt") or "").strip()

            if not prompt:
                self._json(400, {"success": False, "detail": "Missing prompt"})
                return

            api_key = os.environ.get("GEMINI_API_KEY", "")
            if not api_key or api_key.startswith("your_"):
                self._json(
                    500,
                    {
                        "success": False,
                        "detail": "GEMINI_API_KEY is not configured in Vercel env",
                    },
                )
                return

            model = genai.GenerativeModel(MODEL_NAME)
            result = model.generate_content(prompt)
            text = getattr(result, "text", None) or str(result)

            self._json(
                200,
                {
                    "success": True,
                    "pipeline_history": [
                        prompt,
                        f"[Serverless Agent Core / {MODEL_NAME}]",
                        text,
                    ],
                    "final_output": text,
                },
            )
        except Exception as exc:
            self._json(
                500,
                {
                    "success": False,
                    "detail": str(exc),
                    "trace": traceback.format_exc(),
                },
            )

    def _json(self, status: int, body: dict) -> None:
        encoded = json.dumps(body).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        _cors_headers(self)
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)

    def log_message(self, format: str, *args) -> None:
        return
