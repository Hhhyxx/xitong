@echo off
chcp 65001 >nul
echo ==========================================
echo   竞赛通系统 - 数据库迁移工具
echo   添加缺失字段（photo_url, source等）
echo ==========================================
echo.
echo 请确保 MySQL 服务已启动。
echo.
set /p DB_HOST="数据库地址 (默认 localhost): "
if "%DB_HOST%"=="" set DB_HOST=localhost
set /p DB_PORT="数据库端口 (默认 3306): "
if "%DB_PORT%"=="" set DB_PORT=3306
set /p DB_USER="数据库用户名 (默认 root): "
if "%DB_USER%"=="" set DB_USER=root
set /p DB_PASS="数据库密码: "
set /p DB_NAME="数据库名 (默认 competition_db): "
if "%DB_NAME%"=="" set DB_NAME=competition_db

echo.
echo 正在执行迁移...
mysql -h %DB_HOST% -P %DB_PORT% -u %DB_USER% -p%DB_PASS% %DB_NAME% < migrate-db.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ==========================================
    echo   迁移完成！
    echo ==========================================
) else (
    echo.
    echo 迁移失败，请检查数据库连接信息和权限。
)
pause
