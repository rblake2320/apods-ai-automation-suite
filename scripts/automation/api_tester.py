"""
API Tester - Comprehensive API testing and validation.

This module provides API testing capabilities with support for various HTTP methods,
authentication, request/response validation, and performance metrics.
"""

import json
import time
from dataclasses import dataclass, field
from typing import Any, Callable, Optional

from pydantic import BaseModel, Field

from scripts.core.constants import HTTPMethod
from scripts.core.exceptions import NetworkError, ValidationError
from scripts.core.logger import get_logger
from scripts.utils.http_client import AsyncHTTPClient
from scripts.utils.validation import DataValidator

logger = get_logger(__name__)


@dataclass
class APITestResult:
    """Result of an API test."""

    name: str
    method: str
    url: str
    status_code: int
    success: bool
    response_data: Any = None
    response_headers: dict[str, str] = field(default_factory=dict)
    response_time_ms: float = 0.0
    error: Optional[str] = None
    validation_errors: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        """Convert result to dictionary."""
        return {
            "name": self.name,
            "method": self.method,
            "url": self.url,
            "status_code": self.status_code,
            "success": self.success,
            "response_data": self.response_data,
            "response_headers": self.response_headers,
            "response_time_ms": self.response_time_ms,
            "error": self.error,
            "validation_errors": self.validation_errors,
        }


class APITestCase(BaseModel):
    """API test case configuration."""

    name: str = Field(..., description="Test case name")
    method: HTTPMethod = Field(default=HTTPMethod.GET, description="HTTP method")
    url: str = Field(..., description="API endpoint URL")
    headers: dict[str, str] = Field(default_factory=dict, description="Request headers")
    params: dict[str, Any] = Field(default_factory=dict, description="Query parameters")
    json_body: Optional[dict[str, Any]] = Field(None, description="JSON request body")
    data: Optional[dict[str, Any]] = Field(None, description="Form data")
    expected_status: int = Field(default=200, description="Expected status code")
    expected_schema: Optional[dict[str, Any]] = Field(None, description="Expected response schema")
    timeout: int = Field(default=30, description="Request timeout in seconds")


