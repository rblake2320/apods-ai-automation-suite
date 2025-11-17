"""
Async HTTP Client - Async HTTP client with retry logic and rate limiting.

This module provides a comprehensive async HTTP client with support for
retries, rate limiting, and various authentication methods.
"""

import asyncio
from typing import Any, Optional

import aiohttp
from aiohttp import ClientSession, ClientTimeout

from scripts.core.constants import DEFAULT_TIMEOUT, DEFAULT_USER_AGENT, MAX_RETRIES
from scripts.core.exceptions import NetworkError, RateLimitError
from scripts.core.logger import get_logger

logger = get_logger(__name__)


class AsyncHTTPClient:
    """
    Async HTTP client with advanced features.

    Features:
    - Automatic retries with exponential backoff
    - Rate limiting
    - Connection pooling
    - Custom headers and user agent
    - Timeout configuration
    - SSL verification control
    """

    def __init__(
        self,
        user_agent: Optional[str] = None,
        timeout: int = DEFAULT_TIMEOUT,
        max_retries: int = MAX_RETRIES,
        backoff_factor: float = 2.0,
        verify_ssl: bool = True,
        max_connections: int = 100,
    ) -> None:
        """
        Initialize HTTP client.

        Args:
            user_agent: Custom user agent string
            timeout: Request timeout in seconds
            max_retries: Maximum retry attempts
            backoff_factor: Backoff multiplier for retries
            verify_ssl: Verify SSL certificates
            max_connections: Maximum concurrent connections
        """
        self.user_agent = user_agent or DEFAULT_USER_AGENT
        self.timeout = timeout
        self.max_retries = max_retries
        self.backoff_factor = backoff_factor
        self.verify_ssl = verify_ssl
        self.max_connections = max_connections

        self._session: Optional[ClientSession] = None
        self._rate_limit_lock = asyncio.Lock()
        self._last_request_time = 0.0
        self._min_request_interval = 0.0

    async def _get_session(self) -> ClientSession:
        """Get or create aiohttp session."""
        if self._session is None or self._session.closed:
            connector = aiohttp.TCPConnector(
                limit=self.max_connections,
                ssl=self.verify_ssl,
            )

            timeout = ClientTimeout(total=self.timeout)

            self._session = aiohttp.ClientSession(
                connector=connector,
                timeout=timeout,
                headers={"User-Agent": self.user_agent},
            )

        return self._session

    async def request(
        self,
        method: str,
        url: str,
        headers: Optional[dict[str, str]] = None,
        params: Optional[dict[str, Any]] = None,
        json: Optional[dict[str, Any]] = None,
        data: Optional[dict[str, Any]] = None,
        timeout: Optional[int] = None,
        **kwargs: Any,
    ) -> aiohttp.ClientResponse:
        """
        Make an HTTP request with retry logic.

        Args:
            method: HTTP method
            url: Request URL
            headers: Optional headers
            params: Optional query parameters
            json: Optional JSON data
            data: Optional form data
            timeout: Optional timeout override
            **kwargs: Additional arguments for aiohttp

        Returns:
            ClientResponse object

        Raises:
            NetworkError: If request fails after retries
        """
        session = await self._get_session()

        # Apply rate limiting
        await self._apply_rate_limit()

        # Merge headers
        request_headers = dict(session.headers)
        if headers:
            request_headers.update(headers)

        # Override timeout if provided
        request_timeout = ClientTimeout(total=timeout or self.timeout)

        last_exception = None

        for attempt in range(self.max_retries + 1):
            try:
                logger.debug(f"{method} {url} (attempt {attempt + 1})")

                response = await session.request(
                    method=method,
                    url=url,
                    headers=request_headers,
                    params=params,
                    json=json,
                    data=data,
                    timeout=request_timeout,
                    **kwargs,
                )

                # Check for rate limit
                if response.status == 429:
                    retry_after = int(response.headers.get("Retry-After", 60))
                    logger.warning(f"Rate limited. Waiting {retry_after}s")

                    if attempt < self.max_retries:
                        await asyncio.sleep(retry_after)
                        continue
                    else:
                        raise RateLimitError(
                            "Rate limit exceeded",
                            retry_after=retry_after,
                            url=url,
                        )

                # Success or client error (don't retry)
                if response.status < 500:
                    logger.debug(f"Response: {response.status} {url}")
                    return response

                # Server error - retry
                logger.warning(
                    f"Server error {response.status} for {url}, "
                    f"attempt {attempt + 1}/{self.max_retries + 1}"
                )

                if attempt < self.max_retries:
                    await asyncio.sleep(self.backoff_factor ** attempt)
                    continue

                return response

            except asyncio.TimeoutError as e:
                last_exception = e
                logger.warning(
                    f"Request timeout for {url}, "
                    f"attempt {attempt + 1}/{self.max_retries + 1}"
                )

                if attempt < self.max_retries:
                    await asyncio.sleep(self.backoff_factor ** attempt)
                    continue

            except aiohttp.ClientError as e:
                last_exception = e
                logger.warning(
                    f"Request failed for {url}: {e}, "
                    f"attempt {attempt + 1}/{self.max_retries + 1}"
                )

                if attempt < self.max_retries:
                    await asyncio.sleep(self.backoff_factor ** attempt)
                    continue

        # All retries exhausted
        raise NetworkError(
            f"Request failed after {self.max_retries + 1} attempts",
            url=url,
            method=method,
            original_error=last_exception,
        )

    async def get(self, url: str, **kwargs: Any) -> aiohttp.ClientResponse:
        """Make a GET request."""
        return await self.request("GET", url, **kwargs)

    async def post(self, url: str, **kwargs: Any) -> aiohttp.ClientResponse:
        """Make a POST request."""
        return await self.request("POST", url, **kwargs)

    async def put(self, url: str, **kwargs: Any) -> aiohttp.ClientResponse:
        """Make a PUT request."""
        return await self.request("PUT", url, **kwargs)

    async def patch(self, url: str, **kwargs: Any) -> aiohttp.ClientResponse:
        """Make a PATCH request."""
        return await self.request("PATCH", url, **kwargs)

    async def delete(self, url: str, **kwargs: Any) -> aiohttp.ClientResponse:
        """Make a DELETE request."""
        return await self.request("DELETE", url, **kwargs)

    async def head(self, url: str, **kwargs: Any) -> aiohttp.ClientResponse:
        """Make a HEAD request."""
        return await self.request("HEAD", url, **kwargs)

    def set_rate_limit(self, requests_per_second: float) -> None:
        """
        Set rate limit for requests.

        Args:
            requests_per_second: Maximum requests per second
        """
        self._min_request_interval = 1.0 / requests_per_second
        logger.info(f"Rate limit set to {requests_per_second} req/s")

    async def _apply_rate_limit(self) -> None:
        """Apply rate limiting delay."""
        if self._min_request_interval <= 0:
            return

        async with self._rate_limit_lock:
            now = asyncio.get_event_loop().time()
            time_since_last = now - self._last_request_time

            if time_since_last < self._min_request_interval:
                delay = self._min_request_interval - time_since_last
                await asyncio.sleep(delay)

            self._last_request_time = asyncio.get_event_loop().time()

    async def close(self) -> None:
        """Close the HTTP session."""
        if self._session and not self._session.closed:
            await self._session.close()
            logger.debug("HTTP session closed")

    async def __aenter__(self) -> "AsyncHTTPClient":
        """Async context manager entry."""
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
        """Async context manager exit."""
        await self.close()
