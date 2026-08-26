@echo off
setlocal EnableExtensions
cd /d "%~dp0"

set "DEBUG_SCRIPT=%~dp0scripts\build-debug-apk.ps1"
set "RELEASE_SCRIPT=%~dp0scripts\build-release.ps1"

if not exist "%DEBUG_SCRIPT%" goto missing_script
if not exist "%RELEASE_SCRIPT%" goto missing_script

echo.
echo Three Kingdoms Heroes Rise - Android Build
echo.
echo [1] Test APK - Google test ads, debug signing, local testing only
echo [2] Release AAB and APK - your AdMob IDs and signing are required
echo.
choice /C 12 /N /M "Select build type [1/2]: "
if errorlevel 2 goto release_build
if errorlevel 1 goto debug_build
exit /b 1

:debug_build
echo.
echo Building test APK...
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%DEBUG_SCRIPT%"
if errorlevel 1 goto build_failed
goto build_complete

:release_build
echo.
echo Building release AAB and APK...
if defined TAOYUAN_ADMOB_APP_ID goto rewarded_id
set /P "TAOYUAN_ADMOB_APP_ID=Enter AdMob App ID: "

:rewarded_id
if defined TAOYUAN_ADMOB_REWARDED_ID goto run_release
set /P "TAOYUAN_ADMOB_REWARDED_ID=Enter AdMob Rewarded ID: "

:run_release
if not defined TAOYUAN_ADMOB_APP_ID goto missing_admob
if not defined TAOYUAN_ADMOB_REWARDED_ID goto missing_admob
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%RELEASE_SCRIPT%"
if errorlevel 1 goto build_failed
goto build_complete

:missing_admob
echo.
echo Release build cancelled: both AdMob IDs are required.
pause
exit /b 1

:missing_script
echo.
echo Android build script is missing from the scripts folder.
pause
exit /b 1

:build_failed
echo.
echo Build failed. Read the error message above.
pause
exit /b 1

:build_complete
if exist "%~dp0builds" start "" "%~dp0builds"
echo.
echo Build completed.
pause
exit /b 0
