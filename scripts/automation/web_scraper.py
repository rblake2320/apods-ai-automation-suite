"""
Web Scraper - Comprehensive web scraping with BeautifulSoup.

This module provides advanced web scraping capabilities with support for
pagination, data extraction, robots.txt compliance, and rate limiting.
"""

import asyncio
import random
import time
from dataclasses import dataclass, field
from typing import Any, Callable, Optional
from urllib.parse import urljoin, urlparse
from urllib.robotparser import RobotFileParser

import aiohttp
from bs4 import BeautifulSoup, Tag
from pydantic import BaseModel, HttpUrl

from scripts.core.exceptions import NetworkError, ValidationError
from scripts.core.logger import get_logger
from scripts.utils.http_client import AsyncHTTPClient

logger = get_logger(__name__)


@dataclass
class ScrapingResult:
    """Result of a web scraping operation."""

    url: str
    status_code: int
    data: dict[str, Any] = field(default_factory=dict)
    links: list[str] = field(default_factory=list)
    images: list[str] = field(default_factory=list)
    metadata: dict[str, Any] = field(default_factory=dict)
    error: Optional[str] = None
    duration_seconds: float = 0.0

    @property
    def success(self) -> bool:
        """Check if scraping was successful."""
        return self.error is None and 200 <= self.status_code < 300


class SelectorConfig(BaseModel):
    """Configuration for CSS selectors."""

    title: Optional[str] = "h1"
    description: Optional[str] = "meta[name='description']"
    content: Optional[str] = "article, main, .content"
    links: Optional[str] = "a[href]"
    images: Optional[str] = "img[src]"


