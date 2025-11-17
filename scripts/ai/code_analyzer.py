"""
Code Analyzer - AI-powered code analysis.

This module provides code analysis capabilities using Claude AI including
code review, bug detection, and optimization suggestions.
"""

from dataclasses import dataclass
from pathlib import Path
from typing import Any, Optional

from scripts.ai.anthropic_client import AnthropicClient
from scripts.ai.prompt_templates import PromptTemplates
from scripts.core.logger import get_logger

logger = get_logger(__name__)


@dataclass
class AnalysisResult:
    """Result of code analysis."""

    code: str
    language: str
    analysis: str
    suggestions: list[str]
    issues: list[str]
    score: Optional[float] = None


class CodeAnalyzer:
    """AI-powered code analyzer."""

    def __init__(self, ai_client: AnthropicClient) -> None:
        """Initialize code analyzer."""
        self.ai_client = ai_client

    async def review_code(self, code: str, language: str = "python") -> AnalysisResult:
        """Review code and provide feedback."""
        logger.info(f"Reviewing {language} code")

        prompt = PromptTemplates.CODE_REVIEW.render(code=code, language=language)
        response = await self.ai_client.generate_async(prompt)

        return AnalysisResult(
            code=code,
            language=language,
            analysis=response.content,
            suggestions=[],
            issues=[],
        )

    async def explain_code(self, code: str, language: str = "python") -> str:
        """Explain what code does."""
        logger.info(f"Explaining {language} code")

        prompt = PromptTemplates.CODE_EXPLAIN.render(code=code, language=language)
        response = await self.ai_client.generate_async(prompt)

        return response.content

    async def optimize_code(self, code: str, language: str = "python") -> str:
        """Suggest code optimizations."""
        logger.info(f"Optimizing {language} code")

        prompt = PromptTemplates.CODE_OPTIMIZE.render(code=code, language=language)
        response = await self.ai_client.generate_async(prompt)

        return response.content

    async def analyze_bug(self, code: str, error: str, language: str = "python") -> str:
        """Analyze bug and suggest fixes."""
        logger.info("Analyzing bug")

        prompt = PromptTemplates.BUG_ANALYSIS.render(
            code=code, error=error, language=language
        )
        response = await self.ai_client.generate_async(prompt)

        return response.content
