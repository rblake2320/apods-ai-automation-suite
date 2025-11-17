"""
Content Generator - AI-powered content generation.

This module provides content generation capabilities using Claude AI.
"""

from dataclasses import dataclass
from typing import Optional

from scripts.ai.anthropic_client import AnthropicClient
from scripts.core.logger import get_logger

logger = get_logger(__name__)


@dataclass
class GenerationResult:
    """Result of content generation."""

    content: str
    tokens_used: int
    metadata: dict


class ContentGenerator:
    """AI-powered content generator."""

    def __init__(self, ai_client: AnthropicClient) -> None:
        """Initialize content generator."""
        self.ai_client = ai_client

    async def generate_text(
        self,
        prompt: str,
        system: Optional[str] = None,
        max_tokens: int = 2000,
    ) -> GenerationResult:
        """Generate text content."""
        logger.info("Generating text content")

        response = await self.ai_client.generate_async(
            prompt=prompt,
            system=system,
            max_tokens=max_tokens,
        )

        return GenerationResult(
            content=response.content,
            tokens_used=response.tokens_used,
            metadata=response.metadata,
        )

    async def summarize(self, text: str, max_length: int = 200) -> str:
        """Summarize text."""
        logger.info(f"Summarizing text (max {max_length} words)")

        prompt = f"Summarize the following text in {max_length} words or less:\n\n{text}"
        response = await self.ai_client.generate_async(prompt)

        return response.content
