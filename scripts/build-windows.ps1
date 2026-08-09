<#
.SYNOPSIS
    Windows production build for Mindtap (Tauri 2 + NSIS).
    Outputs installers / portable exe into the project-level build\ directory.

.DESCRIPTION
    Windows-native PowerShell only (not WSL). Mirrors the launcher conventions
    of scripts\dev.ps1 so the same machine can both develop and ship.

    Steps:
      1. Guard: refuse WSL
      2. Locate project root (walk up to package.json)
      3. Detect cargo tauri / npm run tauri
      4. Optionally reinstall deps
      5. Keep CARGO_TARGET_DIR on Windows fs when project lives under \\wsl$
      6. Run release build (beforeBuildCommand runs `npm run build`)
      7. Collect artifacts into <project>\build\
           - mindtap.exe                          (portable bare binary)
           - mindtap_<version>_x64-setup.exe      (NSIS installer)
           - build-info.txt                       (version / time / git sha)

.PARAMETER Reinstall
    Run `npm install` + `cargo fetch` before building.

.PARAMETER Clean
    Wipe the project build\ directory before collecting new artifacts.
    Does NOT clean cargo target (use -CleanTarget for that).

.PARAMETER CleanTarget
    Wipe the active cargo target release dir before building (slow full rebuild).

.PARAMETER SkipBundle
    Pass --no-bundle to tauri (produce bare .exe only, no NSIS installer).

.EXAMPLE
    PS> .\scripts\build-windows.ps1
    PS> .\scripts\build-windows.ps1 -Reinstall -Clean
    PS> .\scripts\build-windows.ps1 -SkipBundle

.NOTES
    File encoding: ASCII-safe on purpose (PowerShell 5.1 ships with Win11).
    For prose / context read scripts\README.md instead.
