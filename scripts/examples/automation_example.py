"""
Browser Automation Example

This example demonstrates how to use BrowserAutomation for complex workflows.
"""

import asyncio

from scripts.automation.browser_automation import BrowserAutomation
from scripts.core.logger import get_logger

logger = get_logger(__name__)


async def main():
    """Main example function."""

    # Example: Automated form filling
    workflow = [
        {
            "action": "navigate",
            "url": "https://example.com/login",
            "wait_until": "load",
        },
        {
            "action": "fill",
            "selector": "#username",
            "value": "testuser",
        },
        {
            "action": "fill",
            "selector": "#password",
            "value": "testpass",
        },
        {
            "action": "click",
            "selector": "#submit",
        },
        {
            "action": "wait",
            "selector": "#dashboard",
            "state": "visible",
        },
        {
            "action": "screenshot",
            "filename": "dashboard.png",
            "full_page": True,
        },
    ]

    async with BrowserAutomation(headless=True) as browser:
        results = await browser.execute_workflow(workflow)

        successful = [r for r in results if r.success]
        logger.info(f"Workflow: {len(successful)}/{len(results)} steps successful")

        for result in results:
            if result.success:
                logger.info(f"✓ {result.action}")
            else:
                logger.error(f"✗ {result.action}: {result.error}")


if __name__ == "__main__":
    asyncio.run(main())