class WebScraper:
    """
    Comprehensive web scraper with BeautifulSoup.

    Features:
    - Async/await support for concurrent scraping
    - Robots.txt compliance
    - Rate limiting and delays
    - Custom CSS selectors
    - Data extraction and transformation
    - Pagination handling
    - Error recovery
    """

    def __init__(
        self,
        user_agent: Optional[str] = None,
        respect_robots_txt: bool = True,
        delay_min: float = 1.0,
        delay_max: float = 3.0,
        max_retries: int = 3,
        timeout: int = 30,
    ) -> None:
        """
        Initialize the web scraper.

        Args:
            user_agent: Custom user agent string
            respect_robots_txt: Whether to respect robots.txt
            delay_min: Minimum delay between requests (seconds)
            delay_max: Maximum delay between requests (seconds)
            max_retries: Maximum retry attempts
            timeout: Request timeout in seconds
        """
        self.http_client = AsyncHTTPClient(
            user_agent=user_agent,
            timeout=timeout,
            max_retries=max_retries,
        )
        self.respect_robots_txt = respect_robots_txt
        self.delay_min = delay_min
        self.delay_max = delay_max
        self._robot_parsers: dict[str, RobotFileParser] = {}
        self._last_request_time: dict[str, float] = {}

    async def scrape(
        self,
        url: str,
        selectors: Optional[SelectorConfig] = None,
        extract_links: bool = True,
        extract_images: bool = True,
        custom_extractor: Optional[Callable[[BeautifulSoup], dict[str, Any]]] = None,
    ) -> ScrapingResult:
        """
        Scrape a single URL.

        Args:
            url: URL to scrape
            selectors: CSS selectors for data extraction
            extract_links: Whether to extract links
            extract_images: Whether to extract images
            custom_extractor: Custom function to extract data from soup

        Returns:
            ScrapingResult with extracted data

        Raises:
            NetworkError: If request fails
        """
        start_time = time.time()
        result = ScrapingResult(url=url, status_code=0)

        try:
            # Check robots.txt
            if self.respect_robots_txt and not await self._can_fetch(url):
                result.error = "Blocked by robots.txt"
                logger.warning(f"Scraping blocked by robots.txt: {url}")
                return result

            # Apply rate limiting
            await self._apply_rate_limit(url)

            # Fetch content
            logger.info(f"Scraping URL: {url}")
            response = await self.http_client.get(url)
            result.status_code = response.status

            if response.status != 200:
                result.error = f"HTTP {response.status}"
                return result

            html = await response.text()

            # Parse HTML
            soup = BeautifulSoup(html, "html.parser")

            # Extract data using selectors
            if selectors:
                result.data = self._extract_with_selectors(soup, selectors)

            # Use custom extractor if provided
            if custom_extractor:
                custom_data = custom_extractor(soup)
                result.data.update(custom_data)

            # Extract links
            if extract_links:
                result.links = self._extract_links(soup, url)

            # Extract images
            if extract_images:
                result.images = self._extract_images(soup, url)

            # Extract metadata
            result.metadata = self._extract_metadata(soup)

            logger.info(
                f"Successfully scraped {url}: "
                f"{len(result.links)} links, {len(result.images)} images"
            )

        except Exception as e:
            result.error = str(e)
            logger.error(f"Error scraping {url}: {e}", exc_info=True)
            raise NetworkError(
                f"Failed to scrape {url}",
                url=url,
                original_error=e,
            ) from e

        finally:
            result.duration_seconds = time.time() - start_time

        return result

    async def scrape_multiple(
        self,
        urls: list[str],
        max_concurrent: int = 5,
        **scrape_kwargs: Any,
    ) -> list[ScrapingResult]:
        """
        Scrape multiple URLs concurrently.

        Args:
            urls: List of URLs to scrape
            max_concurrent: Maximum concurrent requests
            **scrape_kwargs: Additional arguments for scrape()

        Returns:
            List of ScrapingResult objects
        """
        semaphore = asyncio.Semaphore(max_concurrent)

        async def scrape_with_semaphore(url: str) -> ScrapingResult:
            async with semaphore:
                return await self.scrape(url, **scrape_kwargs)

        logger.info(f"Scraping {len(urls)} URLs with max {max_concurrent} concurrent")

        tasks = [scrape_with_semaphore(url) for url in urls]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Convert exceptions to error results
        final_results = []
        for url, result in zip(urls, results):
            if isinstance(result, Exception):
                final_results.append(
                    ScrapingResult(url=url, status_code=0, error=str(result))
                )
            else:
                final_results.append(result)

        successful = sum(1 for r in final_results if r.success)
        logger.info(f"Scraping completed: {successful}/{len(urls)} successful")

        return final_results

    async def scrape_with_pagination(
        self,
        start_url: str,
        next_page_selector: str,
        max_pages: int = 100,
        **scrape_kwargs: Any,
    ) -> list[ScrapingResult]:
        """
        Scrape multiple pages following pagination.

        Args:
            start_url: Starting URL
            next_page_selector: CSS selector for next page link
            max_pages: Maximum pages to scrape
            **scrape_kwargs: Additional arguments for scrape()

        Returns:
            List of ScrapingResult objects
        """
        results = []
        current_url = start_url
        page_count = 0

        logger.info(f"Starting pagination scraping from {start_url}")

        while current_url and page_count < max_pages:
            page_count += 1
            logger.info(f"Scraping page {page_count}: {current_url}")

            result = await self.scrape(current_url, **scrape_kwargs)
            results.append(result)

            if not result.success:
                logger.warning(f"Failed to scrape page {page_count}, stopping pagination")
                break

            # Find next page URL
            try:
                response = await self.http_client.get(current_url)
                html = await response.text()
                soup = BeautifulSoup(html, "html.parser")

                next_link = soup.select_one(next_page_selector)
                if next_link and isinstance(next_link, Tag):
                    href = next_link.get("href")
                    if href:
                        current_url = urljoin(current_url, str(href))
                    else:
                        current_url = None
                else:
                    current_url = None

            except Exception as e:
                logger.error(f"Error finding next page: {e}")
                break

            if not current_url:
                logger.info("No more pages to scrape")
                break

        logger.info(f"Pagination scraping completed: {page_count} pages")
        return results

    def _extract_with_selectors(
        self, soup: BeautifulSoup, selectors: SelectorConfig
    ) -> dict[str, Any]:
        """Extract data using CSS selectors."""
        data = {}

        if selectors.title:
            title_elem = soup.select_one(selectors.title)
            if title_elem:
                data["title"] = title_elem.get_text(strip=True)

        if selectors.description:
            desc_elem = soup.select_one(selectors.description)
            if desc_elem:
                data["description"] = desc_elem.get("content", "").strip()

        if selectors.content:
            content_elem = soup.select_one(selectors.content)
            if content_elem:
                data["content"] = content_elem.get_text(strip=True)

        return data

    def _extract_links(self, soup: BeautifulSoup, base_url: str) -> list[str]:
        """Extract all links from the page."""
        links = []
        for link in soup.find_all("a", href=True):
            href = link["href"]
            absolute_url = urljoin(base_url, href)
            links.append(absolute_url)
        return list(set(links))  # Remove duplicates

    def _extract_images(self, soup: BeautifulSoup, base_url: str) -> list[str]:
        """Extract all image URLs from the page."""
        images = []
        for img in soup.find_all("img", src=True):
            src = img["src"]
            absolute_url = urljoin(base_url, src)
            images.append(absolute_url)
        return list(set(images))  # Remove duplicates

    def _extract_metadata(self, soup: BeautifulSoup) -> dict[str, Any]:
        """Extract page metadata."""
        metadata = {}

        # Title
        title = soup.find("title")
        if title:
            metadata["page_title"] = title.get_text(strip=True)

        # Meta tags
        for meta in soup.find_all("meta"):
            name = meta.get("name") or meta.get("property")
            content = meta.get("content")
            if name and content:
                metadata[name] = content

        return metadata

    async def _can_fetch(self, url: str) -> bool:
        """Check if URL can be fetched according to robots.txt."""
        parsed = urlparse(url)
        base_url = f"{parsed.scheme}://{parsed.netloc}"

        if base_url not in self._robot_parsers:
            robots_url = urljoin(base_url, "/robots.txt")
            parser = RobotFileParser()
            parser.set_url(robots_url)

            try:
                response = await self.http_client.get(robots_url)
                if response.status == 200:
                    content = await response.text()
                    parser.parse(content.splitlines())
                else:
                    # If robots.txt doesn't exist, allow all
                    return True
            except Exception:
                # If can't fetch robots.txt, allow all
                return True

            self._robot_parsers[base_url] = parser

        user_agent = self.http_client.user_agent or "*"
        return self._robot_parsers[base_url].can_fetch(user_agent, url)

    async def _apply_rate_limit(self, url: str) -> None:
        """Apply rate limiting delay."""
        parsed = urlparse(url)
        domain = parsed.netloc

        if domain in self._last_request_time:
            elapsed = time.time() - self._last_request_time[domain]
            delay = random.uniform(self.delay_min, self.delay_max)

            if elapsed < delay:
                sleep_time = delay - elapsed
                logger.debug(f"Rate limiting: sleeping {sleep_time:.2f}s for {domain}")
                await asyncio.sleep(sleep_time)

        self._last_request_time[domain] = time.time()

    async def close(self) -> None:
        """Close the HTTP client."""
        await self.http_client.close()

    async def __aenter__(self) -> "WebScraper":
        """Async context manager entry."""
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
        """Async context manager exit."""
        await self.close()
