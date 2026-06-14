@echo off
chcp 65001 >nul
echo ==========================================
echo  College Competition Management System
echo ==========================================
echo.

set JAVA_HOME=C:\Program Files\Java\jdk-17
set PATH=%JAVA_HOME%\bin;%PATH%

REM Get script directory
set "SCRIPT_DIR=%~dp0"
set "BACKEND_DIR=%SCRIPT_DIR%backend"
set "FRONTEND_DIR=%SCRIPT_DIR%frontend"

REM Optional: configure real email verification for registration.
REM Use your SMTP authorization code/password, not your normal mailbox login password.
REM Example for QQ Mail:
set MAIL_HOST=smtp.qq.com
set MAIL_PORT=465
set MAIL_USERNAME=1587272742@qq.com
set MAIL_PASSWORD=ilylglqrwqrafgie
set MAIL_SSL_ENABLE=true

REM Check Redis
echo [1/6] Checking Redis service...
tasklist | findstr redis-server >nul
if errorlevel 1 (
    echo      Warning: Redis not running, trying to start...
    start "Redis Service" cmd /k "redis-server"
    timeout /t 3 /nobreak >nul
)

REM Check MySQL
echo [2/6] Checking MySQL service...
tasklist | findstr mysqld >nul
if errorlevel 1 (
    echo      Warning: MySQL not running, trying to start...
    net start MySQL80 2>nul || net start MySQL 2>nul
    timeout /t 3 /nobreak >nul
)

REM Check if database exists
mysql -u root -p123456 -e "USE competition_system; SELECT 1;" 2>nul
if errorlevel 1 (
    echo.
    echo [3/6] Database not found, creating new database...
    mysql --default-character-set=utf8mb4 -u root -p123456 -e "CREATE DATABASE IF NOT EXISTS competition_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>nul
    echo      Creating tables...
    mysql --default-character-set=utf8mb4 -u root -p123456 competition_system < "%BACKEND_DIR%\src\main\resources\schema.sql" 2>nul
    if errorlevel 1 (
        echo      Trying fix-database.sql...
        mysql --default-character-set=utf8mb4 -u root -p123456 competition_system < "%SCRIPT_DIR%\fix-database.sql" 2>nul
    )
    echo      Importing initial data...
    mysql --default-character-set=utf8mb4 -u root -p123456 competition_system < "%BACKEND_DIR%\src\main\resources\data.sql" 2>nul
    echo      Applying migrations ^(safe for new DB; duplicate-column notes OK^)...
    mysql --default-character-set=utf8mb4 -u root -p123456 --force competition_system < "%SCRIPT_DIR%migrate-db.sql"
    echo      Database created successfully!
) else (
    echo.
    echo [3/6] Database already exists.
    echo.
    echo  !! WARNING !! Recreating tables will ERASE all existing data.
    echo  Rebuild tables and reload initial data? (Y = rebuild / N = keep data)
    set /p REBUILD_DB=  Your choice [Y/N, default N]: 
    if /i "%REBUILD_DB%"=="Y" (
        echo      Dropping and recreating tables...
        mysql --default-character-set=utf8mb4 -u root -p123456 -e "DROP DATABASE competition_system; CREATE DATABASE competition_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>nul
        mysql --default-character-set=utf8mb4 -u root -p123456 competition_system < "%BACKEND_DIR%\src\main\resources\schema.sql" 2>nul
        echo      Importing initial data...
        mysql --default-character-set=utf8mb4 -u root -p123456 competition_system < "%BACKEND_DIR%\src\main\resources\data.sql" 2>nul
        echo      Applying migrations...
        mysql --default-character-set=utf8mb4 -u root -p123456 --force competition_system < "%SCRIPT_DIR%migrate-db.sql"
        echo      Database rebuilt successfully!
    ) else (
        echo      Keeping existing data.
        echo      Applying migrations ^(updates tables without deleting your data^)...
        mysql --default-character-set=utf8mb4 -u root -p123456 --force competition_system < "%SCRIPT_DIR%migrate-db.sql"
    )
)

REM Kill old Java processes to unlock JAR file
echo.
echo [4/6] Compiling SpringBoot backend...
tasklist | findstr java >nul 2>&1
if not errorlevel 1 (
    echo      Stopping old backend process...
    taskkill /F /IM java.exe >nul 2>&1
    timeout /t 2 /nobreak >nul
)
cd /d "%BACKEND_DIR%"

set JAVA_TOOL_OPTIONS=-Dfile.encoding=UTF-8 -Dstdout.encoding=UTF-8 -Dstderr.encoding=UTF-8
set MAVEN_OPTS=-Dfile.encoding=UTF-8 -Dstdout.encoding=UTF-8 -Dstderr.encoding=UTF-8
set "PYTHONUTF8=1"
set "PYTHONIOENCODING=utf-8"
echo      Compiling, please wait...
call mvn clean package -DskipTests -q 2>nul
if errorlevel 1 (
    echo      Compile failed! Showing details...
    call mvn clean package -DskipTests
    pause
    exit /b 1
)
echo      Compile success

REM Start backend
echo.
echo      Starting backend service (port 8080)...
start "Backend Service" cmd /k "chcp 65001 >nul && cd /d ""%BACKEND_DIR%"" && java -Dfile.encoding=UTF-8 -Dstdout.encoding=UTF-8 -Dstderr.encoding=UTF-8 -jar target\competition-system-1.0.0.jar"

echo      Waiting for backend startup (about 40s)...
timeout /t 40 /nobreak >nul

REM Check backend
curl -s http://localhost:8080/api/competition/list?page=1^&size=1 >nul 2>&1
if errorlevel 1 (
    echo      Warning: Backend may not be running properly
    echo      Please check the [Backend Service] window for errors
    echo.
    pause
) else (
    echo      Backend started successfully
)

REM Start frontend
echo.
echo [5/6] Starting frontend service (port 8088)...
cd /d "%FRONTEND_DIR%"
start "Frontend Service" cmd /k "chcp 65001 >nul && set ""PYTHONUTF8=1"" && set ""PYTHONIOENCODING=utf-8"" && cd /d ""%FRONTEND_DIR%"" && python server.py"

timeout /t 3 /nobreak >nul

echo.
echo [6/6] Opening browser...
start http://localhost:8088

echo.
echo ==========================================
echo  Startup complete!
echo.
echo  Access:
echo    - Frontend: http://localhost:8088
echo    - Backend API: http://localhost:8080/api
echo.
echo  Default accounts (see data.sql — initial password is usually 123456):
echo    - admin / 123456
echo    - zhangsan / 123456
echo    - lisi / 123456
echo.
echo  Important:
echo    - Press Ctrl+F5 to refresh browser cache!
echo    - Keep both command windows running!
echo ==========================================
echo.
pause
