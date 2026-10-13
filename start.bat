@echo off
chcp 65001 >nul 2>&1
setlocal
cd /d "%~dp0"

REM Find node: prefer bundled portable node, then system PATH, then WorkBuddy's node
set "NODE=%~dp0node\node.exe"
if not exist "%NODE%" (
  set "NODE="
  where node >nul 2>&1 && set "NODE=node"
)
if not defined NODE (
  for /f "delims=" %%i in ('dir /b /s "C:\Users\daniel\.workbuddy\binaries\node\versions\*\node.exe" 2^>nul') do (
    if not defined NODE set "NODE=%%i"
  )
)
if not exist "%NODE%" (
  echo Node.js not found.
  echo Please ask WorkBuddy to download a portable Node into this folder, or install Node.js from https://nodejs.org
  pause
  exit /b 1
)

echo Starting fitness-coach local server...
echo It will open http://localhost:8765 in your browser shortly.
echo (Close this window to stop the service)
timeout /t 2 /nobreak >nul
start "" http://localhost:8765
"%NODE%" server.js
