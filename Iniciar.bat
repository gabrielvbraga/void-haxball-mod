@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Instale o Node.js LTS primeiro: https://nodejs.org
  pause
  exit /b
)
rem instala ou atualiza as dependências (rápido quando já está tudo certo)
call npm install --no-audit --no-fund
if errorlevel 1 (
  pause
  exit /b 1
)
call node scripts\setup-electron.js
if errorlevel 1 (
  pause
  exit /b 1
)
call npm start
if errorlevel 1 pause
