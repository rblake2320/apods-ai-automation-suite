"""
Web Scraping Example

This example demonstrates how to use the WebScraper to scrape websites.
"""

import asyncio

from scripts.automation.web_scraper import WebScraper, SelectorConfig
from scripts.core.logger import get_logger

logger = get_logger(__name__)


async def main():
    """Main example function."""

    # Example 1: Simple scraping
    async with WebScraper() as scraper:
        result = await scraper.scrape("https://example.com")

        if result.success:
            logger.info(f"Scraped {len(result.links)} links")
            logger.info(f"Scraped {len(result.images)} images")
            logger.info(f"Metadata: {result.metadata}")
        else:
            logger.error(f"Scraping failed: {result.error}")

    # Example 2: Custom selectors
    selectors = SelectorConfig(
        title="h1",
        description="meta[name='description']",
        content="article, main",
    )

    async with WebScraper() as scraper:
        result = await scraper.scrape(
            "https://example.com",
            selectors=selectors,
        )

        if result.success:
            logger.info(f"Title: {result.data.get('title')}")
            logger.info(f"Description: {result.data.get('description')}")

    # Example 3: Multiple URLs
    urls = [
        "https://example.com/page1",
        "https://example.com/page2",
        "https://example.com/page3",
    ]

    async with WebScraper() as scraper:
        results = await scraper.scrape_multiple(urls, max_concurrent=3)

        successful = [r for r in results if r.success]
        logger.info(f"Successfully scraped {len(successful)}/{len(urls)} pages")


if __name__ == "__main__":
    asyncio.run(main())
