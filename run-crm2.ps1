param(
  [switch]$BackendOnly,
  [switch]$FrontendOnly
)

$projectRoot = "D:\projects 2\crm2"
$backendDir  = Join-Path $projectRoot "backend"
$frontendDir = Join-Path $projectRoot "frontend"

if (-not $BackendOnly) {
  Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd `"$frontendDir`"; npm run dev"
  )
}

if (-not $FrontendOnly) {
  Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd `"$backendDir`"; npm run dev"
  )
}

if ($BackendOnly -and $FrontendOnly) {
  Write-Host "Both switches specified; starting both backend and frontend." -ForegroundColor Yellow
}
