"""
Constants and Enumerations - Centralized constants for the automation suite.

This module defines all constants, enumerations, and configuration values
used throughout the application.
"""

from enum import Enum, IntEnum
from typing import Final


class LogLevel(str, Enum):
    """Logging levels for the application."""

    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"


class Environment(str, Enum):
    """Application environment types."""

    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"
    TESTING = "testing"


class HTTPMethod(str, Enum):
    """HTTP request methods."""

    GET = "GET"
    POST = "POST"
    PUT = "PUT"
    PATCH = "PATCH"
    DELETE = "DELETE"
    HEAD = "HEAD"
    OPTIONS = "OPTIONS"


class FileFormat(str, Enum):
    """Supported file formats for data processing."""

    JSON = "json"
    CSV = "csv"
    XLSX = "xlsx"
    XML = "xml"
    YAML = "yaml"
    TOML = "toml"
    PARQUET = "parquet"
    HTML = "html"
    TEXT = "txt"
    PDF = "pdf"


class TaskStatus(str, Enum):
    """Status values for scheduled tasks."""

    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    RETRYING = "retrying"


class DataValidationRule(str, Enum):
    """Data validation rule types."""

    REQUIRED = "required"
    EMAIL = "email"
    URL = "url"
    PHONE = "phone"
    DATE = "date"
    NUMERIC = "numeric"
    ALPHANUMERIC = "alphanumeric"
    REGEX = "regex"
    MIN_LENGTH = "min_length"
    MAX_LENGTH = "max_length"
    RANGE = "range"


class BrowserType(str, Enum):
    """Supported browser types for automation."""

    CHROMIUM = "chromium"
    FIREFOX = "firefox"
    WEBKIT = "webkit"


class AIModel(str, Enum):
    """Supported AI models."""

    CLAUDE_3_OPUS = "claude-3-opus-20240229"
    CLAUDE_3_SONNET = "claude-3-sonnet-20240229"
    CLAUDE_3_HAIKU = "claude-3-haiku-20240307"
    CLAUDE_3_5_SONNET = "claude-3-5-sonnet-20241022"
    CLAUDE_SONNET_4_5 = "claude-sonnet-4-5-20250929"


# Application Constants
APP_NAME: Final[str] = "APODS AI-Automation Suite"
APP_VERSION: Final[str] = "1.0.0"
APP_DESCRIPTION: Final[str] = "Comprehensive automation suite with AI capabilities"

# Network Constants
DEFAULT_TIMEOUT: Final[int] = 30
MAX_RETRIES: Final[int] = 3
RETRY_BACKOFF_FACTOR: Final[float] = 2.0
RATE_LIMIT_CALLS: Final[int] = 100
RATE_LIMIT_PERIOD: Final[int] = 60

# File Processing Constants
MAX_FILE_SIZE_MB: Final[int] = 100
CHUNK_SIZE_KB: Final[int] = 8192
TEMP_DIR: Final[str] = "/tmp/apods"

# Database Constants
DB_POOL_SIZE: Final[int] = 5
DB_MAX_OVERFLOW: Final[int] = 10
DB_POOL_TIMEOUT: Final[int] = 30
DB_ECHO: Final[bool] = False

# Scraping Constants
DEFAULT_USER_AGENT: Final[str] = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/120.0.0.0 Safari/537.36"
)
SCRAPING_DELAY_MIN: Final[float] = 1.0
SCRAPING_DELAY_MAX: Final[float] = 3.0

# AI Constants
DEFAULT_AI_MODEL: Final[str] = AIModel.CLAUDE_3_5_SONNET.value
MAX_TOKENS: Final[int] = 4096
TEMPERATURE: Final[float] = 0.7

# Cache Constants
CACHE_TTL: Final[int] = 3600
CACHE_MAX_SIZE: Final[int] = 1000

# Validation Constants
EMAIL_REGEX: Final[str] = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
URL_REGEX: Final[str] = (
    r"^https?://"
    r"(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|"
    r"localhost|"
    r"\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})"
    r"(?::\d+)?"
    r"(?:/?|[/?]\S+)$"
)
PHONE_REGEX: Final[str] = r"^\+?1?\d{9,15}$"

# Error Messages
ERROR_MESSAGES: Final[dict[str, str]] = {
    "config_not_found": "Configuration file not found: {path}",
    "invalid_config": "Invalid configuration format: {error}",
    "network_error": "Network request failed: {error}",
    "authentication_failed": "Authentication failed: {error}",
    "validation_failed": "Data validation failed: {error}",
    "file_not_found": "File not found: {path}",
    "file_operation_failed": "File operation failed: {error}",
    "ai_service_error": "AI service error: {error}",
    "database_error": "Database operation failed: {error}",
    "task_execution_failed": "Task execution failed: {error}",
}

# Success Messages
SUCCESS_MESSAGES: Final[dict[str, str]] = {
    "config_loaded": "Configuration loaded successfully",
    "task_completed": "Task completed successfully",
    "data_processed": "Data processed successfully: {count} records",
    "file_saved": "File saved successfully: {path}",
    "scraping_completed": "Scraping completed: {count} items extracted",
    "test_passed": "All tests passed",
}
