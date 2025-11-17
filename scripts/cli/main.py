"""
Main CLI - Main command-line interface entry point.
"""

import click

from scripts.cli.commands import analyze, generate, scrape, test
from scripts.core.config import load_config
from scripts.core.logger import setup_logger


@click.group()
@click.option("--config", "-c", type=click.Path(exists=True), help="Config file path")
@click.option("--verbose", "-v", is_flag=True, help="Verbose output")
@click.pass_context
def cli(ctx, config, verbose):
    """APODS AI-Automation Suite CLI."""
    ctx.ensure_object(dict)

    # Load configuration
    if config:
        ctx.obj["config"] = load_config(config)
    else:
        ctx.obj["config"] = load_config()

    # Setup logging
    log_level = "DEBUG" if verbose else "INFO"
    setup_logger(level=log_level)


cli.add_command(scrape.scrape)
cli.add_command(test.test)
cli.add_command(analyze.analyze)
cli.add_command(generate.generate)


if __name__ == "__main__":
    cli()
