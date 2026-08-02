@echo off
REM scripts\pull-and-dev.bat -- double-clickable entry for pull-and-dev.ps1.
REM Usage: double-click in Explorer, or run from cmd/powershell.

pushd "%~dp0.." >nul 2>&1
if errorlevel 1 (
    echo [pull-and-dev.bat] pushd failed for "%~dp0.."
    pause
    exit /b 1
)

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0pull-and-dev.ps1" %*
set ERR=%errorlevel%

popd >nul 2>&1

if not "%ERR%"=="0" pause
exit /b %ERR%
