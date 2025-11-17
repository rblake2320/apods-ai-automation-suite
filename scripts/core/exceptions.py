"""
Custom Exceptions - Application-specific exception classes.

This module defines custom exception hierarchy for better error handling
and debugging throughout the application.
"""

from typing import Any, Optional


class APODSError(Exception):
    """Base exception class for all APODS-related errors."""

    def __init__(
        self,
        message: str,
        details: Optional[dict[str, Any]] = None,
        original_error: Optional[Exception] = None,
    ) -> None:
        """
        Initialize the base exception.

        Args:
            message: Human-readable error message
            details: Additional context about the error
            original_error: Original exception if this is a wrapped error
        """
        self.message = message
        self.details = details or {}
        self.original_error = original_error
        super().__init__(self.message)

    def __str__(self) -> str:
        """Return a formatted error message."""
        error_str = self.message
        if self.details:
            details_str = ", ".join(f"{k}={v}" for k, v in self.details.items())
            error_str = f"{error_str} ({details_str})"
        if self.original_error:
            error_str = f"{error_str} - Caused by: {str(self.original_error)}"
        return error_str


class ConfigurationError(APODSError):
    """Exception raised for configuration-related errors."""

    def __init__(
        self,
        message: str = "Configuration error occurred",
        config_key: Optional[str] = None,
        **kwargs: Any,
    ) -> None:
        """
        Initialize configuration error.

        Args:
            message: Error message
            config_key: Configuration key that caused the error
            **kwargs: Additional arguments passed to base class
        """
        details = kwargs.pop("details", {})
        if config_key:
            details["config_key"] = config_key
        super().__init__(message, details=details, **kwargs)


class ValidationError(APODSError):
    """Exception raised for data validation errors."""

    def __init__(
        self,
        message: str = "Validation error occurred",
        field: Optional[str] = None,
        value: Any = None,
        rule: Optional[str] = None,
        **kwargs: Any,
    ) -> None:
        """
        Initialize validation error.

        Args:
            message: Error message
            field: Field name that failed validation
            value: Value that failed validation
            rule: Validation rule that was violated
            **kwargs: Additional arguments passed to base class
        """
        details = kwargs.pop("details", {})
        if field:
            details["field"] = field
        if value is not None:
            details["value"] = value
        if rule:
            details["rule"] = rule
        super().__init__(message, details=details, **kwargs)


class NetworkError(APODSError):
    """Exception raised for network-related errors."""

    def __init__(
        self,
        message: str = "Network error occurred",
        url: Optional[str] = None,
        status_code: Optional[int] = None,
        method: Optional[str] = None,
        **kwargs: Any,
    ) -> None:
        """
        Initialize network error.

        Args:
            message: Error message
            url: URL that caused the error
            status_code: HTTP status code if available
            method: HTTP method used
            **kwargs: Additional arguments passed to base class
        """
        details = kwargs.pop("details", {})
        if url:
            details["url"] = url
        if status_code:
            details["status_code"] = status_code
        if method:
            details["method"] = method
        super().__init__(message, details=details, **kwargs)


class AuthenticationError(APODSError):
    """Exception raised for authentication and authorization errors."""

    def __init__(
        self,
        message: str = "Authentication error occurred",
        service: Optional[str] = None,
        username: Optional[str] = None,
        **kwargs: Any,
    ) -> None:
        """
        Initialize authentication error.

        Args:
            message: Error message
            service: Service name where authentication failed
            username: Username used for authentication (if applicable)
            **kwargs: Additional arguments passed to base class
        """
        details = kwargs.pop("details", {})
        if service:
            details["service"] = service
        if username:
            details["username"] = username
        super().__init__(message, details=details, **kwargs)


class DataProcessingError(APODSError):
    """Exception raised for data processing errors."""

    def __init__(
        self,
        message: str = "Data processing error occurred",
        operation: Optional[str] = None,
        record_count: Optional[int] = None,
        **kwargs: Any,
    ) -> None:
        """
        Initialize data processing error.

        Args:
            message: Error message
            operation: Processing operation that failed
            record_count: Number of records being processed
            **kwargs: Additional arguments passed to base class
        """
        details = kwargs.pop("details", {})
        if operation:
            details["operation"] = operation
        if record_count is not None:
            details["record_count"] = record_count
        super().__init__(message, details=details, **kwargs)


