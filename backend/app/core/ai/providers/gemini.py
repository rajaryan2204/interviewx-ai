
from app.core.ai.providers.openai import OpenAIProvider


class GeminiProvider(OpenAIProvider):
    """
    AI Provider for Google Gemini using its OpenAI-compatible endpoint.
    Guarantees clean streaming and JSON outputs.
    """

    def __init__(self, api_key: str | None, model: str):
        # Gemini's OpenAI compatible base URL
        base_url = "https://generativelanguage.googleapis.com/v1beta/openai"
        super().__init__(base_url=base_url, api_key=api_key, model=model)
