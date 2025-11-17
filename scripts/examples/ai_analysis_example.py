"""
AI Analysis Example

This example demonstrates how to use AI for code analysis.
"""

import asyncio
import os

from scripts.ai.anthropic_client import AnthropicClient
from scripts.ai.code_analyzer import CodeAnalyzer
from scripts.core.logger import get_logger

logger = get_logger(__name__)


async def main():
    """Main example function."""

    # Get API key from environment
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        logger.error("ANTHROPIC_API_KEY environment variable not set")
        return

    # Initialize AI client
    client = AnthropicClient(api_key=api_key)
    analyzer = CodeAnalyzer(client)

    # Example code to analyze
    code = """
def calculate_fibonacci(n):
    if n <= 1:
        return n
    else:
        return calculate_fibonacci(n-1) + calculate_fibonacci(n-2)
    """

    # Review code
    logger.info("Reviewing code...")
    result = await analyzer.review_code(code, language="python")
    logger.info(f"\nCode Review:\n{result.analysis}")

    # Explain code
    logger.info("\nExplaining code...")
    explanation = await analyzer.explain_code(code, language="python")
    logger.info(f"\nCode Explanation:\n{explanation}")

    # Optimize code
    logger.info("\nOptimizing code...")
    optimization = await analyzer.optimize_code(code, language="python")
    logger.info(f"\nOptimization Suggestions:\n{optimization}")


if __name__ == "__main__":
    asyncio.run(main())
