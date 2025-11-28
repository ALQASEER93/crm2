Param(
    [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

# Repo root = parent of "scripts" folder
$repoRoot = (Get-Item $PSScriptRoot).Parent.FullName
Set-Location $repoRoot

if ($DryRun) {
    $npmArgs = @('run', 'monitor', '--', '--dry-run')
    Write-Host "Running DAILY MONITOR (dry run)..." -ForegroundColor Cyan
} else {
    $npmArgs = @('run', 'monitor')
    Write-Host "Running DAILY MONITOR (real email)..." -ForegroundColor Cyan
}

Write-Host "cd $repoRoot" -ForegroundColor DarkGray
Write-Host "npm $($npmArgs -join ' ')" -ForegroundColor DarkGray

npm @npmArgs
$code = $LASTEXITCODE

if ($code -ne 0) {
    Write-Host "Daily monitor FAILED with exit code $code" -ForegroundColor Red
    exit $code
}

Write-Host "Daily monitor finished successfully." -ForegroundColor Green
exit 0
