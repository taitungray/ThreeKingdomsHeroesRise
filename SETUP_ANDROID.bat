@echo off
setlocal EnableExtensions
chcp 65001 >nul
cd /d "%~dp0"

set "SETUP_SCRIPT=%~dp0scripts\setup-android.ps1"
if not exist "%SETUP_SCRIPT%" (
  echo 找不到 Android 初始化腳本：%SETUP_SCRIPT%
  pause
  exit /b 1
)

powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%SETUP_SCRIPT%"
if errorlevel 1 (
  echo Android 初始化失敗，請查看上方錯誤訊息。
  pause
  exit /b 1
)

pause
exit /b 0
