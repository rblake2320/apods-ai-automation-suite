"""Tests for browser automation."""

import pytest

from scripts.automation.browser_automation import BrowserAutomation


@pytest.mark.asyncio
async def test_browser_initialization():
    """Test browser initialization."""
    browser = BrowserAutomation(headless=True)
    assert browser is not None
