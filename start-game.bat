@echo off
title BananaQuest Game Launcher
echo ========================================================
echo        🍌 STARTING BANANAQUEST GAME FOR DEMO 🍌
echo ========================================================
echo.

cd /d "%~dp0"

echo 1. Starting Backend Server (Port 5000)...
start "BananaGame-Backend" cmd /k "cd backend && npm start"

echo 2. Starting Frontend Server (Port 5173)...
start "BananaGame-Frontend" cmd /k "cd frontend && npm run dev"

echo 3. Waiting 3 seconds for servers to initialize...
timeout /t 3 /nobreak >nul

echo 4. Opening Browser to http://localhost:5173...
start http://localhost:5173

echo.
echo ========================================================
echo  All systems running! Keep the backend & frontend
echo  windows open while demonstrating to your supervisor.
echo ========================================================
pause
