param(
  [int]$Port = 5173,
  [string]$TunnelName = "mi-comunicador"
)

$ErrorActionPreference = "Stop"
$devtunnelPath = "$env:LOCALAPPDATA\Microsoft\WinGet\Links\devtunnel.exe"
if (-not (Test-Path $devtunnelPath)) {
  throw "No se encontro devtunnel.exe en $devtunnelPath"
}

# Publica el tunel estable. Mantener esta terminal abierta.
& $devtunnelPath host $TunnelName
