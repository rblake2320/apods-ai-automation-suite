"""
Automation Module - Web scraping, browser automation, and task scheduling.

This module provides comprehensive automation capabilities including web scraping,
browser automation, API testing, data processing, and task scheduling.
"""

from scripts.automation.web_scraper import WebScraper, ScrapingResult
from scripts.automation.browser_automation import BrowserAutomation, BrowserAction
from scripts.automation.api_tester import APITester, APITestResult
from scripts.automation.data_processor import DataProcessor, ProcessingResult
from scripts.automation.file_processor import FileProcessor, FileOperation
from scripts.automation.task_scheduler import TaskScheduler, Task

__all__ = [
    "WebScraper",
    "ScrapingResult",
    "BrowserAutomation",
    "BrowserAction",
    "APITester",
    "APITestResult",
    "DataProcessor",
    "ProcessingResult",
    "FileProcessor",
    "FileOperation",
    "TaskScheduler",
    "Task",
]
