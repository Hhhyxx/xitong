@echo off
chcp 65001 >nul
echo ==========================================
echo  Fix Database - Create All Tables
echo ==========================================
echo.

echo [1/3] Stopping backend service...
taskkill /F /IM java.exe 2>nul
timeout /t 2 /nobreak >nul

echo [2/3] Creating all tables...
mysql -u root -p123456 < fix-database.sql

if %ERRORLEVEL% NEQ 0 (
    echo [Error] Failed to fix database
    pause
    exit /b 1
)

echo [3/3] Database fixed successfully!
echo.
echo All tables created:
echo - sys_user (users)
echo - competition_category (categories)
echo - competition (competitions)
echo - competition_enrollment (enrollments)
echo - competition_favorite (favorites)
echo - award_record (awards)
echo - user_interest_tag (interest tags)
echo - sys_notification (notifications)
echo - forum_post (forum posts)
echo - forum_reply (forum replies)
echo - forum_like (forum likes)
echo.
echo Next steps:
echo 1. Close this window
echo 2. Run start-all.bat
echo 3. Press Ctrl+F5 in browser
echo.
pause
