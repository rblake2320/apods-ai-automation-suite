"""Generation commands."""

import asyncio

import click

from scripts.ai.anthropic_client import AnthropicClient
from scripts.ai.content_generator import ContentGenerator


@click.command()
@click.argument("prompt")
@click.option("--api-key", envvar="ANTHROPIC_API_KEY", required=True)
@click.option("--output", "-o", type=click.Path())
def generate(prompt, api_key, output):
    """Generate content using AI."""
    click.echo("Generating content...")

    async def _generate():
        client = AnthropicClient(api_key=api_key)
        generator = ContentGenerator(client)
        result = await generator.generate_text(prompt)

        click.echo("\n" + result.content)

        if output:
            with open(output, "w") as f:
                f.write(result.content)
            click.echo(f"\nSaved to {output}")

    asyncio.run(_generate())
