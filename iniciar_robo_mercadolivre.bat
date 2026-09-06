@echo off
chcp 65001 >nul
title Robô Mercado Livre Afiliados
color 0A

echo.
echo =====================================================================
echo   ROBO MERCADO LIVRE AFILIADOS - GARIMPO AUTOMATICO 50-70%% OFF
echo =====================================================================
echo.
echo  Iniciando o robo...
echo  Pressione Ctrl+C para encerrar a qualquer momento.
echo.

cd /d "%~dp0"
python bot_mercadolivre.py

echo.
echo =====================================================================
echo  Robo encerrado.
echo =====================================================================
pause
