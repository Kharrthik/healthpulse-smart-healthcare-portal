Write-Host "==========================================================" -ForegroundColor Green
Write-Host "Starting Health Portal React Frontend (Vite on Port 5173)..." -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green

Set-Location "$PSScriptRoot\frontend"
& "C:\Program Files\nodejs\npm.cmd" run dev
