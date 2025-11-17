"""
Configuration Management - Centralized configuration handling.

This module provides configuration management using YAML files and
environment variables with validation and type safety.
"""

import os
from pathlib import Path
from typing import Any, Optional

import yaml
from pydantic import BaseModel, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

from scripts.core.constants import (
    DEFAULT_AI_MODEL,
    DEFAULT_TIMEOUT,
    DEFAULT_USER_AGENT,
    Environment,
    LogLevel,
    MAX_RETRIES,
    RATE_LIMIT_CALLS,
    RATE_LIMIT_PERIOD,
)
from scripts.core.exceptions import ConfigurationError


class DatabaseConfig(BaseModel):
    """Database configuration settings."""

    url: str = Field(default="sqlite:///apods.db", description="Database URL")
    pool_size: int = Field(default=5, ge=1, description="Connection pool size")
    max_overflow: int = Field(default=10, ge=0, description="Max connection overflow")
    pool_timeout: int = Field(default=30, ge=1, description="Pool timeout in seconds")
    echo: bool = Field(default=False, description="Echo SQL queries")


class NetworkConfig(BaseModel):
    """Network configuration settings."""

    timeout: int = Field(default=DEFAULT_TIMEOUT, ge=1, description="Request timeout")
    max_retries: int = Field(default=MAX_RETRIES, ge=0, description="Max retry attempts")
    backoff_factor: float = Field(default=2.0, ge=1.0, description="Retry backoff factor")
    user_agent: str = Field(default=DEFAULT_USER_AGENT, description="User agent string")
    verify_ssl: bool = Field(default=True, description="Verify SSL certificates")


class RateLimitConfig(BaseModel):
    """Rate limiting configuration."""

    enabled: bool = Field(default=True, description="Enable rate limiting")
    calls: int = Field(default=RATE_LIMIT_CALLS, ge=1, description="Max calls per period")
    period: int = Field(default=RATE_LIMIT_PERIOD, ge=1, description="Period in seconds")


class AIConfig(BaseModel):
    """AI service configuration."""

    api_key: Optional[str] = Field(default=None, description="Anthropic API key")
    model: str = Field(default=DEFAULT_AI_MODEL, description="Default AI model")
    max_tokens: int = Field(default=4096, ge=1, description="Max tokens per request")
    temperature: float = Field(default=0.7, ge=0.0, le=1.0, description="Model temperature")
    timeout: int = Field(default=60, ge=1, description="API timeout in seconds")

    @field_validator("api_key")
    @classmethod
    def validate_api_key(cls, v: Optional[str]) -> Optional[str]:
        """Validate API key format."""
        if v and not v.startswith("sk-"):
            raise ValueError("Invalid Anthropic API key format")
        return v


class LoggingConfig(BaseModel):
    """Logging configuration settings."""

    level: LogLevel = Field(default=LogLevel.INFO, description="Log level")
    format: str = Field(
        default="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        description="Log format string",
    )
    file_enabled: bool = Field(default=True, description="Enable file logging")
    file_path: str = Field(default="logs/apods.log", description="Log file path")
    console_enabled: bool = Field(default=True, description="Enable console logging")
    max_bytes: int = Field(default=10485760, ge=1, description="Max log file size")
    backup_count: int = Field(default=5, ge=0, description="Number of backup files")


class ScrapingConfig(BaseModel):
    """Web scraping configuration."""

    delay_min: float = Field(default=1.0, ge=0.0, description="Min delay between requests")
    delay_max: float = Field(default=3.0, ge=0.0, description="Max delay between requests")
    max_pages: int = Field(default=100, ge=1, description="Max pages to scrape")
    respect_robots_txt: bool = Field(default=True, description="Respect robots.txt")
    concurrent_requests: int = Field(default=5, ge=1, le=20, description="Concurrent requests")


class BrowserConfig(BaseModel):
    """Browser automation configuration."""

    headless: bool = Field(default=True, description="Run browser in headless mode")
    viewport_width: int = Field(default=1920, ge=800, description="Viewport width")
    viewport_height: int = Field(default=1080, ge=600, description="Viewport height")
    timeout: int = Field(default=30000, ge=1000, description="Browser timeout in ms")
    screenshot_enabled: bool = Field(default=False, description="Enable screenshots")
    screenshot_path: str = Field(default="screenshots/", description="Screenshot directory")


class CacheConfig(BaseModel):
    """Cache configuration settings."""

    enabled: bool = Field(default=True, description="Enable caching")
    ttl: int = Field(default=3600, ge=0, description="Cache TTL in seconds")
    max_size: int = Field(default=1000, ge=1, description="Max cache entries")
    backend: str = Field(default="memory", description="Cache backend (memory/redis)")


