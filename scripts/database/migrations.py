"""
Database Migrations - Migration utilities.
"""

from scripts.core.logger import get_logger
from scripts.database.connection import DatabaseConnection

logger = get_logger(__name__)


class MigrationManager:
    """Database migration manager."""

    def __init__(self, db: DatabaseConnection) -> None:
        """Initialize migration manager."""
        self.db = db

    def run_migrations(self) -> None:
        """Run all pending migrations."""
        logger.info("Running database migrations")
        self.db.create_tables()
        logger.info("Migrations completed")
