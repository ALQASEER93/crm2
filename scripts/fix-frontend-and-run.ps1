# fix-frontend-and-run.ps1
param(
  [switch]$InstallOnly
)

$frontendPath = "D:\projects 2\crm2\frontend"
Write-Host ">>> Working in $frontendPath"
Set-Location $frontendPath

Write-Host ">>> Killing any node/vite/esbuild processes (if exist)..."
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

if (-not $InstallOnly) {
  if (Test-Path .\node_modules) {
    Write-Host ">>> Renaming node_modules -> node_modules_old"
    Rename-Item node_modules node_modules_old -ErrorAction SilentlyContinue
  }

  if (Test-Path .\node_modules_old) {
    Write-Host ">>> Deleting node_modules_old..."
    Remove-Item -Recurse -Force .\node_modules_old -ErrorAction SilentlyContinue
  }

  if (Test-Path .\package-lock.json) {
    Write-Host ">>> Deleting package-lock.json..."
    Remove-Item .\package-lock.json -ErrorAction SilentlyContinue
  }
}

Write-Host ">>> Running npm install..."
npm install

Write-Host ">>> Starting Vite dev server (npm run dev)..."
npm run dev