class FileOperationError(APODSError):
    """Exception raised for file operation errors."""

    def __init__(
        self,
        message: str = "File operation error occurred",
        file_path: Optional[str] = None,
        operation: Optional[str] = None,
        **kwargs: Any,
    ) -> None:
        """
        Initialize file operation error.

        Args:
            message: Error message
            file_path: Path to the file that caused the error
            operation: File operation that failed (read, write, delete, etc.)
            **kwargs: Additional arguments passed to base class
        """
        details = kwargs.pop("details", {})
        if file_path:
            details["file_path"] = file_path
        if operation:
            details["operation"] = operation
        super().__init__(message, details=details, **kwargs)


class AIServiceError(APODSError):
    """Exception raised for AI service errors."""

    def __init__(
        self,
        message: str = "AI service error occurred",
        model: Optional[str] = None,
        error_code: Optional[str] = None,
        **kwargs: Any,
    ) -> None:
        """
        Initialize AI service error.

        Args:
            message: Error message
            model: AI model being used
            error_code: Error code from the AI service
            **kwargs: Additional arguments passed to base class
        """
        details = kwargs.pop("details", {})
        if model:
            details["model"] = model
        if error_code:
            details["error_code"] = error_code
        super().__init__(message, details=details, **kwargs)


class DatabaseError(APODSError):
    """Exception raised for database operation errors."""

    def __init__(
        self,
        message: str = "Database error occurred",
        operation: Optional[str] = None,
        table: Optional[str] = None,
        **kwargs: Any,
    ) -> None:
        """
        Initialize database error.

        Args:
            message: Error message
            operation: Database operation that failed
            table: Database table involved
            **kwargs: Additional arguments passed to base class
        """
        details = kwargs.pop("details", {})
        if operation:
            details["operation"] = operation
        if table:
            details["table"] = table
        super().__init__(message, details=details, **kwargs)


class TaskExecutionError(APODSError):
    """Exception raised for task execution errors."""

    def __init__(
        self,
        message: str = "Task execution error occurred",
        task_name: Optional[str] = None,
        task_id: Optional[str] = None,
        **kwargs: Any,
    ) -> None:
        """
        Initialize task execution error.

        Args:
            message: Error message
            task_name: Name of the task that failed
            task_id: Unique identifier of the task
            **kwargs: Additional arguments passed to base class
        """
        details = kwargs.pop("details", {})
        if task_name:
            details["task_name"] = task_name
        if task_id:
            details["task_id"] = task_id
        super().__init__(message, details=details, **kwargs)


class BrowserAutomationError(APODSError):
    """Exception raised for browser automation errors."""

    def __init__(
        self,
        message: str = "Browser automation error occurred",
        browser: Optional[str] = None,
        action: Optional[str] = None,
        selector: Optional[str] = None,
        **kwargs: Any,
    ) -> None:
        """
        Initialize browser automation error.

        Args:
            message: Error message
            browser: Browser type being used
            action: Browser action that failed
            selector: Element selector if applicable
            **kwargs: Additional arguments passed to base class
        """
        details = kwargs.pop("details", {})
        if browser:
            details["browser"] = browser
        if action:
            details["action"] = action
        if selector:
            details["selector"] = selector
        super().__init__(message, details=details, **kwargs)


class RateLimitError(NetworkError):
    """Exception raised when rate limits are exceeded."""

    def __init__(
        self,
        message: str = "Rate limit exceeded",
        retry_after: Optional[int] = None,
        **kwargs: Any,
    ) -> None:
        """
        Initialize rate limit error.

        Args:
            message: Error message
            retry_after: Seconds to wait before retrying
            **kwargs: Additional arguments passed to base class
        """
        details = kwargs.pop("details", {})
        if retry_after:
            details["retry_after"] = retry_after
        super().__init__(message, details=details, **kwargs)


class TimeoutError(NetworkError):
    """Exception raised when operations time out."""

    def __init__(
        self,
        message: str = "Operation timed out",
        timeout_seconds: Optional[float] = None,
        **kwargs: Any,
    ) -> None:
        """
        Initialize timeout error.

        Args:
            message: Error message
            timeout_seconds: Timeout duration in seconds
            **kwargs: Additional arguments passed to base class
        """
        details = kwargs.pop("details", {})
        if timeout_seconds:
            details["timeout_seconds"] = timeout_seconds
        super().__init__(message, details=details, **kwargs)
