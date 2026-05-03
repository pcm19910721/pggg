param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$RemainingArgs
)

$ErrorActionPreference = "Stop"

function Convert-ToWslPath {
  param([string]$WindowsPath)

  $fullPath = [System.IO.Path]::GetFullPath($WindowsPath)
  if ($fullPath -match '^\\\\wsl(?:\.localhost|\$)\\[^\\]+\\?(.*)$') {
    $rest = $matches[1] -replace '\\', '/'
    if ([string]::IsNullOrEmpty($rest)) {
      return "/"
    }
    return "/$rest"
  }

  if ($fullPath -match '^([A-Za-z]):\\?(.*)$') {
    $drive = $matches[1].ToLowerInvariant()
    $rest = $matches[2] -replace '\\', '/'
    if ([string]::IsNullOrEmpty($rest)) {
      return "/mnt/$drive"
    }
    return "/mnt/$drive/$rest"
  }

  throw "Cannot convert Windows path to WSL path: $fullPath"
}

function Quote-Bash {
  param([string]$Value)

  return "'" + ($Value -replace "'", "'\''") + "'"
}

function Test-WslExecutable {
  param([string]$Path)

  if ([string]::IsNullOrWhiteSpace($Path)) {
    return $false
  }

  & wsl.exe bash -lc "test -x $(Quote-Bash $Path)" | Out-Null
  return $LASTEXITCODE -eq 0
}

function Resolve-WslHarness {
  if (-not [string]::IsNullOrWhiteSpace($env:GSTACK_HARNESS_WSL)) {
    if (Test-WslExecutable $env:GSTACK_HARNESS_WSL) {
      return $env:GSTACK_HARNESS_WSL
    }
    throw "GSTACK_HARNESS_WSL is set but is not executable in WSL: $env:GSTACK_HARNESS_WSL"
  }

  $candidates = New-Object System.Collections.Generic.List[string]

  try {
    $scriptHarness = Join-Path $PSScriptRoot "pcm-harness"
    $candidates.Add((Convert-ToWslPath -WindowsPath $scriptHarness))
  } catch {
  }

  $pathHarness = [string](& wsl.exe bash -lc "command -v pcm-harness 2>/dev/null || true")
  $pathHarness = $pathHarness.Trim()
  if (-not [string]::IsNullOrWhiteSpace($pathHarness)) {
    $candidates.Add($pathHarness)
  }

  foreach ($candidate in $candidates) {
    if (Test-WslExecutable $candidate) {
      return $candidate
    }
  }

  throw "Cannot find executable pcm-harness in WSL. Put pcm-harness on the WSL PATH or set GSTACK_HARNESS_WSL=/path/to/pcm-harness."
}

if (-not (Get-Command wsl.exe -ErrorAction SilentlyContinue)) {
  Write-Error "wsl.exe was not found. Install or enable WSL, then run pcm-harness again."
  exit 1
}

$wslProjectDir = Convert-ToWslPath -WindowsPath $PWD.ProviderPath
$wslHarness = Resolve-WslHarness
$argText = ""

if ($RemainingArgs.Count -gt 0) {
  $argText = " " + (($RemainingArgs | ForEach-Object { Quote-Bash $_ }) -join " ")
}

$command = "cd $(Quote-Bash $wslProjectDir) && exec $(Quote-Bash $wslHarness)$argText"

& wsl.exe bash -ic $command
exit $LASTEXITCODE
