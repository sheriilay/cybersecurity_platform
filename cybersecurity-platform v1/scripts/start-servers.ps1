Write-Host "Setting up Cybersecurity Platform..." -ForegroundColor Green

# Get the script directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path

# Check if .env file exists
$envPath = Join-Path $scriptPath "backend\.env"
if (-not (Test-Path $envPath)) {
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    @"
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=admin
DB_NAME=cybersecurity_platform

# JWT Configuration
JWT_SECRET=cybersec_platform_jwt_secret_key
JWT_REFRESH_SECRET=cybersec_platform_refresh_secret_key
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
JWT_ISSUER=cybersec_platform
JWT_AUDIENCE=cybersec_platform

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Bcrypt Configuration
BCRYPT_ROUNDS=10
"@ | Out-File -FilePath $envPath -Encoding UTF8
    Write-Host ".env file created successfully" -ForegroundColor Green
}

# Initialize database
Write-Host "Initializing database..." -ForegroundColor Green
Set-Location (Join-Path $scriptPath "backend")
node init-db.js
if ($LASTEXITCODE -ne 0) {
    Write-Host "Database initialization failed!" -ForegroundColor Red
    exit 1
}

# Start backend server
Write-Host "Starting backend server..." -ForegroundColor Green
$backendPath = Join-Path $scriptPath "backend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$backendPath'; npm start"

# Wait for backend to start
Write-Host "Waiting for backend to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Start frontend server
Write-Host "Starting frontend server..." -ForegroundColor Green
$frontendPath = Join-Path $scriptPath "frontend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$frontendPath'; npm start"

Write-Host "`nServers started!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Backend: http://localhost:3001" -ForegroundColor Cyan
Write-Host "Login with username: admin, password: admin" -ForegroundColor Yellow 