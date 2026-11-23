Write-Host "Checking MySQL on port 3306..." -ForegroundColor Cyan

$test = Test-NetConnection -ComputerName 127.0.0.1 -Port 3306 -WarningAction SilentlyContinue

if ($test.TcpTestSucceeded) {
    Write-Host "[SUCCESS] MySQL is running on port 3306!" -ForegroundColor Green
} else {
    Write-Host "[WARNING] MySQL is NOT running on port 3306." -ForegroundColor Yellow
    Write-Host "Please start MySQL using one of these options:" -ForegroundColor White
    Write-Host "  Option 1: Open PowerShell as Administrator and run: Start-Service MySQL" -ForegroundColor Yellow
    Write-Host "  Option 2: Press Win+R, type services.msc, find 'MySQL', and click Start." -ForegroundColor Yellow
}

