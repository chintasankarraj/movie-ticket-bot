@echo off
title Avengers Doomsday 12 AM Ticket Notifier
cd /d "%~dp0"
echo Starting Avengers Doomsday 12 AM Ticket Monitor...
.venv\Scripts\python.exe monitor.py
pause
