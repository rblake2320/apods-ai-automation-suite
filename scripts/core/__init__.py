"""
Core Module - Essential components for the automation suite.

This module provides core functionality including configuration management,
logging, custom exceptions, and constants.
"""

from scripts.core.config import Config, load_config
from scripts.core.logger import setup_logger, get_logger
from scripts.core.exceptions import (
    APODSError,
    ConfigurationError,
    ValidationError,
    NetworkError,
    AuthenticationError,
    DataProcessingError,
    FileOperationError,
    AIServiceError,
)
from scripts.core.constants import (
    LogLevel,
    Environment,
    HTTPMethod,
    FileFormat,
    TaskStatus,
)

__all__ = [
    "Config",
    "load_config",
    "setup_logger",
    "get_logger",
    "APODSError",
    "ConfigurationError",
    "ValidationError",
    "NetworkError",
    "AuthenticationError",
    "DataProcessingError",
    "FileOperationError",
    "AIServiceError",
    "LogLevel",
    "Environment",
    "HTTPMethod",
    "FileFormat",
    "TaskStatus",
]
