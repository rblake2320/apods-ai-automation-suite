"""Tests for web scraper."""

import pytest

from scripts.automation.web_scraper import WebScraper


@pytest.mark.asyncio
async def test_scraper_initialization():
    """Test scraper initialization."""
    scraper = WebScraper()
    assert scraper is not None
    await scraper.close()


@pytest.mark.asyncio
async def test_scraper_context_manager():
    """Test scraper context manager."""
    async with WebScraper() as scraper:
        assert scraper is not None
