$env:JAVA_HOME = "C:\Program Files\Java\jdk-22"
if (-not (Test-Path $env:JAVA_HOME)) {
    if (Test-Path "C:\Program Files\Java\jdk-24") { $env:JAVA_HOME = "C:\Program Files\Java\jdk-24" }
}
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

# Load environment variables from .env if present
$envFile = Join-Path $PSScriptRoot ".env"
if (Test-Path $envFile) {
    Get-Content $envFile | Where-Object { $_ -match '^\s*([^#=\s]+)\s*=\s*(.*)$' } | ForEach-Object {
        $key = $matches[1].Trim()
        $val = $matches[2].Trim()
        if (-not [System.Environment]::GetEnvironmentVariable($key)) {
            [System.Environment]::SetEnvironmentVariable($key, $val, "Process")
        }
    }
}

# Safe database defaults
if (-not $env:DB_USER) { $env:DB_USER = "health_portal_app" }
if (-not $env:DB_PASSWORD) { $env:DB_PASSWORD = "" }
if (-not $env:DB_URL) { $env:DB_URL = "jdbc:mysql://127.0.0.1:3306/health_portal?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC" }

# Groq Cloud AI defaults
if (-not $env:GROQ_API_KEY) { $env:GROQ_API_KEY = "" }
if (-not $env:GROQ_MODEL) { $env:GROQ_MODEL = "openai/gpt-oss-120b" }

# Clean up any lingering process on port 8080
$occupied = Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue
if ($occupied) {
    $procId = $occupied.OwningProcess | Select-Object -First 1
    if ($procId) {
        Write-Host "Freeing port 8080 (terminating previous process PID $procId)..." -ForegroundColor Yellow
        Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 1
    }
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Starting HealthPulse Backend on http://localhost:8080..." -ForegroundColor Cyan
Write-Host "Java Runtime: $env:JAVA_HOME" -ForegroundColor Gray
Write-Host "Database User: $env:DB_USER" -ForegroundColor Gray
Write-Host "Groq AI Model: $env:GROQ_MODEL" -ForegroundColor Gray
Write-Host "==========================================================" -ForegroundColor Cyan

Set-Location "$PSScriptRoot\backend"
& "D:\Program Files\apache-maven-3.10.0\bin\mvn.cmd" spring-boot:run
