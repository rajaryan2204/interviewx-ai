import sys
from logging.config import fileConfig
from pathlib import Path

from sqlalchemy import engine_from_config, pool

from alembic import context

# Add the parent directory (backend root) to path to allow importing app modules
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.config import settings
from app.models.base import Base
from app.models.coding import (  # noqa: F401
    CodeExecution,
    CodeSubmission,
    CodingFeedback,
    CodingQuestion,
    CodingSession,
)
from app.models.interview import (  # noqa: F401
    Interview,
    InterviewAnswer,
    InterviewFeedback,
    InterviewQuestion,
)
from app.models.recruiter import (  # noqa: F401
    AdminSettings,
    AuditLog,
    CandidateAssignment,
    Company,
    InterviewTemplate,
    Recruiter,
    RecruiterInterview,
)
from app.models.resume import Resume  # noqa: F401
from app.models.user import User, UserSession  # noqa: F401
from app.models.productivity import (  # noqa: F401
    CalendarEvent,
    Notification,
    Reminder,
    Goal,
    Task,
    EmailLog,
)
from app.models.monetization import (  # noqa: F401
    Plan,
    Coupon,
    Subscription,
    Payment,
    Invoice,
    Transaction,
)

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Set target metadata for autogenerate support
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL and not an Engine.
    """
    url = settings.SQLALCHEMY_DATABASE_URI
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.
    """
    # Override connection URL in the alembic config section
    configuration = config.get_section(config.config_ini_section, {})
    configuration["sqlalchemy.url"] = settings.SQLALCHEMY_DATABASE_URI

    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
