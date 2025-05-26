# Verify and fix database setup
Write-Host "Verifying database setup..." -ForegroundColor Green

# Check if PostgreSQL is installed
$pgService = Get-Service postgresql* -ErrorAction SilentlyContinue
if (-not $pgService) {
    Write-Host "PostgreSQL service not found. Please install PostgreSQL first." -ForegroundColor Red
    exit 1
}

# Check if PostgreSQL is running
if ($pgService.Status -ne 'Running') {
    Write-Host "PostgreSQL service is not running. Attempting to start..." -ForegroundColor Yellow
    Start-Service $pgService
    Start-Sleep -Seconds 5
}

# Check if psql is in PATH
try {
    $psqlVersion = & psql --version
    Write-Host "PostgreSQL version: $psqlVersion" -ForegroundColor Green
} catch {
    Write-Host "psql not found in PATH. Adding PostgreSQL bin to PATH..." -ForegroundColor Yellow
    $pgPath = "C:\Program Files\PostgreSQL\16\bin"
    $env:Path = "$pgPath;$env:Path"
}

# Check database connection
try {
    $dbName = "cybersecurity_platform"
    $result = & psql -U postgres -c "SELECT 1" -d $dbName 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Successfully connected to database '$dbName'" -ForegroundColor Green
    } else {
        Write-Host "Database '$dbName' does not exist. Creating..." -ForegroundColor Yellow
        & psql -U postgres -c "CREATE DATABASE $dbName"
    }
} catch {
    Write-Host "Error connecting to database: $_" -ForegroundColor Red
    exit 1
}

# Check and create tables
Write-Host "Checking database tables..." -ForegroundColor Green
$tables = @("users", "user_sessions", "security_logs")
foreach ($table in $tables) {
    $result = & psql -U postgres -d $dbName -c "SELECT 1 FROM information_schema.tables WHERE table_name = '$table'" 2>&1
    if ($LASTEXITCODE -ne 0 -or -not $result) {
        Write-Host "Table '$table' does not exist. Running initialization script..." -ForegroundColor Yellow
        & psql -U postgres -d $dbName -f "backend/src/database/init.sql"
        break
    }
}

# Check for admin user
$adminExists = & psql -U postgres -d $dbName -c "SELECT 1 FROM users WHERE username = 'admin'" 2>&1
if ($LASTEXITCODE -ne 0 -or -not $adminExists) {
    Write-Host "Admin user not found. Creating..." -ForegroundColor Yellow
    $hashedPassword = & node -e "const bcrypt = require('bcrypt'); bcrypt.hash('admin', 10).then(hash => console.log(hash))"
    & psql -U postgres -d $dbName -c "INSERT INTO users (username, email, password, role) VALUES ('admin', 'admin@example.com', '$hashedPassword', 'admin')"
}

Write-Host "Database verification complete!" -ForegroundColor Green
Write-Host "You can now start the application using: powershell -ExecutionPolicy Bypass -File start-servers.ps1" -ForegroundColor Cyan 