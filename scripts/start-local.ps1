param()

$root = "C:\Users\Sai Badrishwar S S\INVENTRA"

# Kill any existing node processes
Try {
    Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
} Catch {}

# Start backend (node server.js) in backend folder
Write-Output "Starting backend..."
Start-Process -FilePath node -ArgumentList 'server.js' -WorkingDirectory "$root\backend" -WindowStyle Hidden

# Start frontend static server using npx http-server serving ./dist on port 5173
Write-Output "Starting frontend static server (http-server)..."
Start-Process -FilePath npx -ArgumentList 'http-server','./dist','-p','5173','-a','127.0.0.1','-c-1' -WorkingDirectory "$root\frontend" -WindowStyle Hidden

Start-Sleep -Seconds 2

# Check backend health
Write-Output "Checking backend health (http://127.0.0.1:4000/health)"
Try {
    $b = Invoke-RestMethod -Uri 'http://127.0.0.1:4000/health' -TimeoutSec 5
    Write-Output "BACKEND_OK: $($b | ConvertTo-Json -Depth 2)"
} Catch {
    Write-Output "BACKEND_ERR: $($_.Exception.Message)"
}

# Check frontend
Write-Output "Checking frontend (http://127.0.0.1:5173/)"
Try {
    $h = Invoke-WebRequest -Uri 'http://127.0.0.1:5173/' -UseBasicParsing -TimeoutSec 5
    Write-Output "FRONTEND_OK: status $($h.StatusCode)"
} Catch {
    Write-Output "FRONTEND_ERR: $($_.Exception.Message)"
}

Write-Output "Done. If services are not reachable, check the printed errors above."
