"""Testing commands."""

import asyncio

import click

from scripts.automation.api_tester import APITestCase, APITester
from scripts.core.constants import HTTPMethod


@click.command()
@click.argument("url")
@click.option("--method", "-m", type=click.Choice(["GET", "POST", "PUT", "DELETE"]), default="GET")
@click.option("--expected-status", "-s", type=int, default=200)
def test(url, method, expected_status):
    """Test an API endpoint."""
    click.echo(f"Testing {method} {url}...")

    async def _test():
        async with APITester() as tester:
            test_case = APITestCase(
                name=f"Test {url}",
                method=HTTPMethod(method),
                url=url,
                expected_status=expected_status,
            )
            result = await tester.test(test_case)
            if result.success:
                click.echo(f"✓ Test passed ({result.response_time_ms:.2f}ms)")
            else:
                click.echo(f"✗ Test failed: {result.error or result.validation_errors}", err=True)

    asyncio.run(_test())
