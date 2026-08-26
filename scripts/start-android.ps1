[CmdletBinding()]
param(
  [switch]$OpenAndroidStudio,
  [switch]$LiveReload
)

$ErrorActionPreference = "Stop"
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $projectRoot
. (Join-Path $PSScriptRoot "use-android-jdk.ps1")
Use-AndroidJdk

if (-not (Get-Command node -ErrorAction SilentlyContinue) -or -not (Get-Command npx -ErrorAction SilentlyContinue)) {
  throw "Node.js or npx is missing. Install Node.js LTS first."
}
if (-not (Test-Path (Join-Path $projectRoot "android"))) {
  throw "Android wrapper is missing. Run npm install, then npx cap add android."
}

node build.js
if ($LASTEXITCODE -ne 0) { throw "Web build failed." }
npx cap sync android
if ($LASTEXITCODE -ne 0) { throw "Capacitor sync failed." }

if ($OpenAndroidStudio) {
  Write-Host "Opening the Android project in Android Studio."
  & npx cap open android
  if ($LASTEXITCODE -ne 0) { throw "Android Studio could not be opened." }
  exit 0
}

$runArgs = @("cap", "run", "android")
if ($LiveReload) { $runArgs += @("--livereload", "--external") }
Write-Host "Installing and launching the Android app. Check USB debugging or the emulator."
& npx @runArgs
if ($LASTEXITCODE -ne 0) {
  throw "Android launch failed. Check adb, the emulator, and Android SDK settings."
}
