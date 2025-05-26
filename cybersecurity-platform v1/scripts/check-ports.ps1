# Function to check if a port is in use
function Test-PortInUse {
    param($port)
    $connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    return $null -ne $connection
}

# Function to terminate process on a port
function Stop-ProcessOnPort {
    param($port)
    $processId = (Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue).OwningProcess
    if ($processId) {
        $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
        if ($process) {
            Write-Host "Terminating process $($process.ProcessName) (PID: $processId) on port $port"
            Stop-Process -Id $processId -Force
            return $true
        }
    }
    return $false
}

# Check and handle port 3000
Write-Host "Checking port 3000..."
if (Test-PortInUse -port 3000) {
    Write-Host "Port 3000 is in use."
    if (Stop-ProcessOnPort -port 3000) {
        Write-Host "Successfully terminated process on port 3000"
    } else {
        Write-Host "Failed to terminate process on port 3000"
    }
} else {
    Write-Host "Port 3000 is free"
}

# Check and handle port 3001
Write-Host "`nChecking port 3001..."
if (Test-PortInUse -port 3001) {
    Write-Host "Port 3001 is in use."
    if (Stop-ProcessOnPort -port 3001) {
        Write-Host "Successfully terminated process on port 3001"
    } else {
        Write-Host "Failed to terminate process on port 3001"
    }
} else {
    Write-Host "Port 3001 is free"
}

Write-Host "`nPort check complete." 