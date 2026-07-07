from app.core.ai.providers.base import BaseAIProvider
from app.core.ai.providers.gemini import GeminiProvider
from app.core.ai.providers.mock import MockProvider
from app.core.ai.providers.ollama import OllamaProvider
from app.core.ai.providers.openai import OpenAIProvider
from app.core.ai.providers.stt import (
    BaseSTTProvider,
    DeepgramProvider,
    FasterWhisperProvider,
    MockSTTProvider,
    OpenAIWhisperProvider,
)
from app.core.ai.providers.tts import (
    BaseTTSProvider,
    ElevenLabsTTSProvider,
    MockTTSProvider,
    OpenAITTSProvider,
)
from app.core.config import settings


class AIProviderFactory:
    """
    Factory class to dynamically instantiate the configured AI Provider.
    """

    @staticmethod
    def get_provider(provider_name: str | None = None) -> BaseAIProvider:
        active_provider = (provider_name or settings.AI_PROVIDER).lower()

        if active_provider == "openai":
            if not settings.OPENAI_API_KEY:
                # Fallback to Mock if key is missing
                return MockProvider()
            return OpenAIProvider(
                base_url=settings.OPENAI_BASE_URL,
                api_key=settings.OPENAI_API_KEY,
                model=settings.OPENAI_MODEL,
            )

        elif active_provider == "gemini":
            if not settings.GEMINI_API_KEY:
                return MockProvider()
            return GeminiProvider(
                api_key=settings.GEMINI_API_KEY,
                model=settings.GEMINI_MODEL,
            )

        elif active_provider == "ollama":
            return OllamaProvider(
                base_url=settings.OLLAMA_BASE_URL,
                model=settings.OLLAMA_MODEL,
            )

        elif active_provider == "lm_studio":
            return OpenAIProvider(
                base_url=settings.LM_STUDIO_BASE_URL,
                api_key=None,
                model=settings.LM_STUDIO_MODEL,
            )

        else:
            return MockProvider()

    @staticmethod
    def get_stt_provider(provider_name: str | None = None) -> BaseSTTProvider:
        active_provider = (provider_name or settings.STT_PROVIDER).lower()

        if active_provider == "openai":
            if not settings.OPENAI_API_KEY:
                return MockSTTProvider()
            return OpenAIWhisperProvider()
        elif active_provider == "deepgram":
            if not settings.DEEPGRAM_API_KEY:
                return MockSTTProvider()
            return DeepgramProvider()
        elif active_provider == "faster-whisper":
            return FasterWhisperProvider()
        else:
            return MockSTTProvider()

    @staticmethod
    def get_tts_provider(provider_name: str | None = None) -> BaseTTSProvider:
        active_provider = (provider_name or settings.TTS_PROVIDER).lower()

        if active_provider == "openai":
            if not settings.OPENAI_API_KEY:
                return MockTTSProvider()
            return OpenAITTSProvider()
        elif active_provider == "elevenlabs":
            if not settings.ELEVENLABS_API_KEY:
                return MockTTSProvider()
            return ElevenLabsTTSProvider()
        else:
            return MockTTSProvider()
