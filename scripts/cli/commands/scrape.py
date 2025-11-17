"""Scraping commands."""

import asyncio

import click

from scripts.automation.web_scraper import WebScraper


@click.command()
@click.argument("url")
@click.option("--output", "-o", type=click.Path(), help="Output file")
@click.option("--format", "-f", type=click.Choice(["json", "csv"]), default="json")
def scrape(url, output, format):
    """Scrape a website."""
    click.echo(f"Scraping {url}...")

    async def _scrape():
        async with WebScraper() as scraper:
            result = await scraper.scrape(url)
            if result.success:
                click.echo(f"Success! Extracted {len(result.links)} links")
                if output:
                    import json
                    with open(output, "w") as f:
                        json.dump(result.data, f, indent=2)
                    click.echo(f"Saved to {output}")
            else:
                click.echo(f"Error: {result.error}", err=True)

    asyncio.run(_scrape())
