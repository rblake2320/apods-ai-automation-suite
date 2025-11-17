"""
Database Connection - Database connection management.
"""

from contextlib import contextmanager
from typing import Iterator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from scripts.core.logger import get_logger
from scripts.database.models import Base

logger = get_logger(__name__)


class DatabaseConnection:
    """Database connection manager."""

    def __init__(self, db_url: str, echo: bool = False) -> None:
        """Initialize database connection."""
        self.db_url = db_url
        self.engine = create_engine(db_url, echo=echo)
        self.SessionLocal = sessionmaker(bind=self.engine)

    def create_tables(self) -> None:
        """Create all tables."""
        logger.info("Creating database tables")
        Base.metadata.create_all(self.engine)

    def drop_tables(self) -> None:
        """Drop all tables."""
        logger.warning("Dropping database tables")
        Base.metadata.drop_all(self.engine)

    @contextmanager
    def session(self) -> Iterator[Session]:
        """Get database session context manager."""
        session = self.SessionLocal()
        try:
            yield session
            session.commit()
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()


_db: DatabaseConnection = None


def get_db_session(db_url: str = "sqlite:///apods.db") -> Iterator[Session]:
    """Get database session."""
    global _db
    if _db is None:
        _db = DatabaseConnection(db_url)
        _db.create_tables()

    with _db.session() as session:
        yield session
