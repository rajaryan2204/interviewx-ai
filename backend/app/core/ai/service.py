import asyncio
import logging
import time
from collections.abc import AsyncGenerator
from typing import Any

from app.core.ai.factory import AIProviderFactory

logger = logging.getLogger("app.ai.service")
logger.setLevel(logging.INFO)

# Global concurrency lock to limit simultaneous calls to AI provider endpoints
_concurrency_semaphore = asyncio.Semaphore(10)


class AIService:
    """
    Central Core AI Service class.
    Orchestrates provider selection, rate limit locks, timeout limits, retry backoffs,
    structured schema validations, and latency logging.
    """

    @staticmethod
    async def generate(
        prompt: str,
        system_prompt: str | None = None,
        history: list[dict[str, str]] | None = None,
        provider: str | None = None,
        retries: int = 3,
        timeout: float = 30.0,
    ) -> str:
        """
        Executes text completion with exponential retry backoffs and timeout checks.
        """
        adapter = AIProviderFactory.get_provider(provider)
        attempt = 0
        start_time = time.time()

        while attempt < retries:
            try:
                # Enforce concurrency rate limiting semaphore
                async with _concurrency_semaphore:
                    # Enforce timeout boundary on the execution call
                    result = await asyncio.wait_for(
                        adapter.generate(prompt, system_prompt, history),
                        timeout=timeout,
                    )
                latency = time.time() - start_time
                logger.info(
                    f"AI generate success. Provider: {adapter.__class__.__name__}, "
                    f"Latency: {latency:.3f}s"
                )
                return result
            except TimeoutError:
                attempt += 1
                logger.warning(
                    f"AI generate timeout (attempt {attempt}/{retries})."
                )
            except Exception as e:
                attempt += 1
                logger.warning(
                    f"AI generate failed (attempt {attempt}/{retries}). Error: {str(e)}"
                )

            if attempt < retries:
                # Exponential backoff: 0.5s, 1s, 2s...
                sleep_time = 0.5 * (2 ** (attempt - 1))
                await asyncio.sleep(sleep_time)

        raise RuntimeError(
            f"AI generate failed after {retries} retry attempts."
        )

    @staticmethod
    async def generate_stream(
        prompt: str,
        system_prompt: str | None = None,
        history: list[dict[str, str]] | None = None,
        provider: str | None = None,
        timeout: float = 30.0,
    ) -> AsyncGenerator[str, None]:
        """
        Stream LLM completions line by line.
        """
        adapter = AIProviderFactory.get_provider(provider)
        start_time = time.time()

        try:
            async with _concurrency_semaphore:
                # Enforce stream initialization timeout
                stream_generator = adapter.generate_stream(
                    prompt, system_prompt, history
                )
                async for chunk in stream_generator:
                    yield chunk

            latency = time.time() - start_time
            logger.info(
                f"AI stream completed. Provider: {adapter.__class__.__name__}, "
                f"Total Stream Time: {latency:.3f}s"
            )
        except Exception as e:
            logger.error(f"AI streaming encountered error: {str(e)}")
            raise

    @staticmethod
    async def generate_json(
        prompt: str,
        schema: dict[str, Any],
        system_prompt: str | None = None,
        provider: str | None = None,
        retries: int = 3,
        timeout: float = 45.0,
    ) -> dict[str, Any]:
        """
        Get structured JSON completion conforming to the Pydantic schema dictionary.
        """
        adapter = AIProviderFactory.get_provider(provider)
        attempt = 0
        start_time = time.time()

        while attempt < retries:
            try:
                async with _concurrency_semaphore:
                    result = await asyncio.wait_for(
                        adapter.generate_json(prompt, schema, system_prompt),
                        timeout=timeout,
                    )
                latency = time.time() - start_time
                logger.info(
                    f"AI generate_json success. Provider: {adapter.__class__.__name__}, "
                    f"Latency: {latency:.3f}s"
                )
                return result
            except TimeoutError:
                attempt += 1
                logger.warning(
                    f"AI generate_json timeout (attempt {attempt}/{retries})."
                )
            except Exception as e:
                attempt += 1
                logger.warning(
                    f"AI generate_json failed (attempt {attempt}/{retries}). Error: {str(e)}"
                )

            if attempt < retries:
                sleep_time = 0.5 * (2 ** (attempt - 1))
                await asyncio.sleep(sleep_time)

        raise RuntimeError(
            f"AI generate_json failed after {retries} retry attempts."
        )
