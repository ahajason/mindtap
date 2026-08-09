<#
.SYNOPSIS
    Isolated data-safety check for Mindtap 0.2.2 installers.
    Does not launch mindtap.exe (Known Folder ignores APPDATA env).
#>
[CmdletBinding()]
param([string]$SandboxDir)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

function Fail([string]$Msg) { Write-Host "[data-safety] FAIL: $Msg" -ForegroundColor Red; exit 1 }
function Ok([string]$Msg)   { Write-Host "[data-safety] $Msg" -ForegroundColor Green }
function Log([string]$Msg)  { Write-Host "[data-safety] $Msg" -ForegroundColor Cyan }

$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $ProjectRoot

$installer = Get-ChildItem (Join-Path $ProjectRoot "build\mindtap_*_x64-setup.exe") -EA SilentlyContinue |
    Sort-Object LastWriteTime -Descending | Select-Object -First 1
$genNsis = Join-Path $ProjectRoot "src-tauri\target\release\nsis\x64\installer.nsi"
$srcNsis = Join-Path $ProjectRoot "src-tauri\nsis\installer.nsi"
if (-not $installer) { Fail "missing installer — run npm run build:win first" }
if (-not (Test-Path $genNsis)) { Fail "missing generated nsis: $genNsis" }
if (-not (Test-Path $srcNsis))  { Fail "missing custom nsis: $srcNsis" }

# S0: generated + source NSIS must not wipe AppData
$ban = 'DeleteAppDataCheckbox|RmDir\s+/r\s+"\$(APPDATA|LOCALAPPDATA)\\'
foreach ($nsi in @($srcNsis, $genNsis)) {
    if ((Get-Content -Raw $nsi) -match $ban) { Fail "banned wipe path in $nsi" }
}
if (-not (Select-String -Path $genNsis -Pattern 'Preserve all application data' -Quiet)) {
    Fail "generated NSIS missing preserve comment"
}
Ok "S0 static NSIS ok"

# real AppData must stay byte-identical (hash only, no content read)
$realDb = Join-Path $env:APPDATA "com.mindtap.desktop\projects.db"
$realMeta = $null
if (Test-Path $realDb) {
    $realMeta = @{
        Length = (Get-Item $realDb).Length
        Hash   = (Get-FileHash -Algorithm SHA256 $realDb).Hash
    }
}
function Assert-RealUntouched {
    if ($null -eq $realMeta) {
        if (Test-Path $realDb) { Fail "run created real AppData db" }
        return
    }
    if (-not (Test-Path $realDb)) { Fail "real AppData db disappeared" }
    $h = (Get-FileHash -Algorithm SHA256 $realDb).Hash
    $len = (Get-Item $realDb).Length
    if ($h -ne $realMeta.Hash -or $len -ne $realMeta.Length) {
        Fail "REAL AppData projects.db changed"
    }
}

if (-not $SandboxDir) { $SandboxDir = Join-Path $ProjectRoot "build\data-safety-sandbox" }
if (Test-Path $SandboxDir) { Remove-Item -Recurse -Force $SandboxDir }
$instDir = Join-Path $SandboxDir "ProgramFiles\mindtap"
$fixture = Join-Path $SandboxDir "fixture.db"
New-Item -ItemType Directory -Force -Path $instDir, (Split-Path $fixture) | Out-Null

