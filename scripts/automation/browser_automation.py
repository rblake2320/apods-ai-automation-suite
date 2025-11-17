"""
Browser Automation - Playwright automation for complex workflows.

This module provides advanced browser automation capabilities using Playwright
for handling dynamic content, forms, authentication, and complex user interactions.
"""

import asyncio
from dataclasses import dataclass
from enum import Enum
from pathlib import Path
from typing import Any, Callable, Optional

from playwright.async_api import (
    Browser,
    BrowserContext,
    Page,
    Playwright,
    async_playwright,
)

from scripts.core.constants import BrowserType
from scripts.core.exceptions import BrowserAutomationError
from scripts.core.logger import get_logger

logger = get_logger(__name__)


class BrowserAction(str, Enum):
    """Browser action types."""

    CLICK = "click"
    FILL = "fill"
    SELECT = "select"
    NAVIGATE = "navigate"
    WAIT = "wait"
    SCREENSHOT = "screenshot"
    SCROLL = "scroll"
    HOVER = "hover"
    PRESS = "press"
    EVALUATE = "evaluate"


@dataclass
class ActionResult:
    """Result of a browser action."""

    action: BrowserAction
    success: bool
    data: Any = None
    error: Optional[str] = None
    screenshot_path: Optional[str] = None


class BrowserAutomation:
    """
    Comprehensive browser automation with Playwright.

    Features:
    - Multiple browser support (Chromium, Firefox, WebKit)
    - Headless and headed modes
    - Screenshot and video recording
    - Cookie and local storage management
    - Network interception
    - Form filling and submission
    - Authentication handling
    - Wait strategies
    """

    def __init__(
        self,
        browser_type: BrowserType = BrowserType.CHROMIUM,
        headless: bool = True,
        viewport_width: int = 1920,
        viewport_height: int = 1080,
        timeout: int = 30000,
        screenshot_dir: Optional[str | Path] = None,
        user_agent: Optional[str] = None,
    ) -> None:
        """
        Initialize browser automation.

        Args:
            browser_type: Browser type to use
            headless: Run browser in headless mode
            viewport_width: Viewport width
            viewport_height: Viewport height
            timeout: Default timeout in milliseconds
            screenshot_dir: Directory for screenshots
            user_agent: Custom user agent
        """
        self.browser_type = browser_type
        self.headless = headless
        self.viewport_width = viewport_width
        self.viewport_height = viewport_height
        self.timeout = timeout
        self.screenshot_dir = Path(screenshot_dir) if screenshot_dir else Path("screenshots")
        self.user_agent = user_agent

        self._playwright: Optional[Playwright] = None
        self._browser: Optional[Browser] = None
        self._context: Optional[BrowserContext] = None
        self._page: Optional[Page] = None

        # Create screenshot directory
        self.screenshot_dir.mkdir(parents=True, exist_ok=True)

    async def start(self) -> None:
        """Start the browser."""
        try:
            logger.info(f"Starting {self.browser_type.value} browser (headless={self.headless})")

            self._playwright = await async_playwright().start()

            # Launch browser
            if self.browser_type == BrowserType.CHROMIUM:
                self._browser = await self._playwright.chromium.launch(headless=self.headless)
            elif self.browser_type == BrowserType.FIREFOX:
                self._browser = await self._playwright.firefox.launch(headless=self.headless)
            elif self.browser_type == BrowserType.WEBKIT:
                self._browser = await self._playwright.webkit.launch(headless=self.headless)
            else:
                raise BrowserAutomationError(f"Unsupported browser type: {self.browser_type}")

            # Create context
            context_options = {
                "viewport": {"width": self.viewport_width, "height": self.viewport_height},
            }
            if self.user_agent:
                context_options["user_agent"] = self.user_agent

            self._context = await self._browser.new_context(**context_options)
            self._context.set_default_timeout(self.timeout)

            # Create page
            self._page = await self._context.new_page()

            logger.info("Browser started successfully")

        except Exception as e:
            logger.error(f"Failed to start browser: {e}", exc_info=True)
            raise BrowserAutomationError(
                "Failed to start browser",
                browser=self.browser_type.value,
                original_error=e,
            ) from e

    async def stop(self) -> None:
        """Stop the browser and clean up resources."""
        try:
            logger.info("Stopping browser")

            if self._page:
                await self._page.close()
            if self._context:
                await self._context.close()
            if self._browser:
                await self._browser.close()
            if self._playwright:
                await self._playwright.stop()

            logger.info("Browser stopped successfully")

        except Exception as e:
            logger.error(f"Error stopping browser: {e}", exc_info=True)

    async def navigate(self, url: str, wait_until: str = "load") -> ActionResult:
        """
        Navigate to a URL.

        Args:
            url: URL to navigate to
            wait_until: When to consider navigation complete
                       (load, domcontentloaded, networkidle)

        Returns:
            ActionResult with navigation status
        """
        try:
            logger.info(f"Navigating to {url}")
            await self._ensure_page()

            await self._page.goto(url, wait_until=wait_until)

            return ActionResult(
                action=BrowserAction.NAVIGATE,
                success=True,
                data={"url": url, "title": await self._page.title()},
            )

        except Exception as e:
            logger.error(f"Navigation failed: {e}", exc_info=True)
            return ActionResult(
                action=BrowserAction.NAVIGATE,
                success=False,
                error=str(e),
            )

    async def click(self, selector: str, timeout: Optional[int] = None) -> ActionResult:
        """
        Click an element.

        Args:
            selector: CSS selector for element
            timeout: Optional timeout override

        Returns:
            ActionResult with click status
        """
        try:
            logger.debug(f"Clicking element: {selector}")
            await self._ensure_page()

            kwargs = {"timeout": timeout} if timeout else {}
            await self._page.click(selector, **kwargs)

            return ActionResult(
                action=BrowserAction.CLICK,
                success=True,
                data={"selector": selector},
            )

        except Exception as e:
            logger.error(f"Click failed on {selector}: {e}", exc_info=True)
            return ActionResult(
                action=BrowserAction.CLICK,
                success=False,
                error=str(e),
                selector=selector,
            )

    async def fill(self, selector: str, value: str, timeout: Optional[int] = None) -> ActionResult:
        """
        Fill an input field.

        Args:
            selector: CSS selector for input
            value: Value to fill
            timeout: Optional timeout override

        Returns:
            ActionResult with fill status
        """
        try:
            logger.debug(f"Filling field {selector} with value")
            await self._ensure_page()

            kwargs = {"timeout": timeout} if timeout else {}
            await self._page.fill(selector, value, **kwargs)

            return ActionResult(
                action=BrowserAction.FILL,
                success=True,
                data={"selector": selector},
            )

        except Exception as e:
            logger.error(f"Fill failed on {selector}: {e}", exc_info=True)
            return ActionResult(
                action=BrowserAction.FILL,
                success=False,
                error=str(e),
            )

    async def select_option(
        self, selector: str, value: str, timeout: Optional[int] = None
    ) -> ActionResult:
        """
        Select an option from a dropdown.

        Args:
            selector: CSS selector for select element
            value: Value to select
            timeout: Optional timeout override

        Returns:
            ActionResult with select status
        """
        try:
            logger.debug(f"Selecting option {value} in {selector}")
            await self._ensure_page()

            kwargs = {"timeout": timeout} if timeout else {}
            await self._page.select_option(selector, value, **kwargs)

            return ActionResult(
                action=BrowserAction.SELECT,
                success=True,
                data={"selector": selector, "value": value},
            )

        except Exception as e:
            logger.error(f"Select failed on {selector}: {e}", exc_info=True)
            return ActionResult(
                action=BrowserAction.SELECT,
                success=False,
                error=str(e),
            )

    async def wait_for_selector(
        self, selector: str, state: str = "visible", timeout: Optional[int] = None
    ) -> ActionResult:
        """
        Wait for an element to reach a specific state.

        Args:
            selector: CSS selector for element
            state: State to wait for (attached, detached, visible, hidden)
            timeout: Optional timeout override

        Returns:
            ActionResult with wait status
        """
        try:
            logger.debug(f"Waiting for {selector} to be {state}")
            await self._ensure_page()

            kwargs = {"state": state}
            if timeout:
                kwargs["timeout"] = timeout

            await self._page.wait_for_selector(selector, **kwargs)

            return ActionResult(
                action=BrowserAction.WAIT,
                success=True,
                data={"selector": selector, "state": state},
            )

        except Exception as e:
            logger.error(f"Wait failed for {selector}: {e}", exc_info=True)
            return ActionResult(
                action=BrowserAction.WAIT,
                success=False,
                error=str(e),
            )

    async def screenshot(
        self, filename: Optional[str] = None, full_page: bool = False
    ) -> ActionResult:
        """
        Take a screenshot.

        Args:
            filename: Optional filename (auto-generated if not provided)
            full_page: Capture full page

        Returns:
            ActionResult with screenshot path
        """
        try:
            await self._ensure_page()

            if not filename:
                from datetime import datetime
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                filename = f"screenshot_{timestamp}.png"

            screenshot_path = self.screenshot_dir / filename

            await self._page.screenshot(path=str(screenshot_path), full_page=full_page)

            logger.info(f"Screenshot saved to {screenshot_path}")

            return ActionResult(
                action=BrowserAction.SCREENSHOT,
                success=True,
                data={"path": str(screenshot_path)},
                screenshot_path=str(screenshot_path),
            )

        except Exception as e:
            logger.error(f"Screenshot failed: {e}", exc_info=True)
            return ActionResult(
                action=BrowserAction.SCREENSHOT,
                success=False,
                error=str(e),
            )

    async def evaluate(self, script: str) -> ActionResult:
        """
        Evaluate JavaScript in the page context.

        Args:
            script: JavaScript code to evaluate

        Returns:
            ActionResult with evaluation result
        """
        try:
            logger.debug(f"Evaluating JavaScript")
            await self._ensure_page()

            result = await self._page.evaluate(script)

            return ActionResult(
                action=BrowserAction.EVALUATE,
                success=True,
                data={"result": result},
            )

        except Exception as e:
            logger.error(f"JavaScript evaluation failed: {e}", exc_info=True)
            return ActionResult(
                action=BrowserAction.EVALUATE,
                success=False,
                error=str(e),
            )

    async def get_content(self) -> str:
        """
        Get page HTML content.

        Returns:
            HTML content as string
        """
        await self._ensure_page()
        return await self._page.content()

    async def get_text(self, selector: str) -> Optional[str]:
        """
        Get text content of an element.

        Args:
            selector: CSS selector for element

        Returns:
            Text content or None if element not found
        """
        try:
            await self._ensure_page()
            element = await self._page.query_selector(selector)
            if element:
                return await element.text_content()
            return None
        except Exception as e:
            logger.error(f"Failed to get text for {selector}: {e}")
            return None

    async def execute_workflow(
        self, workflow: list[dict[str, Any]]
    ) -> list[ActionResult]:
        """
        Execute a workflow of browser actions.

        Args:
            workflow: List of action dictionaries with 'action' and parameters

        Returns:
            List of ActionResult objects

        Example:
            workflow = [
                {"action": "navigate", "url": "https://example.com"},
                {"action": "fill", "selector": "#username", "value": "user"},
                {"action": "fill", "selector": "#password", "value": "pass"},
                {"action": "click", "selector": "#submit"},
                {"action": "screenshot", "filename": "result.png"},
            ]
        """
        results = []

        for step in workflow:
            action = step.get("action")

            if action == "navigate":
                result = await self.navigate(step["url"], step.get("wait_until", "load"))
            elif action == "click":
                result = await self.click(step["selector"], step.get("timeout"))
            elif action == "fill":
                result = await self.fill(step["selector"], step["value"], step.get("timeout"))
            elif action == "select":
                result = await self.select_option(
                    step["selector"], step["value"], step.get("timeout")
                )
            elif action == "wait":
                result = await self.wait_for_selector(
                    step["selector"], step.get("state", "visible"), step.get("timeout")
                )
            elif action == "screenshot":
                result = await self.screenshot(
                    step.get("filename"), step.get("full_page", False)
                )
            elif action == "evaluate":
                result = await self.evaluate(step["script"])
            else:
                result = ActionResult(
                    action=BrowserAction.EVALUATE,
                    success=False,
                    error=f"Unknown action: {action}",
                )

            results.append(result)

            # Stop workflow if action failed and stop_on_error is True
            if not result.success and step.get("stop_on_error", False):
                logger.warning(f"Workflow stopped due to error in step: {action}")
                break

            # Optional delay between actions
            if delay := step.get("delay"):
                await asyncio.sleep(delay)

        successful = sum(1 for r in results if r.success)
        logger.info(f"Workflow completed: {successful}/{len(results)} actions successful")

        return results

    async def _ensure_page(self) -> None:
        """Ensure page is available."""
        if not self._page:
            raise BrowserAutomationError(
                "Browser not started. Call start() first.",
                action="ensure_page",
            )

    async def __aenter__(self) -> "BrowserAutomation":
        """Async context manager entry."""
        await self.start()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
        """Async context manager exit."""
        await self.stop()
