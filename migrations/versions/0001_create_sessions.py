from typing import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "0001_create_sessions"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "sessions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("goal", sa.Text(), nullable=True),
        sa.Column("scheduled_duration", sa.Integer(), nullable=False),
        sa.Column("start_time", sa.DateTime(), nullable=True),
        sa.Column("end_time", sa.DateTime(), nullable=True),
        sa.Column("status", sa.String(), nullable=False, server_default="scheduled"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.current_timestamp()),
        sa.CheckConstraint(
            "status IN ('scheduled','active','paused','completed','interrupted','abandoned','overdue')",
            name="session_status",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "interruptions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("session_id", sa.Integer(), nullable=False),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("pause_time", sa.DateTime(), nullable=False, server_default=sa.func.current_timestamp()),
        sa.Column("resume_time", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["session_id"], ["sessions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("interruptions")
    op.drop_table("sessions")
