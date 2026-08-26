@echo off
setlocal EnableExtensions
chcp 65001 >nul
cd /d "%~dp0"

powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-android.ps1"
if errorlevel 1 (
  echo Android App 啟動失敗，請查看上方錯誤訊息。
  pause
  exit /b 1
)

pause
exit /b 0
