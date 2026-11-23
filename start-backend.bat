@echo off
title Health Portal Backend (Spring Boot)

set "JAVA_HOME=C:\Program Files\Java\jdk-22"
if not exist "%JAVA_HOME%" (
    if exist "C:\Program Files\Java\jdk-24" set "JAVA_HOME=C:\Program Files\Java\jdk-24"
)
set "PATH=%JAVA_HOME%\bin;%PATH%"

if exist "%~dp0.env" (
    for /f "usebackq tokens=1* delims==" %%A in ("%~dp0.env") do (
        if not "%%A"=="" (
            set "%%A=%%B"
        )
    )
)

if "%DB_USER%"=="" set "DB_USER=health_portal_app"
if "%GROQ_MODEL%"=="" set "GROQ_MODEL=openai/gpt-oss-120b"

echo ==========================================================
echo Starting Spring Boot Backend on http://localhost:8080...
echo Java: %JAVA_HOME%
echo Database User: %DB_USER%
echo Groq AI Model: %GROQ_MODEL%
echo ==========================================================
cd /d "%~dp0backend"
call "D:\Program Files\apache-maven-3.10.0\bin\mvn.cmd" spring-boot:run
