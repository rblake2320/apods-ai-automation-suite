"""
Anthropic Client - Claude AI API integration.

This module provides a comprehensive client for interacting with the
Anthropic Claude API including message streaming and token management.
"""

from dataclasses import dataclass
from typing import Any, AsyncIterator, Optional

from anthropic import Anthropic, AsyncAnthropic
from anthropic.types import Message

from scripts.core.constants import DEFAULT_AI_MODEL, MAX_TOKENS, TEMPERATURE
from scripts.core.exceptions import AIServiceError
from scripts.core.logger import get_logger

logger = get_logger(__name__)


@dataclass
class AIResponse:
    """Response from AI model."""

    content: str
    model: str
    tokens_used: int
    stop_reason: str
    metadata: dict[str, Any]

    @property
    def success(self) -> bool:
        """Check if response was successful."""
        return self.stop_reason == "end_turn"


class AnthropicClient:
    """
    Claude AI API client.

    Features:
    - Synchronous and asynchronous message generation
    - Streaming responses
    - Token usage tracking
    - System prompts
    - Temperature and parameter control
    - Error handling and retries
    """

    def __init__(
        self,
        api_key: str,
        model: str = DEFAULT_AI_MODEL,
        max_tokens: int = MAX_TOKENS,
        temperature: float = TEMPERATURE,
    ) -> None:
        """
        Initialize Anthropic client.

        Args:
            api_key: Anthropic API key
            model: Model to use
            max_tokens: Maximum tokens in response
            temperature: Model temperature (0.0-1.0)
        """
        self.api_key = api_key
        self.model = model
        self.max_tokens = max_tokens
        self.temperature = temperature

        self.client = Anthropic(api_key=api_key)
        self.async_client = AsyncAnthropic(api_key=api_key)

    def generate(
        self,
        prompt: str,
        system: Optional[str] = None,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
        **kwargs: Any,
    ) -> AIResponse:
        """
        Generate response from Claude (synchronous).

        Args:
            prompt: User prompt
            system: Optional system prompt
            max_tokens: Optional max tokens override
            temperature: Optional temperature override
            **kwargs: Additional arguments for API

        Returns:
            AIResponse object

        Raises:
            AIServiceError: If generation fails
        """
        try:
            logger.info(f"Generating response with {self.model}")

            params = {
                "model": self.model,
                "max_tokens": max_tokens or self.max_tokens,
                "temperature": temperature or self.temperature,
                "messages": [{"role": "user", "content": prompt}],
                **kwargs,
            }

            if system:
                params["system"] = system

            message = self.client.messages.create(**params)

            response = self._parse_response(message)

            logger.info(
                f"Generated response: {response.tokens_used} tokens, "
                f"stop_reason={response.stop_reason}"
            )

            return response

        except Exception as e:
            logger.error(f"AI generation failed: {e}", exc_info=True)
            raise AIServiceError(
                "Failed to generate AI response",
                model=self.model,
                original_error=e,
            ) from e

    async def generate_async(
        self,
        prompt: str,
        system: Optional[str] = None,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
        **kwargs: Any,
    ) -> AIResponse:
        """
        Generate response from Claude (asynchronous).

        Args:
            prompt: User prompt
            system: Optional system prompt
            max_tokens: Optional max tokens override
            temperature: Optional temperature override
            **kwargs: Additional arguments for API

        Returns:
            AIResponse object

        Raises:
            AIServiceError: If generation fails
        """
        try:
            logger.info(f"Generating async response with {self.model}")

            params = {
                "model": self.model,
                "max_tokens": max_tokens or self.max_tokens,
                "temperature": temperature or self.temperature,
                "messages": [{"role": "user", "content": prompt}],
                **kwargs,
            }

            if system:
                params["system"] = system

            message = await self.async_client.messages.create(**params)

            response = self._parse_response(message)

            logger.info(
                f"Generated async response: {response.tokens_used} tokens"
            )

            return response

        except Exception as e:
            logger.error(f"Async AI generation failed: {e}", exc_info=True)
            raise AIServiceError(
                "Failed to generate AI response",
                model=self.model,
                original_error=e,
            ) from e

    async def generate_stream(
        self,
        prompt: str,
        system: Optional[str] = None,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
        **kwargs: Any,
    ) -> AsyncIterator[str]:
        """
        Generate streaming response from Claude.

        Args:
            prompt: User prompt
            system: Optional system prompt
            max_tokens: Optional max tokens override
            temperature: Optional temperature override
            **kwargs: Additional arguments for API

        Yields:
            Text chunks as they are generated

        Raises:
            AIServiceError: If generation fails
        """
        try:
            logger.info(f"Generating streaming response with {self.model}")

            params = {
                "model": self.model,
                "max_tokens": max_tokens or self.max_tokens,
                "temperature": temperature or self.temperature,
                "messages": [{"role": "user", "content": prompt}],
                **kwargs,
            }

            if system:
                params["system"] = system

            async with self.async_client.messages.stream(**params) as stream:
                async for text in stream.text_stream:
                    yield text

            logger.info("Streaming response completed")

        except Exception as e:
            logger.error(f"Streaming AI generation failed: {e}", exc_info=True)
            raise AIServiceError(
                "Failed to generate streaming AI response",
                model=self.model,
                original_error=e,
            ) from e

    def _parse_response(self, message: Message) -> AIResponse:
        """Parse Anthropic message to AIResponse."""
        content = ""
        for block in message.content:
            if hasattr(block, "text"):
                content += block.text

        return AIResponse(
            content=content,
            model=message.model,
            tokens_used=message.usage.input_tokens + message.usage.output_tokens,
            stop_reason=message.stop_reason,
            metadata={
                "input_tokens": message.usage.input_tokens,
                "output_tokens": message.usage.output_tokens,
                "message_id": message.id,
            },
        )