class APITester:
    """
    Comprehensive API testing framework.

    Features:
    - Support for all HTTP methods
    - Request/response validation
    - Schema validation
    - Authentication support
    - Performance metrics
    - Batch testing
    - Custom validators
    """

    def __init__(
        self,
        base_url: Optional[str] = None,
        default_headers: Optional[dict[str, str]] = None,
        timeout: int = 30,
        verify_ssl: bool = True,
    ) -> None:
        """
        Initialize API tester.

        Args:
            base_url: Base URL for API endpoints
            default_headers: Default headers for all requests
            timeout: Default timeout in seconds
            verify_ssl: Verify SSL certificates
        """
        self.base_url = base_url or ""
        self.default_headers = default_headers or {}
        self.timeout = timeout
        self.verify_ssl = verify_ssl

        self.http_client = AsyncHTTPClient(
            timeout=timeout,
            verify_ssl=verify_ssl,
        )
        self.validator = DataValidator()

    def set_auth_token(self, token: str, token_type: str = "Bearer") -> None:
        """
        Set authentication token.

        Args:
            token: Authentication token
            token_type: Token type (Bearer, Basic, etc.)
        """
        self.default_headers["Authorization"] = f"{token_type} {token}"
        logger.info(f"Authentication token set ({token_type})")

    def set_api_key(self, key: str, header_name: str = "X-API-Key") -> None:
        """
        Set API key.

        Args:
            key: API key
            header_name: Header name for API key
        """
        self.default_headers[header_name] = key
        logger.info(f"API key set in header {header_name}")

    async def test(self, test_case: APITestCase) -> APITestResult:
        """
        Execute a single API test case.

        Args:
            test_case: Test case configuration

        Returns:
            APITestResult with test outcome
        """
        start_time = time.time()

        # Build full URL
        url = self._build_url(test_case.url)

        # Merge headers
        headers = {**self.default_headers, **test_case.headers}

        logger.info(f"Testing API: {test_case.method.value} {url} - {test_case.name}")

        try:
            # Make request
            response = await self.http_client.request(
                method=test_case.method.value,
                url=url,
                headers=headers,
                params=test_case.params,
                json=test_case.json_body,
                data=test_case.data,
                timeout=test_case.timeout,
            )

            response_time_ms = (time.time() - start_time) * 1000

            # Parse response
            try:
                if response.content_type and "application/json" in response.content_type:
                    response_data = await response.json()
                else:
                    response_data = await response.text()
            except Exception:
                response_data = await response.text()

            # Validate status code
            status_valid = response.status == test_case.expected_status
            validation_errors = []

            if not status_valid:
                validation_errors.append(
                    f"Expected status {test_case.expected_status}, got {response.status}"
                )

            # Validate schema if provided
            if test_case.expected_schema and isinstance(response_data, dict):
                schema_errors = self._validate_schema(response_data, test_case.expected_schema)
                validation_errors.extend(schema_errors)

            success = status_valid and len(validation_errors) == 0

            result = APITestResult(
                name=test_case.name,
                method=test_case.method.value,
                url=url,
                status_code=response.status,
                success=success,
                response_data=response_data,
                response_headers=dict(response.headers),
                response_time_ms=response_time_ms,
                validation_errors=validation_errors,
            )

            if success:
                logger.info(
                    f"✓ Test passed: {test_case.name} ({response_time_ms:.2f}ms)"
                )
            else:
                logger.warning(
                    f"✗ Test failed: {test_case.name} - {', '.join(validation_errors)}"
                )

            return result

        except Exception as e:
            response_time_ms = (time.time() - start_time) * 1000
            logger.error(f"✗ Test error: {test_case.name} - {e}", exc_info=True)

            return APITestResult(
                name=test_case.name,
                method=test_case.method.value,
                url=url,
                status_code=0,
                success=False,
                response_time_ms=response_time_ms,
                error=str(e),
            )

    async def test_multiple(self, test_cases: list[APITestCase]) -> list[APITestResult]:
        """
        Execute multiple test cases.

        Args:
            test_cases: List of test cases

        Returns:
            List of APITestResult objects
        """
        logger.info(f"Running {len(test_cases)} API tests")

        results = []
        for test_case in test_cases:
            result = await self.test(test_case)
            results.append(result)

        passed = sum(1 for r in results if r.success)
        failed = len(results) - passed

        logger.info(f"Tests completed: {passed} passed, {failed} failed")

        return results

    async def test_endpoint_methods(
        self, endpoint: str, methods: list[HTTPMethod]
    ) -> list[APITestResult]:
        """
        Test an endpoint with multiple HTTP methods.

        Args:
            endpoint: API endpoint
            methods: List of HTTP methods to test

        Returns:
            List of APITestResult objects
        """
        test_cases = [
            APITestCase(
                name=f"{method.value} {endpoint}",
                method=method,
                url=endpoint,
            )
            for method in methods
        ]

        return await self.test_multiple(test_cases)

    async def load_test(
        self,
        test_case: APITestCase,
        requests_per_second: int = 10,
        duration_seconds: int = 10,
    ) -> dict[str, Any]:
        """
        Perform load testing on an endpoint.

        Args:
            test_case: Test case configuration
            requests_per_second: Target requests per second
            duration_seconds: Test duration in seconds

        Returns:
            Load test statistics
        """
        import asyncio

        logger.info(
            f"Starting load test: {requests_per_second} req/s for {duration_seconds}s"
        )

        results = []
        start_time = time.time()
        end_time = start_time + duration_seconds

        async def make_request():
            result = await self.test(test_case)
            results.append(result)

        while time.time() < end_time:
            batch_start = time.time()

            # Create batch of requests
            tasks = [make_request() for _ in range(requests_per_second)]
            await asyncio.gather(*tasks, return_exceptions=True)

            # Sleep to maintain rate
            elapsed = time.time() - batch_start
            if elapsed < 1.0:
                await asyncio.sleep(1.0 - elapsed)

        # Calculate statistics
        successful = [r for r in results if r.success]
        failed = [r for r in results if not r.success]

        response_times = [r.response_time_ms for r in successful]

        stats = {
            "total_requests": len(results),
            "successful": len(successful),
            "failed": len(failed),
            "success_rate": len(successful) / len(results) * 100 if results else 0,
            "avg_response_time_ms": sum(response_times) / len(response_times)
            if response_times
            else 0,
            "min_response_time_ms": min(response_times) if response_times else 0,
            "max_response_time_ms": max(response_times) if response_times else 0,
            "duration_seconds": time.time() - start_time,
        }

        logger.info(
            f"Load test completed: {stats['successful']}/{stats['total_requests']} "
            f"successful ({stats['success_rate']:.1f}%), "
            f"avg response time: {stats['avg_response_time_ms']:.2f}ms"
        )

        return stats

    def _build_url(self, endpoint: str) -> str:
        """Build full URL from base URL and endpoint."""
        if endpoint.startswith("http://") or endpoint.startswith("https://"):
            return endpoint

        base = self.base_url.rstrip("/")
        endpoint = endpoint.lstrip("/")
        return f"{base}/{endpoint}" if base else endpoint

    def _validate_schema(
        self, data: dict[str, Any], schema: dict[str, Any]
    ) -> list[str]:
        """
        Validate response data against schema.

        Args:
            data: Response data
            schema: Expected schema

        Returns:
            List of validation errors
        """
        errors = []

        for key, expected_type in schema.items():
            if key not in data:
                errors.append(f"Missing field: {key}")
            elif not isinstance(data[key], expected_type):
                errors.append(
                    f"Invalid type for {key}: expected {expected_type.__name__}, "
                    f"got {type(data[key]).__name__}"
                )

        return errors

    async def close(self) -> None:
        """Close HTTP client."""
        await self.http_client.close()

    async def __aenter__(self) -> "APITester":
        """Async context manager entry."""
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
        """Async context manager exit."""
        await self.close()
