from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class SessionCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    goal: str | None = Field(default=None, max_length=2000)
    duration: int = Field(gt=0, le=1440)


class PauseRequest(BaseModel):
    reason: str = Field(min_length=1, max_length=1000)


class InterruptionResponse(BaseModel):
    id: int
    reason: str
    pause_time: datetime
    resume_time: datetime | None

    model_config = ConfigDict(from_attributes=True)


class SessionResponse(BaseModel):
    id: int
    title: str
    goal: str | None
    scheduled_duration: int
    start_time: datetime | None
    end_time: datetime | None
    status: str
    created_at: datetime
    elapsed_minutes: int
    focus_minutes: int
    pause_count: int
    interruptions: list[InterruptionResponse]

    model_config = ConfigDict(from_attributes=True)


class HistoryResponse(BaseModel):
    sessions: list[SessionResponse]
    total_sessions: int
    completed_sessions: int
    completion_ratio: float
    total_focus_minutes: int
    total_pauses: int
