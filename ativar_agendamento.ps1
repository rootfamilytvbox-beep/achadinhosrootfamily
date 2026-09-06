$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$scriptPath = Join-Path $scriptDir "bot_shopee_autopilot.py"
$pythonw = "C:\Python314\pythonw.exe"

if (-not (Test-Path $pythonw)) {
    $pythonw = (Get-Command pythonw -ErrorAction SilentlyContinue).Source
}

Write-Host "Configurando Robô Shopee para rodar a cada 30 minutos em segundo plano..." -ForegroundColor Cyan

$action = New-ScheduledTaskAction -Execute $pythonw -Argument "`"$scriptPath`" --once"
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 30) -RepetitionDuration (New-TimeSpan -Days 3650)
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

Register-ScheduledTask -TaskName "RoboShopeeAutonomo" -Action $action -Trigger $trigger -Settings $settings -Force | Out-Null

Write-Host "✅ SUCESSO: O Robô Shopee foi ativado no Windows!" -ForegroundColor Green
Write-Host "- Ele roda sozinho a cada 30 minutos em segundo plano (invisível)." -ForegroundColor Green
Write-Host "- Não abre janela e não precisa de nenhum clique." -ForegroundColor Green
