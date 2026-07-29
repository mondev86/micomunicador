@echo off
setlocal

powershell -ExecutionPolicy Bypass -File ".\scripts\start-dev-and-stable-tunnel.ps1" -Port 5173 -TunnelName "mi-comunicador"

endlocal