#>
[CmdletBinding()]
param(
    [switch]$Reinstall,
    [switch]$Clean,
    [switch]$CleanTarget,
    [switch]$SkipBundle
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# ---------------------------------------------------------------------------
# Guard: never run inside WSL -- WebView2 / MSVC / NSIS are Windows-side.
# ---------------------------------------------------------------------------
if ($env:WSL_DISTRO_NAME) {
    Write-Host "build-windows.ps1 must run on Windows-native PowerShell, not inside WSL." -ForegroundColor Red
    Write-Host "On Windows, double-click scripts\build-windows.bat or run '.\scripts\build-windows.ps1'." -ForegroundColor Yellow
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
$Host.UI.RawUI.WindowTitle = "Mindtap Build @ $ProjectRoot"

function Log([string]$Msg, [string]$Color = "Cyan") {
    Write-Host "[build] $Msg" -ForegroundColor $Color
}

function Fail([string]$Msg) {
    Write-Host "[build] ERROR: $Msg" -ForegroundColor Red
    exit 1
}

Log "project: $ProjectRoot" DarkGray

# ---------------------------------------------------------------------------
# WSL sniffing (informational): if project lives under \\wsl$ we surface that.
# ---------------------------------------------------------------------------
$wslMatch = [regex]::Match($ProjectRoot, '^\\\\wsl\$\\([^\\]+)\\(.*)$')
$isWslUnc = $wslMatch.Success
if ($isWslUnc) {
    $distro = $wslMatch.Groups[1].Value
    $sub    = $wslMatch.Groups[2].Value -replace '\\','/'
    Log ("WSL distro: {0}    subpath: /{1}" -f $distro, $sub) DarkGray
    Log "Build will write cargo target to Windows fs to avoid \\wsl$ slowness." DarkGray
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

if (-not $haveTauri -and -not $haveNpm) {
    Fail "Need either 'cargo tauri' or npm on Windows PATH. Install Rust + 'cargo install tauri-cli --version ^2.0 --locked', or install Node.js 24 LTS and run npm install."
}

# Soft Node version check (project engines: >=24 <25)
if ($haveNpm) {
    try {
        $nodeVer = (& node -v 2>$null)
        if ($nodeVer -match '^v(\d+)\.') {
            $major = [int]$Matches[1]
            if ($major -lt 24 -or $major -ge 25) {
                Log "WARNING: Node $nodeVer detected; project requires >=24 <25 (see package.json engines / .nvmrc)." Yellow
            } else {
                Log "node: $nodeVer" DarkGray
            }
        }
    } catch {}
}

# ---------------------------------------------------------------------------
# Choose launcher
# ---------------------------------------------------------------------------
$launcher   = $null
$launchArgs = @()

if ($haveTauri) {
    $launcher = "cargo"
    $launchArgs = @("tauri", "build")
    if ($SkipBundle) { $launchArgs += "--no-bundle" }
    Log "launcher: cargo tauri build   (Windows-side install; avoids @tauri-apps/cli platform-binary drift)" Green
} elseif ($haveNpm) {
    $launcher = "npm"
    # npm run tauri -- build [--no-bundle]
    $launchArgs = @("run", "tauri", "--", "build")
    if ($SkipBundle) { $launchArgs += "--no-bundle" }
    Log "launcher: npm run tauri -- build (fallback; requires Windows-side npm install)" Yellow
    Log "tip: 'cargo install tauri-cli --version ^2.0 --locked' makes this script cleaner." DarkGray
}

# ---------------------------------------------------------------------------
# Optional reinstall
# ---------------------------------------------------------------------------
if ($Reinstall) {
    if ($haveNpm) {
        Log "npm install ..." Yellow
        & npm install --no-audit --no-fund
        if ($LASTEXITCODE -ne 0) { Fail "npm install failed" }
    }
    if ($haveCargo -and (Test-Path (Join-Path $ProjectRoot "src-tauri\Cargo.toml"))) {
        Push-Location (Join-Path $ProjectRoot "src-tauri")
        Log "cargo fetch ..." Yellow
        & cargo fetch
        if ($LASTEXITCODE -ne 0) { Pop-Location; Fail "cargo fetch failed" }
        Pop-Location
    }
}

# ---------------------------------------------------------------------------
# CARGO_TARGET_DIR -> Windows fs when project is under \\wsl$ (or already set)
# ---------------------------------------------------------------------------
if ($haveCargo -and -not $env:CARGO_TARGET_DIR) {
    if ($isWslUnc) {
        $winFsTarget = Join-Path $env:LOCALAPPDATA "mindtap-target"
        if (-not (Test-Path $winFsTarget)) {
            New-Item -ItemType Directory -Path $winFsTarget -Force | Out-Null
        }
        $env:CARGO_TARGET_DIR = $winFsTarget
        Log "CARGO_TARGET_DIR=$winFsTarget   (kept on Windows fs; \\wsl$ would be 5-10x slower)" DarkGray
    }
}

# Resolve release dir (where tauri / cargo write artifacts)
if ($env:CARGO_TARGET_DIR) {
    $ReleaseDir = Join-Path $env:CARGO_TARGET_DIR "release"
} else {
    $ReleaseDir = Join-Path $ProjectRoot "src-tauri\target\release"
}
Log "cargo release dir: $ReleaseDir" DarkGray

# ---------------------------------------------------------------------------
# Optional clean
# ---------------------------------------------------------------------------
$OutDir = Join-Path $ProjectRoot "build"
if ($Clean -and (Test-Path $OutDir)) {
    Log "cleaning project build\ ..." Yellow
    Remove-Item -Recurse -Force $OutDir
}
if ($CleanTarget -and (Test-Path $ReleaseDir)) {
    Log "cleaning cargo release dir (full rebuild) ..." Yellow
    Remove-Item -Recurse -Force $ReleaseDir
}

# ---------------------------------------------------------------------------
# Build
# ---------------------------------------------------------------------------
Log ("launching: {0} {1}" -f $launcher, ($launchArgs -join ' ')) Cyan
Log "beforeBuildCommand will run: npm run build (tsc + lint:boundaries + vite build)" DarkGray
Write-Host ""

$sw = [System.Diagnostics.Stopwatch]::StartNew()
& $launcher @launchArgs
$buildExit = $LASTEXITCODE
$sw.Stop()

if ($buildExit -ne 0) {
    Write-Host ""
    Fail ("tauri build failed (exit {0}) after {1:N1}s. Common causes: missing MSVC C++ workload, Node version, or NSIS cache." -f $buildExit, $sw.Elapsed.TotalSeconds)
}

Log ("build finished in {0:N1}s" -f $sw.Elapsed.TotalSeconds) Green

# ---------------------------------------------------------------------------
# Collect artifacts into project build\
# ---------------------------------------------------------------------------
if (-not (Test-Path $OutDir)) {
    New-Item -ItemType Directory -Path $OutDir -Force | Out-Null
}

# Resolve current product version for artifact selection.
$pkgJsonPath = Join-Path $ProjectRoot "package.json"
try {
    $pkg = Get-Content -Path $pkgJsonPath -Raw -Encoding UTF8 | ConvertFrom-Json
    $version = [string]$pkg.version
    if ([string]::IsNullOrWhiteSpace($version)) { throw "package.json version is empty" }
} catch {
    Fail "Could not read version from UTF-8 package.json: $($_.Exception.Message)"
}
$installerPattern = "mindtap_{0}_*-setup.exe" -f $version

# Remove stale release installers only after the current build succeeds.
Get-ChildItem -Path $OutDir -Filter "*-setup.exe" -File -ErrorAction SilentlyContinue |
    Remove-Item -Force

$copied = @()

# 1) portable bare exe
$bareExe = Join-Path $ReleaseDir "mindtap.exe"
if (Test-Path $bareExe) {
    $dest = Join-Path $OutDir "mindtap.exe"
    Copy-Item -Force $bareExe $dest
    $copied += $dest
    Log "copied portable: $dest" Green
} else {
    Log "WARNING: bare exe not found at $bareExe" Yellow
}

# 2) Only this build's matching NSIS installer under release/bundle/nsis/.
$nsisDir = Join-Path $ReleaseDir "bundle\nsis"
if (-not $SkipBundle -and (Test-Path $nsisDir)) {
    $installers = @(Get-ChildItem -Path $nsisDir -Filter $installerPattern -File)
    if ($installers.Count -ne 1) {
        Fail ("Expected exactly one current NSIS installer matching '{0}' in {1}; found {2}. Clean the release bundle and rebuild." -f $installerPattern, $nsisDir, $installers.Count)
    }
    $dest = Join-Path $OutDir $installers[0].Name
    Copy-Item -Force $installers[0].FullName $dest
    $copied += $dest
    Log "copied installer: $dest" Green
} elseif (-not $SkipBundle) {
    Log "WARNING: NSIS bundle dir not found at $nsisDir (check tauri.conf.json bundle.targets)" Yellow
}

if ($copied.Count -eq 0) {
    Fail "build succeeded but no artifacts were collected. Inspect: $ReleaseDir"
}

# build-info.txt (version was validated above; read package.json as UTF-8 for PowerShell 5.1).
$gitSha = "unknown"
try {
    $sha = & git -C $ProjectRoot rev-parse --short HEAD 2>$null
    if ($LASTEXITCODE -eq 0 -and $sha) { $gitSha = $sha.Trim() }
} catch {}

$gitBranch = "unknown"
try {
    $br = & git -C $ProjectRoot rev-parse --abbrev-ref HEAD 2>$null
    if ($LASTEXITCODE -eq 0 -and $br) { $gitBranch = $br.Trim() }
} catch {}

$infoPath = Join-Path $OutDir "build-info.txt"
$now = Get-Date -Format "yyyy-MM-dd HH:mm:ss K"
$infoLines = @(
    "product=mindtap"
    "version=$version"
    "git_branch=$gitBranch"
    "git_sha=$gitSha"
    "built_at=$now"
    "host=$env:COMPUTERNAME"
    "os=$([System.Environment]::OSVersion.VersionString)"
    "launcher=$launcher $($launchArgs -join ' ')"
    "release_dir=$ReleaseDir"
    "artifacts:"
)
foreach ($f in $copied) {
    $item = Get-Item $f
    $infoLines += ("  {0}  ({1:N0} bytes)" -f $item.Name, $item.Length)
}
# Set-Content default encoding is system ANSI; use UTF8 for consistency
$infoLines | Set-Content -Path $infoPath -Encoding utf8
Log "wrote $infoPath" DarkGray

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
Write-Host ""
Log "=== Windows production build ready ===" Green
Log "output: $OutDir" Green
foreach ($f in $copied) {
    $item = Get-Item $f
    Log ("  - {0}  ({1:N1} MB)" -f $item.Name, ($item.Length / 1MB)) Cyan
}
Log "portable run:  Start-Process '$OutDir\mindtap.exe'" DarkGray
if (-not $SkipBundle) {
    Log "install run:   Start-Process (Get-ChildItem '$OutDir\$installerPattern' | Select-Object -First 1).FullName" DarkGray
}
Write-Host ""
exit 0
