[CmdletBinding()]
param(
  [switch]$SkipInstall
)

$ErrorActionPreference = "Stop"
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $projectRoot
. (Join-Path $PSScriptRoot "use-android-jdk.ps1")
Use-AndroidJdk

function Require-Command([string]$name) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    throw "Missing $name. Install Node.js LTS and npm first."
  }
}

function Invoke-Checked([string]$command, [string[]]$arguments) {
  & $command @arguments
  if ($LASTEXITCODE -ne 0) {
    throw "Command failed ($LASTEXITCODE): $command $($arguments -join ' ')"
  }
}

Require-Command "node"
Require-Command "npm"

if (-not $SkipInstall -and -not (Test-Path (Join-Path $projectRoot "node_modules"))) {
  Invoke-Checked "npm" @("install")
}

if (-not (Test-Path (Join-Path $projectRoot "android"))) {
  throw "Android wrapper is missing. Run SETUP_ANDROID.bat first."
}

Write-Host "Building a test APK with Google test ads and Android debug signing."
Write-Host "This APK is for local testing only. Do not upload it to an app store." -ForegroundColor Yellow
Invoke-Checked "node" @("build.js")
Invoke-Checked "npx" @("cap", "sync", "android")

$gradle = Join-Path $projectRoot "android/gradlew.bat"
if (-not (Test-Path $gradle)) {
  throw "Android Gradle wrapper is missing: $gradle"
}

Push-Location (Join-Path $projectRoot "android")
try {
  Invoke-Checked $gradle @("assembleDebug")
}
finally {
  Pop-Location
}

$apkSource = Join-Path $projectRoot "android/app/build/outputs/apk/debug/app-debug.apk"
if (-not (Test-Path $apkSource)) {
  throw "Debug APK was not generated: $apkSource"
}

$buildsDir = Join-Path $projectRoot "builds"
New-Item -ItemType Directory -Force -Path $buildsDir | Out-Null
$apkTarget = Join-Path $buildsDir "sanguo-qunying-reborn-debug.apk"
Copy-Item -LiteralPath $apkSource -Destination $apkTarget -Force

Write-Host "Test APK complete:"
Get-Item -LiteralPath $apkTarget | Select-Object FullName, Length, LastWriteTime
