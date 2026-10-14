@echo off
setlocal
cd /d "%~dp0"

echo Setting up Python environment...
uv sync --python 3.12.6
if errorlevel 1 exit /b 1

echo Applying database migrations...
uv run alembic upgrade head
if errorlevel 1 exit /b 1

if exist deepwork_sdk\requirements.txt (
    echo Installing generated SDK dependencies...
    uv pip install -r deepwork_sdk\requirements.txt
    if errorlevel 1 exit /b 1
)

echo Setting up frontend...
cd frontend
call npm install
if errorlevel 1 exit /b 1
cd ..

echo Setup complete.
