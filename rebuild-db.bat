@echo off
chcp 65001 >nul
echo ==========================================
echo  Rebuild Database - Fix Chinese Encoding
echo ==========================================
echo.

echo [1/4] Stopping backend service...
taskkill /F /IM java.exe 2>nul
timeout /t 2 /nobreak >nul

echo [2/4] Connecting to MySQL and rebuilding database...
mysql -u root -p123456 -e "DROP DATABASE IF EXISTS competition_system; CREATE DATABASE competition_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

if %ERRORLEVEL% NEQ 0 (
    echo [Error] MySQL connection failed, please check password
    pause
    exit /b 1
)

echo [3/4] Database rebuilt successfully!
echo.
echo [4/4] Please restart backend service to import data
echo.
echo Steps:
echo 1. Close this window
echo 2. Run start-all.bat
echo.
pause
