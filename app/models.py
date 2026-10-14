from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class WorkSession(Base):
    __tablename__ = "sessions"
    __table_args__ = (
        CheckConstraint(
            "status IN ('scheduled','active','paused','completed','interrupted','abandoned','overdue')",
            name="session_status",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    goal: Mapped[str | None] = mapped_column(Text)
    scheduled_duration: Mapped[int] = mapped_column(Integer, nullable=False)
    start_time: Mapped[datetime | None] = mapped_column(DateTime)
    end_time: Mapped[datetime | None] = mapped_column(DateTime)
    status: Mapped[str] = mapped_column(String, nullable=False, default="scheduled")
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.current_timestamp()
    )
    interruptions: Mapped[list["Interruption"]] = relationship(
        back_populates="session", cascade="all, delete-orphan", order_by="Interruption.id"
    )


class Interruption(Base):
    __tablename__ = "interruptions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    pause_time: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.current_timestamp()
    )
    resume_time: Mapped[datetime | None] = mapped_column(DateTime)
    session: Mapped[WorkSession] = relationship(back_populates="interruptions")
