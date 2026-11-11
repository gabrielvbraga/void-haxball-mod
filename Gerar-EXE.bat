@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Instale o Node.js LTS primeiro: https://nodejs.org
  pause
  exit /b
)
if not exist node_modules call npm install
call node scripts\setup-electron.js
if errorlevel 1 (
  pause
  exit /b 1
)
echo Gerando a versao de distribuicao...
if exist private (
  echo Pasta private encontrada: gerando versao PESSOAL (nao publique esta versao^).
  call npm run dist:private
) else (
  call npm run dist
)
if errorlevel 1 (
  echo.
  echo Algo falhou. Leia a mensagem acima e veja a secao "Solucao de problemas" do README.
  pause
  exit /b 1
)
if not exist "dist\VOID HaxBall Mod-win32-x64\VOID-HaxBall-Mod.exe" (
  echo.
  echo O .exe nao foi criado. Mande um print desta janela.
  pause
  exit /b 1
)
start "" "dist\VOID HaxBall Mod-win32-x64"
pause
