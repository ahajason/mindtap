@echo off
REM scripts\build-windows.bat -- double-clickable Windows entry for build-windows.ps1.
REM
REM Why pushd/popd: CMD.EXE refuses to start with a UNC path as cwd and
REM silently resets it to %SYSTEMROOT%. pushd maps the WSL UNC base to a
REM temporary drive letter so CMD is happy AND PowerShell inherits a usable
REM cwd instead of C:\Windows.

pushd "%~dp0.." >nul 2>&1
if errorlevel 1 (
    echo [build-windows.bat] pushd failed for "%~dp0.." -- the WSL share may be down.
    pause
    exit /b 1
)

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0build-windows.ps1" %*
set ERR=%errorlevel%

popd >nul 2>&1

if not "%ERR%"=="0" pause
exit /b %ERR%
