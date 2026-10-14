from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import Interruption, WorkSession
from app.schemas import HistoryResponse, PauseRequest, SessionCreate, SessionResponse


router = APIRouter(prefix="/sessions", tags=["sessions"])


def utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def session_response(work_session: WorkSession, now: datetime | None = None) -> SessionResponse:
    current_time = now or utc_now()
    elapsed = 0
    focus = 0

    if work_session.start_time:
        end_time = work_session.end_time or current_time
        elapsed_seconds = (end_time - work_session.start_time).total_seconds()
        elapsed = max(0, int(elapsed_seconds // 60))
        paused_seconds = sum(
            max(
                0,
                int(((interruption.resume_time or end_time) - interruption.pause_time).total_seconds()),
            )
            for interruption in work_session.interruptions
        )
        focus = max(0, int((elapsed_seconds - paused_seconds) // 60))

    return SessionResponse(
        id=work_session.id,
        title=work_session.title,
        goal=work_session.goal,
        scheduled_duration=work_session.scheduled_duration,
        start_time=work_session.start_time,
        end_time=work_session.end_time,
        status=work_session.status,
        created_at=work_session.created_at,
        elapsed_minutes=elapsed,
        focus_minutes=focus,
        pause_count=len(work_session.interruptions),
        interruptions=work_session.interruptions,
    )


def load_session(db: Session, session_id: int) -> WorkSession:
    work_session = (
        db.query(WorkSession)
        .options(joinedload(WorkSession.interruptions))
        .filter(WorkSession.id == session_id)
        .first()
    )
    if work_session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return work_session


def expire_paused_sessions(db: Session, now: datetime) -> None:
    paused_sessions = (
        db.query(WorkSession)
        .filter(WorkSession.status == "paused")
        .options(joinedload(WorkSession.interruptions))
        .all()
    )
    for work_session in paused_sessions:
        if work_session.start_time and now >= work_session.start_time + timedelta(
            minutes=work_session.scheduled_duration * 1.1
        ):
            work_session.status = "abandoned"
            work_session.end_time = work_session.start_time + timedelta(
                minutes=work_session.scheduled_duration * 1.1
            )
    db.flush()


@router.post("/", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
def create_session(payload: SessionCreate, db: Session = Depends(get_db)) -> SessionResponse:
    work_session = WorkSession(
        title=payload.title.strip(),
        goal=payload.goal.strip() if payload.goal else None,
        scheduled_duration=payload.duration,
        status="scheduled",
    )
    if not work_session.title:
        raise HTTPException(status_code=422, detail="Title cannot be empty")
    db.add(work_session)
    db.commit()
    db.refresh(work_session)
    return session_response(work_session)


@router.patch("/{session_id}/start", response_model=SessionResponse)
def start_session(session_id: int, db: Session = Depends(get_db)) -> SessionResponse:
    now = utc_now()
    expire_paused_sessions(db, now)
    work_session = load_session(db, session_id)
    if work_session.status != "scheduled":
        raise HTTPException(status_code=409, detail="Only scheduled sessions can be started")
    work_session.status = "active"
    work_session.start_time = now
    db.commit()
    return session_response(load_session(db, session_id), now)


@router.patch("/{session_id}/pause", response_model=SessionResponse)
def pause_session(
    session_id: int, payload: PauseRequest, db: Session = Depends(get_db)
) -> SessionResponse:
    now = utc_now()
    expire_paused_sessions(db, now)
    work_session = load_session(db, session_id)
    if work_session.status != "active":
        raise HTTPException(status_code=409, detail="Only active sessions can be paused")
    reason = payload.reason.strip()
    if not reason:
        raise HTTPException(status_code=422, detail="Interruption reason cannot be empty")
    work_session.interruptions.append(Interruption(reason=reason, pause_time=now))
    if len(work_session.interruptions) > 3:
        work_session.status = "interrupted"
        work_session.end_time = now
    elif now >= work_session.start_time + timedelta(minutes=work_session.scheduled_duration * 1.1):
        work_session.status = "abandoned"
        work_session.end_time = work_session.start_time + timedelta(
            minutes=work_session.scheduled_duration * 1.1
        )
    else:
        work_session.status = "paused"
    db.commit()
    return session_response(load_session(db, session_id), now)


@router.patch("/{session_id}/resume", response_model=SessionResponse)
def resume_session(session_id: int, db: Session = Depends(get_db)) -> SessionResponse:
    now = utc_now()
    expire_paused_sessions(db, now)
    work_session = load_session(db, session_id)
    if work_session.status != "paused":
        raise HTTPException(status_code=409, detail="Only paused sessions can be resumed")
    work_session.interruptions[-1].resume_time = now
    work_session.status = "active"
    db.commit()
    return session_response(load_session(db, session_id), now)


@router.patch("/{session_id}/complete", response_model=SessionResponse)
def complete_session(session_id: int, db: Session = Depends(get_db)) -> SessionResponse:
    now = utc_now()
    expire_paused_sessions(db, now)
    work_session = load_session(db, session_id)
    if work_session.status != "active":
        raise HTTPException(status_code=409, detail="Only active sessions can be completed")
    work_session.end_time = now
    elapsed_minutes = (now - work_session.start_time).total_seconds() / 60
    work_session.status = (
        "overdue" if elapsed_minutes > work_session.scheduled_duration * 1.1 else "completed"
    )
    db.commit()
    return session_response(load_session(db, session_id), now)


@router.get("/history", response_model=HistoryResponse)
def get_history(db: Session = Depends(get_db)) -> HistoryResponse:
    now = utc_now()
    expire_paused_sessions(db, now)
    db.commit()
    work_sessions = (
        db.query(WorkSession)
        .options(joinedload(WorkSession.interruptions))
        .order_by(WorkSession.created_at.desc(), WorkSession.id.desc())
        .all()
    )
    responses = [session_response(work_session, now) for work_session in work_sessions]
    total_sessions = len(responses)
    completed_sessions = sum(session.status == "completed" for session in responses)
    return HistoryResponse(
        sessions=responses,
        total_sessions=total_sessions,
        completed_sessions=completed_sessions,
        completion_ratio=completed_sessions / total_sessions if total_sessions else 0.0,
        total_focus_minutes=sum(session.focus_minutes for session in responses),
        total_pauses=sum(session.pause_count for session in responses),
    )


@router.get("/{session_id}", response_model=SessionResponse)
def get_session(session_id: int, db: Session = Depends(get_db)) -> SessionResponse:
    return session_response(load_session(db, session_id))
