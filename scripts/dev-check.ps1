$ErrorActionPreference = 'Stop'

$crmBackend   = "D:\projects 2\crm2\backend"
$pwaRoot      = "C:\Users\M S I\Desktop\pwa crm\dopamine-pwa"
$orchestrator = "D:\ai-orchestrator"

function Run-Step($title, $path, $command, $args) {
    Write-Host ""
    Write-Host "=== $title ===" -ForegroundColor Cyan
    Write-Host "cd $path" -ForegroundColor DarkGray
    Write-Host "$command $($args -join ' ')" -ForegroundColor DarkGray

    Set-Location $path
    & $command @args
    $code = $LASTEXITCODE

    if ($code -ne 0) {
        Write-Host "Step FAILED ($title) with exit code $code" -ForegroundColor Red
        exit $code
    }

    Write-Host "Step OK ($title)" -ForegroundColor Green
}

# 1) CRM2 backend tests
Run-Step "CRM2 backend: npm test" $crmBackend "npm" @("test")

# 2) PWA: test + lint + build
Run-Step "PWA: npm test"         $pwaRoot "npm" @("test")
Run-Step "PWA: npm run lint"     $pwaRoot "npm" @("run", "lint")
Run-Step "PWA: npm run build"    $pwaRoot "npm" @("run", "build")

# 3) Orchestrator monitor (dry run, no real email)
Run-Step "AI Orchestrator: npm run monitor -- --dry-run" $orchestrator "npm" @("run", "monitor", "--", "--dry-run")

Write-Host ""
Write-Host "All dev-check steps finished successfully." -ForegroundColor Green
exit 0
