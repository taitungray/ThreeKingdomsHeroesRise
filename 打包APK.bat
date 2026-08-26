@echo off
setlocal EnableExtensions
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo Starting Three Kingdoms: Qunying Reborn Android release build.
echo This requires your own AdMob IDs, Android wrapper and signing configuration.
powershell -ExecutionPolicy Bypass -File "%~dp0scriptsuild-release.ps1"
if errorlevel 1 (
  echo Build failed. Please read the error above.
  pause
  exit /b 1
)

if exist "%~dp0builds" start "" "%~dp0builds"
echo Build process finished.
pause
