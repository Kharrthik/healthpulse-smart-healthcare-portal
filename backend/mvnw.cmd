@echo off
setlocal
if not defined JAVA_HOME (
    if exist "C:\Program Files\Java\jdk-24" (
        set "JAVA_HOME=C:\Program Files\Java\jdk-24"
    ) else if exist "C:\Program Files\Java\jdk-22" (
        set "JAVA_HOME=C:\Program Files\Java\jdk-22"
    )
)

if exist "D:\Program Files\apache-maven-3.10.0\bin\mvn.cmd" (
    call "D:\Program Files\apache-maven-3.10.0\bin\mvn.cmd" %*
    exit /b %ERRORLEVEL%
)

where mvn >nul 2>&1
if %ERRORLEVEL% equ 0 (
    mvn %*
    exit /b %ERRORLEVEL%
)

echo [ERROR] Maven not found on PATH or at D:\Program Files\apache-maven-3.10.0\bin\mvn.cmd.
exit /b 1
