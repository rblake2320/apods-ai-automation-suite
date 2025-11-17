"""
Data Validation - Data validation utilities.

This module provides comprehensive data validation functionality including
email, URL, phone number validation, and custom validation rules.
"""

import re
from typing import Any, Callable, Optional

from pydantic import ValidationError as PydanticValidationError
from pydantic import validate_email as pydantic_validate_email

from scripts.core.constants import EMAIL_REGEX, PHONE_REGEX, URL_REGEX
from scripts.core.exceptions import ValidationError
from scripts.core.logger import get_logger

logger = get_logger(__name__)


class DataValidator:
    """
    Comprehensive data validator.

    Features:
    - Email validation
    - URL validation
    - Phone number validation
    - Custom regex validation
    - Range validation
    - Length validation
    - Type validation
    - Custom validator functions
    """

    def __init__(self) -> None:
        """Initialize data validator."""
        self.validators: dict[str, Callable[[Any], bool]] = {
            "email": self.is_valid_email,
            "url": self.is_valid_url,
            "phone": self.is_valid_phone,
            "numeric": self.is_numeric,
            "alphanumeric": self.is_alphanumeric,
        }

    def validate(
        self,
        value: Any,
        rule: str,
        **kwargs: Any,
    ) -> bool:
        """
        Validate value against a rule.

        Args:
            value: Value to validate
            rule: Validation rule name
            **kwargs: Additional arguments for validator

        Returns:
            True if valid, False otherwise
        """
        if rule in self.validators:
            return self.validators[rule](value, **kwargs)

        logger.warning(f"Unknown validation rule: {rule}")
        return True

    @staticmethod
    def is_valid_email(email: str) -> bool:
        """
        Validate email address.

        Args:
            email: Email address to validate

        Returns:
            True if valid email, False otherwise
        """
        if not isinstance(email, str):
            return False

        # Use Pydantic's email validation
        try:
            pydantic_validate_email(email)
            return True
        except (PydanticValidationError, ValueError):
            # Fallback to regex
            return bool(re.match(EMAIL_REGEX, email, re.IGNORECASE))

    @staticmethod
    def is_valid_url(url: str) -> bool:
        """
        Validate URL.

        Args:
            url: URL to validate

        Returns:
            True if valid URL, False otherwise
        """
        if not isinstance(url, str):
            return False

        return bool(re.match(URL_REGEX, url, re.IGNORECASE))

    @staticmethod
    def is_valid_phone(phone: str) -> bool:
        """
        Validate phone number.

        Args:
            phone: Phone number to validate

        Returns:
            True if valid phone number, False otherwise
        """
        if not isinstance(phone, str):
            return False

        # Remove common separators
        cleaned = re.sub(r"[\s\-\(\)\.]", "", phone)

        return bool(re.match(PHONE_REGEX, cleaned))

    @staticmethod
    def is_numeric(value: Any) -> bool:
        """
        Check if value is numeric.

        Args:
            value: Value to check

        Returns:
            True if numeric, False otherwise
        """
        try:
            float(value)
            return True
        except (ValueError, TypeError):
            return False

    @staticmethod
    def is_alphanumeric(value: str) -> bool:
        """
        Check if value is alphanumeric.

        Args:
            value: Value to check

        Returns:
            True if alphanumeric, False otherwise
        """
        if not isinstance(value, str):
            return False

        return value.isalnum()

    @staticmethod
    def matches_regex(value: str, pattern: str) -> bool:
        """
        Check if value matches regex pattern.

        Args:
            value: Value to check
            pattern: Regex pattern

        Returns:
            True if matches, False otherwise
        """
        if not isinstance(value, str):
            return False

        try:
            return bool(re.match(pattern, value))
        except re.error:
            logger.error(f"Invalid regex pattern: {pattern}")
            return False

    @staticmethod
    def is_in_range(value: float, min_value: float, max_value: float) -> bool:
        """
        Check if value is in range.

        Args:
            value: Value to check
            min_value: Minimum value (inclusive)
            max_value: Maximum value (inclusive)

        Returns:
            True if in range, False otherwise
        """
        try:
            num_value = float(value)
            return min_value <= num_value <= max_value
        except (ValueError, TypeError):
            return False

    @staticmethod
    def has_min_length(value: str, min_length: int) -> bool:
        """
        Check if value has minimum length.

        Args:
            value: Value to check
            min_length: Minimum length

        Returns:
            True if has minimum length, False otherwise
        """
        if not isinstance(value, str):
            return False

        return len(value) >= min_length

    @staticmethod
    def has_max_length(value: str, max_length: int) -> bool:
        """
        Check if value has maximum length.

        Args:
            value: Value to check
            max_length: Maximum length

        Returns:
            True if within maximum length, False otherwise
        """
        if not isinstance(value, str):
            return False

        return len(value) <= max_length

    @staticmethod
    def is_required(value: Any) -> bool:
        """
        Check if value is not None or empty.

        Args:
            value: Value to check

        Returns:
            True if not None/empty, False otherwise
        """
        if value is None:
            return False

        if isinstance(value, str):
            return len(value.strip()) > 0

        if isinstance(value, (list, dict, tuple, set)):
            return len(value) > 0

        return True

    def add_validator(self, name: str, validator_func: Callable[[Any], bool]) -> None:
        """
        Add custom validator function.

        Args:
            name: Validator name
            validator_func: Validator function that takes a value and returns bool
        """
        self.validators[name] = validator_func
        logger.info(f"Added custom validator: {name}")

    def validate_dict(
        self,
        data: dict[str, Any],
        schema: dict[str, dict[str, Any]],
    ) -> tuple[bool, list[str]]:
        """
        Validate dictionary against schema.

        Args:
            data: Data to validate
            schema: Validation schema

        Returns:
            Tuple of (is_valid, list of errors)

        Example:
            schema = {
                'email': {'required': True, 'type': 'email'},
                'age': {'required': True, 'min': 0, 'max': 120},
                'name': {'required': True, 'min_length': 2},
            }
        """
        errors = []

        for field, rules in schema.items():
            value = data.get(field)

            # Check required
            if rules.get("required", False):
                if not self.is_required(value):
                    errors.append(f"{field} is required")
                    continue

            # Skip other validations if value is None and not required
            if value is None:
                continue

            # Type validation
            if field_type := rules.get("type"):
                if not self.validate(value, field_type):
                    errors.append(f"{field} has invalid {field_type} format")

            # Regex validation
            if pattern := rules.get("regex"):
                if not self.matches_regex(str(value), pattern):
                    errors.append(f"{field} does not match pattern")

            # Range validation
            if "min" in rules or "max" in rules:
                min_val = rules.get("min", float("-inf"))
                max_val = rules.get("max", float("inf"))
                if not self.is_in_range(value, min_val, max_val):
                    errors.append(f"{field} is out of range ({min_val}-{max_val})")

            # Length validation
            if min_length := rules.get("min_length"):
                if not self.has_min_length(str(value), min_length):
                    errors.append(f"{field} is too short (min {min_length})")

            if max_length := rules.get("max_length"):
                if not self.has_max_length(str(value), max_length):
                    errors.append(f"{field} is too long (max {max_length})")

            # Custom validator
            if custom := rules.get("validator"):
                if callable(custom) and not custom(value):
                    errors.append(f"{field} failed custom validation")

        is_valid = len(errors) == 0

        if not is_valid:
            logger.warning(f"Validation failed with {len(errors)} errors")

        return is_valid, errors


# Convenience functions
def validate_email(email: str) -> bool:
    """Validate email address."""
    return DataValidator.is_valid_email(email)


def validate_url(url: str) -> bool:
    """Validate URL."""
    return DataValidator.is_valid_url(url)


def validate_phone(phone: str) -> bool:
    """Validate phone number."""
    return DataValidator.is_valid_phone(phone)
