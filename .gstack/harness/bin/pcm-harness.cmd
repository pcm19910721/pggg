@echo off
setlocal
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0pcm-harness.ps1" %*
exit /b %ERRORLEVEL%
