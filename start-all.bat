@echo off
title HealthPulse Launcher
echo Starting HealthPulse Backend and Frontend...
start "HealthPulse Backend" cmd /k "%~dp0start-backend.bat"
start "HealthPulse Frontend" cmd /k "%~dp0start-frontend.bat"
