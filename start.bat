@echo off
cd /d "%~dp0"
echo Starting Worktable...
start http://localhost:8180
node server.js
pause
