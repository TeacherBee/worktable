@echo off
if "%1"=="h" goto begin
mshta vbscript:CreateObject("WScript.Shell").Run("""%~f0"" h",0)(Window.Close) & exit /b
:begin
cd /d "%~dp0"
start /B node server.js
ping -n 3 127.0.0.1 >nul
start http://localhost:8180
