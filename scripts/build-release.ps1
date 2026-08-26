[CmdletBinding()]
param(
  [string]$VersionName = "",
  [int]$VersionCode = 0,
  [switch]$SkipInstall,
  [switch]$SkipApk
)

$ErrorActionPreference = "Stop"
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $projectRoot

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

function Get-NextVersionName([string]$currentName) {
  if ($currentName -match '^([0-9]+)[.]([0-9]+)[.]([0-9]+)$') {
    return "$($Matches[1]).$($Matches[2]).$([int]$Matches[3] + 1)"
  }
  return "1.0.0"
}

function Update-AndroidVersion {
  $gradleFile = Join-Path $projectRoot "android/app/build.gradle"
  if (-not (Test-Path $gradleFile)) { return "0.1.0" }
  $content = Get-Content -Raw -Encoding UTF8 $gradleFile
  $currentCode = 0
  if ($content -match 'versionCode[ ]+([0-9]+)') { $currentCode = [int]$Matches[1] }
  $currentName = "1.0.0"
  if ($content -match 'versionName[ ]+"([^"]+)"') { $currentName = $Matches[1] }
  $finalName = if ($VersionName) { $VersionName } else { Get-NextVersionName $currentName }
  $finalCode = if ($VersionCode -gt 0) { $VersionCode } else { $currentCode + 1 }
  $content = $content -replace 'versionCode[ ]+[0-9]+', "versionCode $finalCode"
  $content = $content -replace 'versionName[ ]+"[^"]+"', ('versionName "' + $finalName + '"')
  [System.IO.File]::WriteAllText($gradleFile, $content, (New-Object System.Text.UTF8Encoding($false)))
  Write-Host "Android version: $finalName (code $finalCode)"
  return $finalName
}

Require-Command "node"
Require-Command "npm"

if (-not $env:TAOYUAN_ADMOB_APP_ID -or -not $env:TAOYUAN_ADMOB_REWARDED_ID) {
  throw "Set TAOYUAN_ADMOB_APP_ID and TAOYUAN_ADMOB_REWARDED_ID before a release build."
}

if (-not $SkipInstall -and -not (Test-Path (Join-Path $projectRoot "node_modules"))) {
  npm install
}

if (-not (Test-Path (Join-Path $projectRoot "android"))) {
  throw "Android wrapper is missing. Run npm install, then npx cap add android."
}

$versionLabel = Update-AndroidVersion
Invoke-Checked "node" @("build.js", "--release")
Invoke-Checked "npx" @("cap", "sync", "android")

$gradle = Join-Path $projectRoot "android/gradlew.bat"
if (-not (Test-Path $gradle)) {
  throw "Android Gradle wrapper is missing: $gradle"
}

Write-Host "Building release AAB. Signing must be provided by the release environment; this script never creates a default key."
Push-Location (Join-Path $projectRoot "android")
try {
  Invoke-Checked $gradle @("bundleRelease")
  if (-not $SkipApk) { Invoke-Checked $gradle @("assembleRelease") }
}
finally {
  Pop-Location
}

$buildsDir = Join-Path $projectRoot "builds"
New-Item -ItemType Directory -Force -Path $buildsDir | Out-Null
$aabSource = Join-Path $projectRoot "android/app/build/outputs/bundle/release/app-release.aab"
if (-not (Test-Path $aabSource)) { throw "Release AAB was not generated: $aabSource" }
$aabTarget = Join-Path $buildsDir ("sanguo-qunying-reborn-" + $versionLabel + "-release.aab")
Copy-Item -LiteralPath $aabSource -Destination $aabTarget -Force

$apkTarget = $null
if (-not $SkipApk) {
  $apkSource = Join-Path $projectRoot "android/app/build/outputs/apk/release/app-release.apk"
  if (-not (Test-Path $apkSource)) {
    $apkSource = Join-Path $projectRoot "android/app/build/outputs/apk/release/app-release-unsigned.apk"
  }
  if (Test-Path $apkSource) {
    $apkTarget = Join-Path $buildsDir ("sanguo-qunying-reborn-" + $versionLabel + "-release.apk")
    Copy-Item -LiteralPath $apkSource -Destination $apkTarget -Force
  }
}

Write-Host "Build complete. Output files:"
Get-ChildItem @($aabTarget, $apkTarget) -ErrorAction SilentlyContinue | Select-Object FullName, Length, LastWriteTime
