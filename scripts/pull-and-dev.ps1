<#
.SYNOPSIS
    Pull latest code + launch Tauri dev (one-shot).
    Windows-native PowerShell. Double-click via pull-and-dev.bat.

.DESCRIPTION
    Combines git pull + full Tauri dev loop into one command.
    Use this when you want to sync from WSL side and immediately
    verify the full app on Windows.

    Steps:
      1. git pull origin develop
      2. Forward all args to dev.ps1 (which handles ports, cargo target, etc.)

.EXAMPLE
    PS> .\scripts\pull-and-dev.ps1
    PS> .\scripts\pull-and-dev.ps1 -Reinstall
#>
[CmdletBinding()]
param(
    [switch]$Reinstall
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# ---- 1. git pull ----
Write-Host "[pull-and-dev] git pull origin develop ..." -ForegroundColor Cyan
git pull origin develop
if ($LASTEXITCODE -ne 0) {
    Write-Error "git pull failed — resolve conflicts or network issue first."
}

# ---- 2. forward to dev.ps1 ----
$devPs1 = Join-Path $ScriptDir "dev.ps1"
if (-not (Test-Path $devPs1)) {
    Write-Error "dev.ps1 not found at $devPs1 — is this the Mindtap repo?"
}

$argsList = @()
if ($Reinstall) { $argsList += "-Reinstall" }

& $devPs1 @argsList
