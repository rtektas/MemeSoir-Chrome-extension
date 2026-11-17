@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
 echo Installe Node.js 22 ou plus recent depuis https://nodejs.org puis relance ce fichier.
 pause
 exit /b 1
)
echo Garde cette fenetre ouverte pendant la soiree.
node server/server.js
pause
