import json
from collections.abc import AsyncGenerator
from typing import Any

import httpx

from app.core.ai.providers.base import BaseAIProvider


class OllamaProvider(BaseAIProvider):
    """
    AI Provider for Ollama using its native /api/chat REST endpoint.
    """

    def __init__(self, base_url: str, model: str):
        self.base_url = base_url.rstrip("/")
        self.model = model

    def _build_messages(
        self,
        prompt: str,
        system_prompt: str | None = None,
        history: list[dict[str, str]] | None = None,
    ) -> list[dict[str, str]]:
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})

        if history:
            for msg in history:
                messages.append({"role": msg["role"], "content": msg["content"]})

        messages.append({"role": "user", "content": prompt})
        return messages

    async def generate(
        self,
        prompt: str,
        system_prompt: str | None = None,
        history: list[dict[str, str]] | None = None,
    ) -> str:
        messages = self._build_messages(prompt, system_prompt, history)
        payload = {
            "model": self.model,
            "messages": messages,
            "stream": False,
            "options": {"temperature": 0.2},
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/api/chat",
                json=payload,
                timeout=30.0,
            )
            response.raise_for_status()
            data = response.json()
            return str(data["message"]["content"])

    async def generate_stream(
        self,
        prompt: str,
        system_prompt: str | None = None,
        history: list[dict[str, str]] | None = None,
    ) -> AsyncGenerator[str, None]:
        messages = self._build_messages(prompt, system_prompt, history)
        payload = {
            "model": self.model,
            "messages": messages,
            "stream": True,
            "options": {"temperature": 0.2},
        }

        async with httpx.AsyncClient() as client:
            async with client.stream(
                "POST",
                f"{self.base_url}/api/chat",
                json=payload,
                timeout=30.0,
            ) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if not line:
                        continue
                    try:
                        chunk = json.loads(line)
                        content = chunk["message"].get("content", "")
                        if content:
                            yield content
                        if chunk.get("done", False):
                            break
                    except Exception:
                        pass

    async def generate_json(
        self,
        prompt: str,
        schema: dict[str, Any],
        system_prompt: str | None = None,
    ) -> dict[str, Any]:
        schema_instruction = (
            f"\n\nYou MUST return a JSON object matching this schema:\n{json.dumps(schema)}"
            "\nOutput ONLY the JSON object. Do not include markdown code block syntax."
        )
        combined_prompt = prompt + schema_instruction

        messages = self._build_messages(combined_prompt, system_prompt)
        payload = {
            "model": self.model,
            "messages": messages,
            "stream": False,
            "format": "json",
            "options": {"temperature": 0.1},
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/api/chat",
                json=payload,
                timeout=45.0,
            )
            response.raise_for_status()
            data = response.json()
            content = data["message"]["content"]
            try:
                cleaned_content = content.replace("```json", "").replace("```", "").strip()
                return dict(json.loads(cleaned_content))
            except Exception as e:
                raise ValueError(
                    f"Ollama did not output valid JSON: {content}. Error: {str(e)}"
                )
