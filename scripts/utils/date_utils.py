"""
Date Utilities - Date and time manipulation utilities.

This module provides utilities for parsing, formatting, and manipulating
dates and times.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional

from dateutil import parser as date_parser

from scripts.core.exceptions import ValidationError
from scripts.core.logger import get_logger

logger = get_logger(__name__)


def parse_date(
    date_string: str,
    fuzzy: bool = True,
    default: Optional[datetime] = None,
) -> datetime:
    """
    Parse date string to datetime object.

    Args:
        date_string: Date string to parse
        fuzzy: Allow fuzzy parsing
        default: Default datetime for missing components

    Returns:
        Parsed datetime object

    Raises:
        ValidationError: If date string cannot be parsed

    Example:
        >>> parse_date("2024-01-15")
        >>> parse_date("January 15, 2024")
        >>> parse_date("15/01/2024")
    """
    try:
        return date_parser.parse(date_string, fuzzy=fuzzy, default=default)
    except Exception as e:
        logger.error(f"Failed to parse date: {date_string}", exc_info=True)
        raise ValidationError(
            f"Invalid date format: {date_string}",
            field="date",
            value=date_string,
            original_error=e,
        ) from e


def format_date(
    dt: datetime,
    format_string: str = "%Y-%m-%d %H:%M:%S",
) -> str:
    """
    Format datetime object to string.

    Args:
        dt: Datetime object
        format_string: Format string

    Returns:
        Formatted date string

    Example:
        >>> format_date(datetime.now(), "%Y-%m-%d")
        '2024-01-15'
    """
    return dt.strftime(format_string)


def get_timestamp(dt: Optional[datetime] = None, milliseconds: bool = False) -> int:
    """
    Get Unix timestamp.

    Args:
        dt: Datetime object (uses current time if not provided)
        milliseconds: Return timestamp in milliseconds

    Returns:
        Unix timestamp

    Example:
        >>> get_timestamp()
        1705334400
        >>> get_timestamp(milliseconds=True)
        1705334400000
    """
    if dt is None:
        dt = datetime.now(timezone.utc)

    timestamp = int(dt.timestamp())

    if milliseconds:
        timestamp *= 1000

    return timestamp


def from_timestamp(
    timestamp: int,
    milliseconds: bool = False,
    tz: Optional[timezone] = None,
) -> datetime:
    """
    Convert Unix timestamp to datetime.

    Args:
        timestamp: Unix timestamp
        milliseconds: Timestamp is in milliseconds
        tz: Timezone (UTC if not provided)

    Returns:
        Datetime object

    Example:
        >>> from_timestamp(1705334400)
        datetime.datetime(2024, 1, 15, 12, 0)
    """
    if milliseconds:
        timestamp = timestamp / 1000

    if tz is None:
        tz = timezone.utc

    return datetime.fromtimestamp(timestamp, tz=tz)


def now(tz: Optional[timezone] = None) -> datetime:
    """
    Get current datetime.

    Args:
        tz: Timezone (UTC if not provided)

    Returns:
        Current datetime
    """
    if tz is None:
        tz = timezone.utc

    return datetime.now(tz)


def utc_now() -> datetime:
    """
    Get current UTC datetime.

    Returns:
        Current UTC datetime
    """
    return datetime.now(timezone.utc)


def today() -> datetime:
    """
    Get today's date at midnight.

    Returns:
        Today's date at 00:00:00
    """
    return datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)


def days_between(start: datetime, end: datetime) -> int:
    """
    Calculate days between two dates.

    Args:
        start: Start datetime
        end: End datetime

    Returns:
        Number of days (can be negative)

    Example:
        >>> days_between(datetime(2024, 1, 1), datetime(2024, 1, 15))
        14
    """
    delta = end - start
    return delta.days


def hours_between(start: datetime, end: datetime) -> float:
    """
    Calculate hours between two datetimes.

    Args:
        start: Start datetime
        end: End datetime

    Returns:
        Number of hours (can be negative)
    """
    delta = end - start
    return delta.total_seconds() / 3600


def add_days(dt: datetime, days: int) -> datetime:
    """
    Add days to datetime.

    Args:
        dt: Datetime object
        days: Number of days to add (can be negative)

    Returns:
        New datetime object

    Example:
        >>> add_days(datetime(2024, 1, 1), 10)
        datetime.datetime(2024, 1, 11, 0, 0)
    """
    return dt + timedelta(days=days)


def add_hours(dt: datetime, hours: int) -> datetime:
    """
    Add hours to datetime.

    Args:
        dt: Datetime object
        hours: Number of hours to add (can be negative)

    Returns:
        New datetime object
    """
    return dt + timedelta(hours=hours)


def add_minutes(dt: datetime, minutes: int) -> datetime:
    """
    Add minutes to datetime.

    Args:
        dt: Datetime object
        minutes: Number of minutes to add (can be negative)

    Returns:
        New datetime object
    """
    return dt + timedelta(minutes=minutes)


def start_of_day(dt: datetime) -> datetime:
    """
    Get start of day (midnight).

    Args:
        dt: Datetime object

    Returns:
        Datetime at 00:00:00

    Example:
        >>> start_of_day(datetime(2024, 1, 15, 14, 30))
        datetime.datetime(2024, 1, 15, 0, 0)
    """
    return dt.replace(hour=0, minute=0, second=0, microsecond=0)


def end_of_day(dt: datetime) -> datetime:
    """
    Get end of day (23:59:59.999999).

    Args:
        dt: Datetime object

    Returns:
        Datetime at 23:59:59.999999

    Example:
        >>> end_of_day(datetime(2024, 1, 15, 14, 30))
        datetime.datetime(2024, 1, 15, 23, 59, 59, 999999)
    """
    return dt.replace(hour=23, minute=59, second=59, microsecond=999999)


def is_past(dt: datetime) -> bool:
    """
    Check if datetime is in the past.

    Args:
        dt: Datetime object

    Returns:
        True if in the past, False otherwise
    """
    return dt < datetime.now(dt.tzinfo or timezone.utc)


def is_future(dt: datetime) -> bool:
    """
    Check if datetime is in the future.

    Args:
        dt: Datetime object

    Returns:
        True if in the future, False otherwise
    """
    return dt > datetime.now(dt.tzinfo or timezone.utc)


def is_today(dt: datetime) -> bool:
    """
    Check if datetime is today.

    Args:
        dt: Datetime object

    Returns:
        True if today, False otherwise
    """
    today_date = datetime.now(dt.tzinfo or timezone.utc).date()
    return dt.date() == today_date


def time_ago(dt: datetime) -> str:
    """
    Get human-readable time ago string.

    Args:
        dt: Datetime object

    Returns:
        Human-readable string (e.g., "2 hours ago")

    Example:
        >>> time_ago(datetime.now() - timedelta(hours=2))
        '2 hours ago'
    """
    now_dt = datetime.now(dt.tzinfo or timezone.utc)
    delta = now_dt - dt

    seconds = delta.total_seconds()

    if seconds < 60:
        return f"{int(seconds)} seconds ago"
    elif seconds < 3600:
        minutes = int(seconds / 60)
        return f"{minutes} {'minute' if minutes == 1 else 'minutes'} ago"
    elif seconds < 86400:
        hours = int(seconds / 3600)
        return f"{hours} {'hour' if hours == 1 else 'hours'} ago"
    elif seconds < 604800:
        days = int(seconds / 86400)
        return f"{days} {'day' if days == 1 else 'days'} ago"
    elif seconds < 2592000:
        weeks = int(seconds / 604800)
        return f"{weeks} {'week' if weeks == 1 else 'weeks'} ago"
    elif seconds < 31536000:
        months = int(seconds / 2592000)
        return f"{months} {'month' if months == 1 else 'months'} ago"
    else:
        years = int(seconds / 31536000)
        return f"{years} {'year' if years == 1 else 'years'} ago"
