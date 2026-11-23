Write-Host "Launching Health Portal Backend & Frontend..." -ForegroundColor Cyan

Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", "$PSScriptRoot\start-backend.ps1"
Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", "$PSScriptRoot\start-frontend.ps1"

Write-Host "Both backend and frontend have been launched in separate PowerShell windows." -ForegroundColor Green
Write-Host "Backend:  http://localhost:8080" -ForegroundColor White
Write-Host "Frontend: http://localhost:5173" -ForegroundColor White
