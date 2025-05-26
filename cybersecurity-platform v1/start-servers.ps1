# Start both frontend and backend servers
Write-Host "Starting Cybersecurity Platform servers..." -ForegroundColor Green

# Start backend server
Write-Host "Starting backend server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'backend'; npm run dev"

# Wait a moment for backend to initialize
Start-Sleep -Seconds 3

# Start frontend server
Write-Host "Starting frontend server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'frontend'; npm start"

Write-Host "Servers started successfully!" -ForegroundColor Green
Write-Host "Backend running on: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Frontend running on: http://localhost:5000" -ForegroundColor Cyan 