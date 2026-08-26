@echo off
setlocal EnableExtensions
chcp 65001 >nul
cd /d "%~dp0"

where node.exe >nul 2>nul
if errorlevel 1 (
  echo 此 App 需要 Node.js。請先安裝 Node.js LTS。
  pause
  exit /b 1
)

echo 正在同步 Web 版本...
node.exe build.js
if errorlevel 1 (
  echo Web 打包失敗。
  pause
  exit /b 1
)

echo 正在啟動三國：群英再起，瀏覽器會自動開啟。
node.exe serve-local.js 8788
if errorlevel 1 (
  echo 本機伺服器啟動失敗，請查看上方錯誤訊息。
  pause
  exit /b 1
)

pause
exit /b 0
