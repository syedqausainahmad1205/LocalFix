import logging
from app.db.session import engine
from app.models import Base

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def init_db() -> None:
    """Create all database tables registered under Base metadata."""
    logger.info("Creating database tables in PostgreSQL...")
    Base.metadata.create_all(bind=engine)
    logger.info("Successfully created all database tables.")


if __name__ == "__main__":
    init_db()
