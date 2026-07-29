param(
  [int]$Port = 5173,
  [string]$TunnelName = "mi-comunicador"
)

$ErrorActionPreference = "Stop"
$devtunnelPath = "$env:LOCALAPPDATA\Microsoft\WinGet\Links\devtunnel.exe"
if (-not (Test-Path $devtunnelPath)) {
  throw "No se encontro devtunnel.exe en $devtunnelPath"
}

# 1) Login interactivo (solo la primera vez)
& $devtunnelPath user login

# 2) Reutiliza un tunel existente por nombre o crea uno nuevo
$existing = & $devtunnelPath list | Select-String -Pattern $TunnelName -SimpleMatch | Select-Object -First 1
if (-not $existing) {
  & $devtunnelPath create $TunnelName --allow-anonymous
}

# 3) Asegura que el puerto exista en el tunel
# Nota: en versiones recientes de la CLI, el acceso anonimo se configura a nivel tunel.
try {
  $null = & $devtunnelPath port create $TunnelName -p $Port --protocol http 2>$null
  if ($LASTEXITCODE -ne 0) {
    Write-Host "El puerto $Port ya existia en el tunnel; se reutiliza." -ForegroundColor Yellow
  }
} catch {
  Write-Host "El puerto $Port ya existia en el tunnel; se reutiliza." -ForegroundColor Yellow
}

Write-Host "Tunnel preparado. Usa start-stable-devtunnel.ps1 para publicarlo." -ForegroundColor Green
