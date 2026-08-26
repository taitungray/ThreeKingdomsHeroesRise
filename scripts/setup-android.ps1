[CmdletBinding()]
param(
  [switch]$SkipInstall
)

$ErrorActionPreference = "Stop"
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $projectRoot

if (-not (Get-Command node -ErrorAction SilentlyContinue) -or -not (Get-Command npm -ErrorAction SilentlyContinue)) {
  throw "Node.js and npm are required."
}
if (-not $SkipInstall) {
  npm install
  if ($LASTEXITCODE -ne 0) { throw "npm install failed." }
}
if (-not (Test-Path (Join-Path $projectRoot "android"))) {
  npx cap add android
  if ($LASTEXITCODE -ne 0) { throw "npx cap add android failed." }
} else {
  Write-Host "Android wrapper already exists; leaving it unchanged."
}
npx cap sync android
if ($LASTEXITCODE -ne 0) { throw "Capacitor Android sync failed." }
Write-Host "Android wrapper is ready. Configure signing and AdMob IDs before release."
