<# 
.SECURITHM Dev Startup Script
.SYNOPSIS
    Starts the Securithm development environment - database, backend API, and frontend.
.DESCRIPTION
    This script:
    1. Starts Docker containers (PostgreSQL + Redis) if Docker is available
    2. Seeds/creates the database if needed
    3. Starts the FastAPI backend on port 8000
    4. Starts the Next.js frontend on port 3000
.PARAMETER NoDocker
    Skip Docker startup (use SQLite instead)
.PARAMETER NoSeed
    Skip database seeding
.PARAMETER NoFrontend
    Skip starting the frontend
#>

param(
    [switch]$NoDocker,
    [switch]$NoSeed,
    [switch]$NoFrontend
)

$ErrorActionPreference = "Stop"
$ROOT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$VENV_DIR = Join-Path $ROOT_DIR ".venv"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Securithm - Development Environment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ── 1. Start Docker (PostgreSQL + Redis) ──────────────────────
if (-not $NoDocker) {
    Write-Host "[1/4] Checking Docker..." -ForegroundColor Yellow
    $dockerRunning = $false
    try {
        $null = docker ps 2>&1 | Out-Null
        $dockerRunning = $true
    } catch {}

    if ($dockerRunning) {
        Write-Host "  Starting PostgreSQL + Redis..." -ForegroundColor Gray
        docker compose up -d 2>&1 | Out-Null
        Write-Host "  OK Docker containers started" -ForegroundColor Green
    } else {
        Write-Host "  Docker not available - using SQLite instead" -ForegroundColor Yellow
        $env:DATABASE_URL = "sqlite:///./securithm_dev.db"
    }
} else {
    Write-Host "[1/4] Skipping Docker - using SQLite" -ForegroundColor Yellow
    $env:DATABASE_URL = "sqlite:///./securithm_dev.db"
}

# ── 2. Install dependencies ───────────────────────────────────
Write-Host ""
Write-Host "[2/4] Checking dependencies..." -ForegroundColor Yellow

# Backend
try {
    python -c "import fastapi" 2>&1 | Out-Null
    Write-Host "  OK Backend deps installed" -ForegroundColor Green
} catch {
    Write-Host "  Installing backend dependencies..." -ForegroundColor Gray
    pip install -r (Join-Path $ROOT_DIR "backend/requirements.txt") 2>&1 | Out-Null
    pip install email-validator 'bcrypt<5.0.0' 2>&1 | Out-Null
    Write-Host "  OK Backend deps installed" -ForegroundColor Green
}

# Frontend
if (-not $NoFrontend) {
    try {
        $null = Get-Command "npx" -ErrorAction Stop
        if (Test-Path (Join-Path $ROOT_DIR "node_modules")) {
            Write-Host "  OK Frontend deps installed" -ForegroundColor Green
        } else {
            Write-Host "  Installing frontend dependencies..." -ForegroundColor Gray
            cd $ROOT_DIR
            npm install 2>&1 | Out-Null
            Write-Host "  OK Frontend deps installed" -ForegroundColor Green
        }
    } catch {
        Write-Host "  WARNING: npm not found - skipping frontend" -ForegroundColor Red
        $NoFrontend = $true
    }
}

# ── 3. Seed database ──────────────────────────────────────────
Write-Host ""
Write-Host "[3/4] Setting up database..." -ForegroundColor Yellow

if (-not $NoSeed) {
    python -c "
import os
os.environ['DATABASE_URL'] = '$env:DATABASE_URL'
from backend.core.database import engine, Base
from backend.models import *
Base.metadata.create_all(bind=engine)
print('OK tables created')
" 2>&1 | Out-Null

    python -c "
import os
os.environ['DATABASE_URL'] = '$env:DATABASE_URL'
from backend.core.database import SessionLocal
from backend.dev_setup import seed_data
seed_data()
print('OK data seeded')
" 2>&1 | Out-Null

    Write-Host "  OK Database seeded" -ForegroundColor Green
} else {
    Write-Host "  Skipping seed" -ForegroundColor Yellow
}

# ── 4. Start servers ──────────────────────────────────────────
Write-Host ""
Write-Host "[4/4] Starting servers..." -ForegroundColor Yellow

# Kill any existing processes
Get-Process -Name "uvicorn" -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -match "next" } | Stop-Process -Force

# Start backend
$backendLog = Join-Path $ROOT_DIR "backend.log"    $dbUrl = $env:DATABASE_URL
    $backendJob = Start-Job -ScriptBlock {
        param($dir, $log, $dbUrl)
        cd $dir
        $env:DATABASE_URL = $dbUrl
        python -m backend.dev_setup --no-seed --no-reload *>&1 | Out-File -FilePath $log
    } -ArgumentList $ROOT_DIR, $backendLog, $dbUrl

Write-Host "  Starting backend API (http://localhost:8000)..." -ForegroundColor Gray
Start-Sleep -Seconds 3
Write-Host "  OK Backend running" -ForegroundColor Green

# Start frontend
if (-not $NoFrontend) {
    $frontendLog = Join-Path $ROOT_DIR "frontend.log"
    $frontendJob = Start-Job -ScriptBlock {
        param($dir, $log)
        cd $dir
        npx next dev -p 3000 *>&1 | Out-File -FilePath $log
    } -ArgumentList $ROOT_DIR, $frontendLog

    Write-Host "  Starting frontend (http://localhost:3000)..." -ForegroundColor Gray
    Start-Sleep -Seconds 5
    Write-Host "  OK Frontend running" -ForegroundColor Green
}

# ── Summary ───────────────────────────────────────────────────
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Securithm is running!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "  Backend:  http://localhost:8000" -ForegroundColor White
Write-Host "  API Docs: http://localhost:8000/docs" -ForegroundColor White
Write-Host ""
Write-Host "  Demo Login: dev@example.com / password123" -ForegroundColor Gray
Write-Host ""
Write-Host "  To stop: docker compose down (if using Docker)" -ForegroundColor Gray
Write-Host "  Logs: backend.log, frontend.log" -ForegroundColor Gray
Write-Host "========================================" -ForegroundColor Cyan

# Keep the script running to show status
Write-Host ""
Write-Host "Press Ctrl+C to stop all servers" -ForegroundColor Yellow

# Wait for either job
while ($true) {
    Start-Sleep -Seconds 10
    $bStatus = Receive-Job -Job $backendJob -ErrorAction SilentlyContinue
    $fStatus = Receive-Job -Job $frontendJob -ErrorAction SilentlyContinue

    if ($backendJob.State -eq "Failed") {
        Write-Host "WARNING: Backend stopped unexpectedly" -ForegroundColor Red
        Get-Content $backendLog -Tail 5
        break
    }
}
