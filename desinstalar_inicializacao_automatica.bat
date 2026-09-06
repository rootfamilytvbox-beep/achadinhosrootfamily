@echo off
title Desativar Robo Shopee Automatico
chcp 65001 > nul
cls

echo ================================================================
echo   DESATIVAR ROBÔ SHOPEE AUTOMÁTICO DO WINDOWS
echo ================================================================
echo.

schtasks /delete /tn "RoboShopeeAutonomo" /f

if %ERRORLEVEL% equ 0 (
    echo.
    echo [SUCESSO] O Robô automático foi removido do Agendador do Windows.
) else (
    echo.
    echo [AVISO] Nenhuma tarefa encontrada ou permissão necessária.
)

echo.
pause
