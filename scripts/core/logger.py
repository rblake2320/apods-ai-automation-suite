"""
Logging Setup - Centralized logging configuration.

This module provides a comprehensive logging setup with support for
console and file output, rotation, and structured logging.
"""

import logging
import sys
from logging.handlers import RotatingFileHandler
from pathlib import Path
from typing import Optional

from scripts.core.constants import LogLevel


class ColoredFormatter(logging.Formatter):
    """Custom formatter with colored output for console logging."""

    # ANSI color codes
    COLORS = {
        "DEBUG": "\033[36m",  # Cyan
        "INFO": "\033[32m",  # Green
        "WARNING": "\033[33m",  # Yellow
        "ERROR": "\033[31m",  # Red
        "CRITICAL": "\033[35m",  # Magenta
        "RESET": "\033[0m",  # Reset
    }

    def format(self, record: logging.LogRecord) -> str:
        """
        Format log record with colors.

        Args:
            record: Log record to format

        Returns:
            Formatted log message with colors
        """
        # Save original levelname
        original_levelname = record.levelname

        # Add color to levelname
        if record.levelname in self.COLORS:
            record.levelname = (
                f"{self.COLORS[record.levelname]}{record.levelname}"
                f"{self.COLORS['RESET']}"
            )

        # Format the record
        result = super().format(record)

        # Restore original levelname
        record.levelname = original_levelname

        return result


class StructuredFormatter(logging.Formatter):
    """Formatter for structured logging with additional context."""

    def format(self, record: logging.LogRecord) -> str:
        """
        Format log record with structured data.

        Args:
            record: Log record to format

        Returns:
            Formatted log message
        """
        # Add custom attributes if they exist
        extra_data = {}
        for key, value in record.__dict__.items():
            if key not in [
                "name",
                "msg",
                "args",
                "created",
                "filename",
                "funcName",
                "levelname",
                "levelno",
                "lineno",
                "module",
                "msecs",
                "message",
                "pathname",
                "process",
                "processName",
                "relativeCreated",
                "thread",
                "threadName",
                "exc_info",
                "exc_text",
                "stack_info",
            ]:
                extra_data[key] = value

        # Format base message
        formatted = super().format(record)

        # Append extra data if present
        if extra_data:
            extra_str = " | ".join(f"{k}={v}" for k, v in extra_data.items())
            formatted = f"{formatted} | {extra_str}"

        return formatted


def setup_logger(
    name: str = "apods",
    level: LogLevel | str = LogLevel.INFO,
    log_format: Optional[str] = None,
    file_path: Optional[str | Path] = None,
    console_enabled: bool = True,
    file_enabled: bool = True,
    max_bytes: int = 10485760,  # 10 MB
    backup_count: int = 5,
    colored: bool = True,
) -> logging.Logger:
    """
    Set up logger with console and file handlers.

    Args:
        name: Logger name
        level: Logging level
        log_format: Log message format string
        file_path: Path to log file
        console_enabled: Enable console logging
        file_enabled: Enable file logging
        max_bytes: Maximum log file size before rotation
        backup_count: Number of backup files to keep
        colored: Use colored output for console

    Returns:
        Configured logger instance
    """
    # Create logger
    logger = logging.getLogger(name)
    logger.setLevel(level.value if isinstance(level, LogLevel) else level)

    # Remove existing handlers
    logger.handlers.clear()

    # Default format
    if log_format is None:
        log_format = (
            "%(asctime)s - %(name)s - %(levelname)s - "
            "%(filename)s:%(lineno)d - %(message)s"
        )

    # Console handler
    if console_enabled:
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(level.value if isinstance(level, LogLevel) else level)

        if colored and sys.stdout.isatty():
            console_formatter = ColoredFormatter(log_format, datefmt="%Y-%m-%d %H:%M:%S")
        else:
            console_formatter = StructuredFormatter(log_format, datefmt="%Y-%m-%d %H:%M:%S")

        console_handler.setFormatter(console_formatter)
        logger.addHandler(console_handler)

    # File handler
    if file_enabled and file_path:
        file_path = Path(file_path)
        file_path.parent.mkdir(parents=True, exist_ok=True)

        file_handler = RotatingFileHandler(
            file_path,
            maxBytes=max_bytes,
            backupCount=backup_count,
            encoding="utf-8",
        )
        file_handler.setLevel(level.value if isinstance(level, LogLevel) else level)

        file_formatter = StructuredFormatter(log_format, datefmt="%Y-%m-%d %H:%M:%S")
        file_handler.setFormatter(file_formatter)
        logger.addHandler(file_handler)

    # Prevent propagation to root logger
    logger.propagate = False

    return logger


def get_logger(name: str) -> logging.Logger:
    """
    Get or create a logger instance.

    Args:
        name: Logger name

    Returns:
        Logger instance
    """
    logger = logging.getLogger(name)

    # If logger has no handlers, set it up with defaults
    if not logger.handlers:
        return setup_logger(name)

    return logger


class LoggerAdapter(logging.LoggerAdapter):
    """Custom logger adapter for adding contextual information."""

    def process(
        self, msg: str, kwargs: dict
    ) -> tuple[str, dict]:
        """
        Process log message and add extra context.

        Args:
            msg: Log message
            kwargs: Additional keyword arguments

        Returns:
            Tuple of (message, kwargs) with added context
        """
        # Add extra context from adapter
        extra = kwargs.get("extra", {})
        extra.update(self.extra)
        kwargs["extra"] = extra

        return msg, kwargs


def get_contextualized_logger(name: str, **context) -> LoggerAdapter:
    """
    Get a logger with additional context.

    Args:
        name: Logger name
        **context: Additional context to include in log messages

    Returns:
        LoggerAdapter with context

    Example:
        >>> logger = get_contextualized_logger("myapp", user_id="123", request_id="abc")
        >>> logger.info("Processing request")
        # Output: ... | user_id=123 | request_id=abc
    """
    base_logger = get_logger(name)
    return LoggerAdapter(base_logger, context)


# Configure root logger
def configure_root_logger(
    level: LogLevel | str = LogLevel.WARNING,
) -> None:
    """
    Configure the root logger to prevent unwanted output from third-party libraries.

    Args:
        level: Logging level for root logger
    """
    root = logging.getLogger()
    root.setLevel(level.value if isinstance(level, LogLevel) else level)

    # Remove all handlers from root logger
    for handler in root.handlers[:]:
        root.removeHandler(handler)


# Set up default logger when module is imported
_default_logger = setup_logger(
    name="apods",
    level=LogLevel.INFO,
    file_path="logs/apods.log",
    console_enabled=True,
    file_enabled=True,
)

# Configure root logger to reduce noise
configure_root_logger(LogLevel.WARNING)
