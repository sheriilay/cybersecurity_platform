@echo off
echo Starting Cybersecurity Platform...

REM Get the script directory
set "SCRIPT_DIR=%~dp0"

REM Check if .env file exists
if not exist "%SCRIPT_DIR%backend\.env" (
    echo Creating .env file...
    (
        echo # Server Configuration
        echo PORT=3000
        echo NODE_ENV=development
        echo.
        echo # Database Configuration
        echo DB_TYPE=postgres
        echo DB_HOST=localhost
        echo DB_PORT=5432
        echo DB_USER=postgres
        echo DB_PASSWORD=admin
        echo DB_NAME=cybersecurity_platform
        echo.
        echo # JWT Configuration
        echo JWT_SECRET=cybersec_platform_jwt_secret_key
        echo JWT_EXPIRATION=15m
        echo JWT_REFRESH_SECRET=cybersec_platform_refresh_secret_key
        echo JWT_REFRESH_EXPIRATION=7d
        echo.
        echo # Frontend URL
        echo FRONTEND_URL=http://localhost:5000
        echo.
        echo # Bcrypt Configuration
        echo BCRYPT_ROUNDS=10
    ) > "%SCRIPT_DIR%backend\.env"
    echo .env file created successfully
)

REM Initialize database
echo Initializing database...
cd "%SCRIPT_DIR%backend"
call node init-db.js
if errorlevel 1 (
    echo Database initialization failed!
    exit /b 1
)

REM Start backend server
echo Starting backend server...
start "Backend Server" cmd /k "cd /d "%SCRIPT_DIR%backend"; npm start"

REM Wait for backend to start
echo Waiting for backend to start...
timeout /t 10 /nobreak

REM Start frontend server
echo Starting frontend server...
start "Frontend Server" cmd /k "cd /d "%SCRIPT_DIR%frontend"; npm start"

echo.
echo Servers started!
echo Frontend: http://localhost:5000
echo Backend: http://localhost:3000
echo Login with username: admin, password: admin 
