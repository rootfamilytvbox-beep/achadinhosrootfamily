@echo off
title Ativar Robo Shopee 100%% Automatico no Windows
chcp 65001 > nul
cls

echo ================================================================
echo   INSTALADOR DO ROBÔ SHOPEE - EXECUÇÃO 100%% AUTOMÁTICA
echo ================================================================
echo.
echo Este instalador configura o Agendador de Tarefas do Windows para
echo que o robô seja executado sozinho a cada 30 minutos em segundo
echo plano, de forma invisivel e sem voce precisar clicar em nada!
echo.

set TASK_NAME=RoboShopeeAutonomo
set SCRIPT_PATH=%~dp0bot_shopee_autopilot.py
set PYTHON_EXE=C:\Python314\pythonw.exe

if not exist "%PYTHON_EXE%" (
    set PYTHON_EXE=pythonw.exe
)

echo Registrando tarefa no Windows...
schtasks /create /tn "%TASK_NAME%" /tr "\"%PYTHON_EXE%\" \"%SCRIPT_PATH%\" --once" /sc minute /mo 30 /f

if %ERRORLEVEL% equ 0 (
    echo.
    echo ================================================================
    echo [SUCESSO] O Robô Shopee foi configurado com sucesso no Windows!
    echo ================================================================
    echo - Ele roda sozinho a cada 30 minutos em segundo plano (invisível).
    echo - Não abre janela preta e não precisa de nenhum clique.
    echo - Inicia automaticamente sempre que você ligar o computador.
    echo ================================================================
) else (
    echo.
    echo [AVISO] Se solicitou permissao de Administrador, clique com o botao
    echo direito neste arquivo e escolha 'Executar como Administrador'.
)

echo.
pause
