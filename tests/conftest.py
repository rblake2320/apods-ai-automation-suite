"""Pytest configuration and fixtures."""

import pytest

from scripts.core.config import Config


@pytest.fixture
def config():
    """Test configuration."""
    return Config()


@pytest.fixture
def sample_html():
    """Sample HTML for testing."""
    return """
    <html>
        <head><title>Test Page</title></head>
        <body>
            <h1>Test Header</h1>
            <p>Test content</p>
            <a href="/link1">Link 1</a>
            <a href="/link2">Link 2</a>
        </body>
    </html>
    """
