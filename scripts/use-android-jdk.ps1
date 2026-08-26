function Get-JavaMajorVersion([string]$javaHome) {
  $releaseFile = Join-Path $javaHome "release"
  if (-not (Test-Path -LiteralPath $releaseFile)) { return 0 }
  $releaseContent = Get-Content -Raw -Encoding UTF8 -LiteralPath $releaseFile
  if ($releaseContent -notmatch 'JAVA_VERSION="([0-9]+)(?:[.]([0-9]+))?') { return 0 }
  if ([int]$Matches[1] -eq 1 -and $Matches[2]) { return [int]$Matches[2] }
  return [int]$Matches[1]
}

function Use-AndroidJdk {
  $candidateHomes = New-Object System.Collections.Generic.List[string]
  if ($env:JAVA_HOME) { $candidateHomes.Add($env:JAVA_HOME) }

  $programRoots = @(
    $env:ProgramFiles,
    ${env:ProgramW6432},
    "C:\Program Files",
    "D:\Program Files"
  ) | Where-Object { $_ } | Select-Object -Unique

  foreach ($programRoot in $programRoots) {
    $candidateHomes.Add((Join-Path $programRoot "Android/Android Studio/jbr"))
    foreach ($vendorPath in @("Microsoft", "Java", "Eclipse Adoptium")) {
      $vendorRoot = Join-Path $programRoot $vendorPath
      Get-ChildItem -LiteralPath $vendorRoot -Directory -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -like "jdk-17*" -or $_.Name -like "jdk17*" } |
        ForEach-Object { $candidateHomes.Add($_.FullName) }
    }
  }

  foreach ($candidateHome in $candidateHomes | Select-Object -Unique) {
    $javaExe = Join-Path $candidateHome "bin/java.exe"
    if ((Test-Path -LiteralPath $javaExe) -and (Get-JavaMajorVersion $candidateHome) -eq 17) {
      $env:JAVA_HOME = $candidateHome
      $env:Path = (Join-Path $candidateHome "bin") + ";" + $env:Path
      Write-Host "Using Android JDK 17: $candidateHome"
      return
    }
  }

  throw "JDK 17 is required. Install Android Studio or a JDK 17 distribution."
}