# R0: minimal fixture (not full CREATE_SQL paste)
$seed = @'
import hashlib, sqlite3, sys
p = sys.argv[1]
c = sqlite3.connect(p)
c.executescript("""
CREATE TABLE item (id INTEGER PRIMARY KEY, content TEXT NOT NULL, status TEXT NOT NULL,
  focus_ms INTEGER NOT NULL DEFAULT 0, source TEXT NOT NULL DEFAULT 'manual',
  created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
CREATE TABLE focus_interval (id INTEGER PRIMARY KEY, item_id INTEGER NOT NULL,
  started_at INTEGER NOT NULL, ended_at INTEGER, created_at INTEGER NOT NULL,
  source TEXT NOT NULL DEFAULT 'start');
CREATE TABLE app_setting (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at INTEGER NOT NULL);
""")
c.execute("PRAGMA user_version=1")
c.execute("INSERT INTO item(content,status,focus_ms,source,created_at,updated_at) VALUES('R0-fixture-keep-me','todo',12345,'manual',1,1)")
c.execute("INSERT INTO app_setting(key,value,updated_at) VALUES('marker','r0',1)")
c.commit(); c.close()
print(hashlib.sha256(open(p,'rb').read()).hexdigest())
'@
$seedFile = Join-Path $SandboxDir "seed.py"
$checkFile = Join-Path $SandboxDir "check.py"
Set-Content -Path $seedFile -Value $seed -Encoding UTF8
$r0Hash = (& python $seedFile $fixture).Trim().ToUpperInvariant()
if ($r0Hash.Length -ne 64) { Fail "R0 seed failed: $r0Hash" }
Ok "R0 fixture sha=$r0Hash"

function Get-DbHash([string]$Path) {
    (Get-FileHash -Algorithm SHA256 $Path).Hash.ToUpperInvariant()
}

Set-Content -Path $checkFile -Value @'
import sqlite3, sys
c = sqlite3.connect(sys.argv[1])
if c.execute("PRAGMA user_version").fetchone()[0] != 1: raise SystemExit("user_version")
row = c.execute("SELECT content,status,focus_ms FROM item WHERE content='R0-fixture-keep-me'").fetchone()
if row != ("R0-fixture-keep-me","todo",12345): raise SystemExit(f"row={row}")
if c.execute("SELECT value FROM app_setting WHERE key='marker'").fetchone() != ("r0",): raise SystemExit("marker")
print("ok")
'@ -Encoding UTF8

function Assert-Semantic([string]$Path) {
    $out = & python $checkFile $Path 2>&1
    if ($LASTEXITCODE -ne 0 -or ("$out").Trim() -ne "ok") { Fail "semantic: $out" }
}

# R1: silent install + full uninstall must succeed.
# Data protection proof is S0 on the *generated* nsis makensis compiled.
# Fixture hash here only proves this script didn't wipe its own file.
Log "R1 install $($installer.Name) -> $instDir"
$p = Start-Process $installer.FullName -ArgumentList @("/S", "/D=$instDir") -Wait -PassThru
if ($p.ExitCode -ne 0) { Fail "installer exit $($p.ExitCode)" }

$uninstaller = Join-Path $instDir "uninstall.exe"
if (-not (Test-Path $uninstaller)) {
    $cand = Get-ChildItem $instDir -Filter "*unins*.exe" -EA SilentlyContinue | Select-Object -First 1
    if ($cand) { $uninstaller = $cand.FullName }
}
if (-not (Test-Path $uninstaller)) { Fail "uninstaller missing under $instDir" }

Log "R1 full uninstall (no /UPDATE)"
$p2 = Start-Process $uninstaller -ArgumentList @("/S") -Wait -PassThru
if ($p2.ExitCode -ne 0) { Fail "uninstaller exit $($p2.ExitCode)" }
if ((Get-DbHash $fixture) -ne $r0Hash) { Fail "fixture changed during install/uninstall" }
Assert-Semantic $fixture
Ok "R1 install+uninstall ok; fixture intact"

# R2: production init_connection tests (source of truth for schema guard)
Log "R2 cargo test db::tests"
Push-Location (Join-Path $ProjectRoot "src-tauri")
& cargo test --lib db::tests -- --test-threads=1
$testExit = $LASTEXITCODE
Pop-Location
if ($testExit -ne 0) { Fail "db::tests failed" }
Assert-Semantic $fixture
Ok "R2 init_connection suite + fixture semantics ok"

Assert-RealUntouched
Ok "real AppData untouched"
Ok "ALL PASS — S0 / R0 / R1 / R2"
exit 0
