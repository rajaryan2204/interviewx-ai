import logging
import struct
from abc import ABC, abstractmethod

import httpx

from app.core.config import settings

logger = logging.getLogger("app.core.ai.providers.tts")


class BaseTTSProvider(ABC):
    """
    Abstract Base Class for Text-to-Speech synthesis providers.
    """

    @abstractmethod
    async def synthesize(self, text: str) -> bytes:
        """
        Synthesize text to audio bytes (returns audio stream).
        """
        pass


class OpenAITTSProvider(BaseTTSProvider):
    """
    TTS adapter utilizing OpenAI's text-to-speech API.
    """

    async def synthesize(self, text: str) -> bytes:
        if not settings.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY is not configured.")

        headers = {
            "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": "tts-1",
            "input": text,
            "voice": "alloy",
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                "https://api.openai.com/v1/audio/speech",
                headers=headers,
                json=payload,
            )
            if resp.status_code != 200:
                logger.error(f"OpenAI TTS synthesis failed: {resp.text}")
                raise ValueError(f"OpenAI TTS failed: {resp.text}")

            return resp.content


class ElevenLabsTTSProvider(BaseTTSProvider):
    """
    TTS adapter utilizing ElevenLabs voice synthesis API.
    """

    async def synthesize(self, text: str) -> bytes:
        if not settings.ELEVENLABS_API_KEY:
            raise ValueError("ELEVENLABS_API_KEY is not configured.")

        headers = {
            "xi-api-key": settings.ELEVENLABS_API_KEY,
            "Content-Type": "application/json",
        }
        payload = {
            "text": text,
            "model_id": "eleven_monolingual_v1",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.75,
            },
        }
        voice_id = settings.ELEVENLABS_VOICE_ID

        url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            if resp.status_code != 200:
                logger.error(f"ElevenLabs TTS synthesis failed: {resp.text}")
                raise ValueError(f"ElevenLabs TTS failed: {resp.text}")

            return resp.content


class MockTTSProvider(BaseTTSProvider):
    """
    Mock TTS provider returning a programmatically generated silent PCM WAV stream.
    Allows testing full voice streams locally without hitting external APIs.
    """

    async def synthesize(self, text: str) -> bytes:
        # Generate 0.5 seconds of silence at 8kHz, 8-bit mono
        sample_rate = 8000
        duration = 0.5
        num_samples = int(sample_rate * duration)

        # WAV header fields
        chunk_id = b"RIFF"
        format_field = b"WAVE"
        sub_chunk_1_id = b"fmt "
        sub_chunk_1_size = 16
        audio_format = 1  # PCM
        num_channels = 1  # Mono
        bits_per_sample = 8
        byte_rate = sample_rate * num_channels * (bits_per_sample // 8)
        block_align = num_channels * (bits_per_sample // 8)

        sub_chunk_2_id = b"data"
        sub_chunk_2_size = num_samples * block_align
        chunk_size = 36 + sub_chunk_2_size

        # Build header bytes
        header = struct.pack(
            "<4sI4s4sIHHIIHH4sI",
            chunk_id,
            chunk_size,
            format_field,
            sub_chunk_1_id,
            sub_chunk_1_size,
            audio_format,
            num_channels,
            sample_rate,
            byte_rate,
            block_align,
            bits_per_sample,
            sub_chunk_2_id,
            sub_chunk_2_size,
        )

        # Silence value for 8-bit PCM is 128 (0x80)
        data = bytes([128] * sub_chunk_2_size)
        return header + data
