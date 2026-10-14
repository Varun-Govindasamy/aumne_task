@echo off
setlocal
cd /d "%~dp0"

start "Deep Work API" cmd /k "cd /d ""%~dp0"" && uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"
start "Deep Work Frontend" cmd /k "cd /d ""%~dp0frontend"" && npm start"
