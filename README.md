### PowerShell helpers

Daily monitor (real email):

```powershell
cd "D:\ai-orchestrator"
powershell -ExecutionPolicy Bypass -File "D:\ai-orchestrator\scripts\run-daily.ps1"
```

Daily monitor (dry-run, no real email):

```powershell
cd "D:\ai-orchestrator"
powershell -ExecutionPolicy Bypass -File "D:\ai-orchestrator\scripts\run-daily.ps1" -DryRun
```

Dev-check (CRM2 + PWA + monitor):

```powershell
cd "D:\ai-orchestrator"
powershell -ExecutionPolicy Bypass -File "D:\ai-orchestrator\scripts\dev-check.ps1"
```
