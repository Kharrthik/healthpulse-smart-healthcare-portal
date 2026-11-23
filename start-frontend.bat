@echo off
title Health Portal Frontend (Vite)
echo Starting React Frontend on http://localhost:5173...
cd /d "%~dp0frontend"
npm run dev -- --host

