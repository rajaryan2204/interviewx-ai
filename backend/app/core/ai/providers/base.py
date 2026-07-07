from abc import ABC, abstractmethod
from collections.abc import AsyncGenerator
from typing import Any


class BaseAIProvider(ABC):
    """
    Abstract Base Class for all AI LLM Providers.
    Decouples the core SaaS logic from direct provider SDK dependencies.
    """

    @abstractmethod
    async def generate(
        self,
        prompt: str,
        system_prompt: str | None = None,
        history: list[dict[str, str]] | None = None,
    ) -> str:
        """
        Generate a text response from the LLM.
        """
        pass

    @abstractmethod
    async def generate_stream(
        self,
        prompt: str,
        system_prompt: str | None = None,
        history: list[dict[str, str]] | None = None,
    ) -> AsyncGenerator[str, None]:
        """
        Generate a streaming text response from the LLM.
        """
        if False:
            yield ""

    @abstractmethod
    async def generate_json(
        self,
        prompt: str,
        schema: dict[str, Any],
        system_prompt: str | None = None,
    ) -> dict[str, Any]:
        """
        Generate a structured JSON response matching the given schema.
        """
        pass
