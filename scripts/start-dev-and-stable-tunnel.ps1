param(
  [int]$Port = 5173,
  [string]$TunnelName = "mi-comunicador"
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
$devtunnelPath = "$env:LOCALAPPDATA\Microsoft\WinGet\Links\devtunnel.exe"

if (-not (Test-Path $devtunnelPath)) {
  throw "No se encontro devtunnel.exe en $devtunnelPath"
}

# 1) Inicia Vite en una nueva terminal.
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$repoRoot'; npm run dev"

# 2) Asegura que el tunel y puerto existan.
& "$PSScriptRoot\create-stable-devtunnel.ps1" -Port $Port -TunnelName $TunnelName

# 3) Publica el tunel estable en esta misma terminal.
Write-Host "Publicando tunnel estable para http://localhost:$Port ..." -ForegroundColor Cyan
& $devtunnelPath host $TunnelName
