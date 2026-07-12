<#
.SYNOPSIS
    One-click Tauri dev launcher (Windows-native PowerShell).
    Reaches into WSL via \\wsl$\<distro>\... UNC path when the project lives there.

.DESCRIPTION
    Why this script exists:
      - WSL terminal is fine for daily dev (code, git, vitest, Claude Code / OpenCode)
      - But Tauri dev MUST run from Windows side: WebView2 is a Windows-native
        process and is where you debug transparent / overlay / native-context-menu bugs.
      - This script lets you trigger the full dev loop from Windows Explorer
        or PowerShell without context-switching out of WSL for that step.

    Launcher priority:
      1. `cargo tauri dev` (preferred) -- one install, all platforms, no
         @tauri-apps/cli Windows-vs-Linux binary drift to manage.
      2. `npm run tauri dev` (fallback) -- requires Windows-side `npm install`
         so the right @tauri-apps/cli-<platform>-<arch> subpackage gets fetched.

    Behavior:
      - Finds project root by walking up to package.json
      - Moves CARGO_TARGET_DIR onto Windows fs to dodge \\wsl$ slowness
      - Cleans stale Vite HMR ports (1420/1421) on Windows side
      - Exits cleanly on Ctrl+C (cancels cargo / node cleanly)

.PARAMETER Reinstall
    Run `npm install` (if missing) and `cargo fetch` before launching.

.EXAMPLE
    PS> .\scripts\dev.ps1
    PS> .\scripts\dev.ps1 -Reinstall

.NOTES
    File encoding: ASCII-safe on purpose (PowerShell 5.1 ships with Win11).
    For prose / context read scripts\README.md instead.
#>
[CmdletBinding()]
param(
    [switch]$Reinstall
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# ---------------------------------------------------------------------------
# Guard: never run inside WSL -- this script only makes sense on Windows side.
# ---------------------------------------------------------------------------
if ($env:WSL_DISTRO_NAME -or $env:WSLENV) {
    Write-Host "dev.ps1 must run on Windows-native PowerShell, not inside WSL." -ForegroundColor Red
    Write-Host "Inside WSL, use 'npm run tauri dev' directly." -ForegroundColor Yellow
    Write-Host "On Windows, double-click scripts\dev.bat or run '.\scripts\dev.ps1'." -ForegroundColor Yellow
    exit 1
}

# ---------------------------------------------------------------------------
# Locate project root by walking up to package.json
# ---------------------------------------------------------------------------
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

function Find-ProjectRoot {
    param([string]$Dir)
    while ($Dir) {
        if (Test-Path (Join-Path $Dir "package.json") -PathType Leaf) { return $Dir }
        $parent = Split-Path -Parent $Dir
        if ($parent -eq $Dir) { return $null }
        $Dir = $parent
    }
}

$ProjectRoot = Find-ProjectRoot $ScriptDir
if (-not $ProjectRoot) {
    Write-Error "package.json not found above $ScriptDir -- is this the Mindtap repo?"
}

Set-Location $ProjectRoot
$Host.UI.RawUI.WindowTitle = "Mindtap Dev @ $ProjectRoot"

function Log([string]$Msg, [string]$Color = "Cyan") {
    Write-Host "[dev] $Msg" -ForegroundColor $Color
}

Log "project: $ProjectRoot" DarkGray

# ---------------------------------------------------------------------------
# WSL sniffing (informational): if project lives under \\wsl$ we surface that.
# ---------------------------------------------------------------------------
$wslMatch = [regex]::Match($ProjectRoot, '^\\\\wsl\$\\([^\\]+)\\(.*)$')
if ($wslMatch.Success) {
    # [regex]::Match() returns a Match object -- use Groups[], NOT the $Matches
    # automatic variable (that one is only set by the -match operator).
    $distro = $wslMatch.Groups[1].Value
    $sub    = $wslMatch.Groups[2].Value -replace '\\','/'
    Log ("WSL distro: {0}    subpath: /{1}" -f $distro, $sub) DarkGray
    Log "WebView2 will spawn natively on Windows; Vite + cargo cross the WSL UNC boundary." DarkGray
}

# ---------------------------------------------------------------------------
# Tool detection
# ---------------------------------------------------------------------------
$haveCargo = [bool](Get-Command cargo -ErrorAction SilentlyContinue)
$haveNpm   = [bool](Get-Command npm   -ErrorAction SilentlyContinue)

$haveTauri = $false
if ($haveCargo) {
    try {
        $null = & cargo tauri --version 2>$null
        $haveTauri = ($LASTEXITCODE -eq 0)
    } catch {}
}

# ---------------------------------------------------------------------------
# Choose launcher
# ---------------------------------------------------------------------------
$launcher   = $null
$launchArgs = @()

if ($haveTauri) {
    $launcher = "cargo"
    $launchArgs = @("tauri", "dev")
    Log "launcher: cargo tauri dev   (Windows-side install; avoids @tauri-apps/cli platform-binary drift)" Green
} elseif ($haveNpm) {
    $launcher = "npm"
    $launchArgs = @("run", "tauri", "dev")
    Log "launcher: npm run tauri dev (fallback; requires Windows-side `npm install`)" Yellow
    Log "tip: 'cargo install tauri-cli --version ^2.0 --locked' makes this script cleaner." DarkGray
} else {
    Write-Error "Need cargo OR npm on Windows PATH. Install Rust (rustup.rs) + 'cargo install tauri-cli --version ^2.0 --locked', or Node.js (nodejs.org)."
}

# ---------------------------------------------------------------------------
# Optional reinstall (npm modules + cargo fetch)
# ---------------------------------------------------------------------------
if ($Reinstall) {
    if ($haveNpm) {
        if (Test-Path node_modules) {
            Log "node_modules present, skipping npm install (pass -ForceReinstall to override)." DarkGray
        } else {
            Log "npm install ..." Yellow
            & npm install --no-audit --no-fund
            if ($LASTEXITCODE -ne 0) { Write-Error "npm install failed" }
        }
    }
    if ($haveCargo -and (Test-Path src-tauri/Cargo.toml)) {
        Push-Location src-tauri
        Log "cargo fetch ..." Yellow
        & cargo fetch
        Pop-Location
    }
}

# ---------------------------------------------------------------------------
# CARGO_TARGET_DIR -> Windows fs (avoids 5-10x slowdown over \\wsl$)
# ---------------------------------------------------------------------------
if ($haveCargo -and -not $env:CARGO_TARGET_DIR) {
    $winFsTarget = Join-Path $env:LOCALAPPDATA "mindtap-target"
    if (-not (Test-Path $winFsTarget)) {
        New-Item -ItemType Directory -Path $winFsTarget -Force | Out-Null
    }
    $env:CARGO_TARGET_DIR = $winFsTarget
    Log "CARGO_TARGET_DIR=$winFsTarget   (kept on Windows fs; \\wsl$ would be 5-10x slower)" DarkGray
}

# ---------------------------------------------------------------------------
# Cleanup stale dev ports so vite can bind 1420 cleanly
# ---------------------------------------------------------------------------
foreach ($port in 1420, 1421) {
    Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
        ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
}

# ---------------------------------------------------------------------------
# Launch (foreground; Ctrl+C cancels Tauri + Vite + Rust build cleanly)
# ---------------------------------------------------------------------------
Log ("launching: {0} {1}" -f $launcher, ($launchArgs -join ' ')) Cyan
Log "WebView2 window will appear shortly. DevTools: right-click > Inspect / F12." DarkGray
Log "Terminate: Ctrl+C once to cancel cargo + tauri; twice to force kill." DarkGray
Write-Host ""

& $launcher @launchArgs
