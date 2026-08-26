@echo off
setlocal EnableExtensions
chcp 65001 >nul
cd /d "%~dp0"

powershell -ExecutionPolicy Bypass -File "%~dp0scriptsstart-android.ps1"
pause
