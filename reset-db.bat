@echo off
chcp 65001 >nul
echo ==========================================
echo  Reset Database - WARNING: All data will be lost!
echo ==========================================
echo.

set /p confirm="Are you sure you want to reset the database? (yes/no): "
if /i not "%confirm%"=="yes" (
    echo Cancelled.
    pause
    exit /b 0
)

echo.
echo Stopping backend service...
taskkill /F /IM java.exe 2>nul
timeout /t 2 /nobreak >nul

echo Dropping and recreating database...
mysql --default-character-set=utf8mb4 -u root -p123456 -e "DROP DATABASE IF EXISTS competition_system; CREATE DATABASE competition_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>nul

echo Creating tables...
mysql --default-character-set=utf8mb4 -u root -p123456 competition_system < "%~dp0backend\src\main\resources\schema.sql" 2>nul
if errorlevel 1 (
    echo Trying fix-database.sql...
    mysql --default-character-set=utf8mb4 -u root -p123456 competition_system < "%~dp0fix-database.sql" 2>nul
)

echo Importing initial data...
mysql --default-character-set=utf8mb4 -u root -p123456 competition_system < "%~dp0backend\src\main\resources\data.sql" 2>nul

echo.
echo Database reset complete!
echo Please run start-all.bat to start the system.
echo.
pause