class Config(BaseSettings):
    """Main application configuration."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        env_prefix="APODS_",
        case_sensitive=False,
        extra="ignore",
    )

    # Application settings
    app_name: str = Field(default="APODS AI-Automation Suite", description="Application name")
    app_version: str = Field(default="1.0.0", description="Application version")
    environment: Environment = Field(default=Environment.DEVELOPMENT, description="Environment")
    debug: bool = Field(default=False, description="Debug mode")

    # Component configurations
    database: DatabaseConfig = Field(default_factory=DatabaseConfig)
    network: NetworkConfig = Field(default_factory=NetworkConfig)
    rate_limit: RateLimitConfig = Field(default_factory=RateLimitConfig)
    ai: AIConfig = Field(default_factory=AIConfig)
    logging: LoggingConfig = Field(default_factory=LoggingConfig)
    scraping: ScrapingConfig = Field(default_factory=ScrapingConfig)
    browser: BrowserConfig = Field(default_factory=BrowserConfig)
    cache: CacheConfig = Field(default_factory=CacheConfig)

    # Paths
    data_dir: Path = Field(default=Path("data"), description="Data directory")
    output_dir: Path = Field(default=Path("output"), description="Output directory")
    temp_dir: Path = Field(default=Path("/tmp/apods"), description="Temporary directory")

    @field_validator("data_dir", "output_dir", "temp_dir")
    @classmethod
    def ensure_path_exists(cls, v: Path) -> Path:
        """Ensure directory exists."""
        v.mkdir(parents=True, exist_ok=True)
        return v

    def validate(self) -> None:
        """Validate configuration after loading."""
        if self.environment == Environment.PRODUCTION:
            if not self.ai.api_key:
                raise ConfigurationError(
                    "AI API key is required in production environment",
                    config_key="ai.api_key",
                )
            if self.debug:
                raise ConfigurationError(
                    "Debug mode should be disabled in production",
                    config_key="debug",
                )

    def to_dict(self) -> dict[str, Any]:
        """Convert configuration to dictionary."""
        return self.model_dump()

    @classmethod
    def from_yaml(cls, file_path: str | Path) -> "Config":
        """
        Load configuration from YAML file.

        Args:
            file_path: Path to YAML configuration file

        Returns:
            Loaded configuration instance

        Raises:
            ConfigurationError: If file not found or invalid format
        """
        file_path = Path(file_path)

        if not file_path.exists():
            raise ConfigurationError(
                f"Configuration file not found: {file_path}",
                details={"file_path": str(file_path)},
            )

        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = yaml.safe_load(f)

            if not data:
                data = {}

            return cls(**data)

        except yaml.YAMLError as e:
            raise ConfigurationError(
                f"Invalid YAML format in configuration file",
                details={"file_path": str(file_path)},
                original_error=e,
            ) from e
        except Exception as e:
            raise ConfigurationError(
                f"Failed to load configuration",
                details={"file_path": str(file_path)},
                original_error=e,
            ) from e

    def save_to_yaml(self, file_path: str | Path) -> None:
        """
        Save configuration to YAML file.

        Args:
            file_path: Path to save configuration

        Raises:
            ConfigurationError: If save fails
        """
        file_path = Path(file_path)

        try:
            file_path.parent.mkdir(parents=True, exist_ok=True)

            with open(file_path, "w", encoding="utf-8") as f:
                yaml.safe_dump(
                    self.model_dump(mode="json"),
                    f,
                    default_flow_style=False,
                    sort_keys=False,
                )

        except Exception as e:
            raise ConfigurationError(
                f"Failed to save configuration",
                details={"file_path": str(file_path)},
                original_error=e,
            ) from e


# Global configuration instance
_config: Optional[Config] = None


def load_config(config_path: Optional[str | Path] = None) -> Config:
    """
    Load configuration from file or environment variables.

    Args:
        config_path: Optional path to YAML configuration file

    Returns:
        Loaded configuration instance
    """
    global _config

    if config_path:
        _config = Config.from_yaml(config_path)
    else:
        _config = Config()

    _config.validate()
    return _config


def get_config() -> Config:
    """
    Get current configuration instance.

    Returns:
        Current configuration

    Raises:
        ConfigurationError: If configuration not loaded
    """
    global _config

    if _config is None:
        _config = load_config()

    return _config


def reset_config() -> None:
    """Reset global configuration instance."""
    global _config
    _config = None
