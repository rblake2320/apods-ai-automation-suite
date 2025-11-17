"""
APODS AI-Automation Suite - Main Package

A comprehensive automation suite for web scraping, browser automation,
API testing, and AI-powered analysis and content generation.

Version: 1.0.0
Author: APODS Team
"""

__version__ = "1.0.0"
__author__ = "APODS Team"
__license__ = "MIT"

from scripts.core import config, logger, exceptions, constants
from scripts.automation import (
    web_scraper,
    browser_automation,
    api_tester,
    data_processor,
    file_processor,
    task_scheduler,
)
from scripts.ai import (
    anthropic_client,
    prompt_templates,
    code_analyzer,
    content_generator,
)
from scripts.utils import (
    http_client,
    file_utils,
    validation,
    crypto_utils,
    date_utils,
)

__all__ = [
    "config",
    "logger",
    "exceptions",
    "constants",
    "web_scraper",
    "browser_automation",
    "api_tester",
    "data_processor",
    "file_processor",
    "task_scheduler",
    "anthropic_client",
    "prompt_templates",
    "code_analyzer",
    "content_generator",
    "http_client",
    "file_utils",
    "validation",
    "crypto_utils",
    "date_utils",
]
