# Deep Work Session Tracker

A focused work-session tracker with a FastAPI API, SQLite storage, Alembic migrations, a React client, and an OpenAPI-generated Python SDK.

## Requirements

- Python 3.12.6
- `uv`
- Node.js and npm
- Java 17 or newer to generate the Python SDK

## Setup

From the repository root, run:

```bat
setupdev.bat
```

This syncs the Python 3.12 environment, applies database migrations, and installs frontend packages. To load the sample records after migration:

```bat
uv run python -c "import sqlite3; db=sqlite3.connect('deepwork.db'); db.executescript(open('seed_data.sql', encoding='utf-8').read()); db.close()"
```

## Run

```bat
runapplication.bat
```

The API is at `http://127.0.0.1:8000`, interactive OpenAPI documentation is at `http://127.0.0.1:8000/docs`, and the frontend is at `http://localhost:5173`.

If port 8000 is unavailable, start the API on another port and set `VITE_API_URL` to that API origin before starting the frontend, for example `set VITE_API_URL=http://127.0.0.1:8001`.

To run the backend or frontend separately:

```bat
uv run uvicorn app.main:app --reload
cd frontend
npm start
```

## API

- `POST /sessions/` schedules a session with `title`, `duration` in minutes, and optional `goal`.
- `PATCH /sessions/{id}/start` starts a scheduled session.
- `PATCH /sessions/{id}/pause` pauses an active session with a `reason`.
- `PATCH /sessions/{id}/resume` resumes a paused session.
- `PATCH /sessions/{id}/complete` completes an active session.
- `GET /sessions/{id}` returns the full record and interruption timeline for one session.
- `GET /sessions/history` returns session records and aggregate focus, pause, and completion statistics.

Select a session title in the frontend to open its dedicated detail page. Direct links to `/sessions/{id}` are supported.

Invalid state transitions return `409`, missing sessions return `404`, and invalid request data returns `422`.

The fourth pause ends a session as `interrupted`. A session completed more than 110% of its scheduled duration after start is `overdue`. A paused session that remains paused at that same deadline is `abandoned`; it can be resumed before the deadline. Elapsed time is wall-clock time, while focus time excludes recorded pause intervals. The completion ratio is successfully completed sessions divided by all sessions.

## SDK

With the API running, generate the Python client from its OpenAPI document:

```bat
npx @openapitools/openapi-generator-cli generate -i http://127.0.0.1:8000/openapi.json -g python -o deepwork_sdk --additional-properties=packageName=deepwork_sdk,projectName=deepwork-sdk
```

The generated SDK is in `deepwork_sdk/`. In Command Prompt, install its dependencies and add the generated package directory to Python's import path:

```bat
uv pip install -r deepwork_sdk\requirements.txt
set PYTHONPATH=%CD%\deepwork_sdk
```

Then use it from the repository root:

```python
from deepwork_sdk import ApiClient
from deepwork_sdk.api.sessions_api import SessionsApi

with ApiClient() as client:
    api = SessionsApi(client)
    result = api.get_history_sessions_history_get()
    print(result.total_sessions)
```

The OpenAPI document is also available at `/openapi.json`.

## Tests

```bat
uv run python -m pytest
```

Tests use an isolated in-memory SQLite database and do not modify the application database.