"""Analysis commands."""

import asyncio

import click

from scripts.ai.anthropic_client import AnthropicClient
from scripts.ai.code_analyzer import CodeAnalyzer


@click.command()
@click.argument("file", type=click.Path(exists=True))
@click.option("--language", "-l", default="python")
@click.option("--api-key", envvar="ANTHROPIC_API_KEY", required=True)
def analyze(file, language, api_key):
    """Analyze code file."""
    click.echo(f"Analyzing {file}...")

    with open(file) as f:
        code = f.read()

    async def _analyze():
        client = AnthropicClient(api_key=api_key)
        analyzer = CodeAnalyzer(client)
        result = await analyzer.review_code(code, language)
        click.echo("\n" + result.analysis)

    asyncio.run(_analyze())
