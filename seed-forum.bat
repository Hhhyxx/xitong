@echo off
chcp 65001 >nul
echo ==========================================
echo   竞赛通系统 - 论坛种子数据导入
echo ==========================================
echo.
echo 将插入 5 条演示帖子和若干回复，确保论坛有初始内容。
echo.
set /p DB_HOST="数据库地址 (默认 localhost): "
if "%DB_HOST%"=="" set DB_HOST=localhost
set /p DB_PORT="数据库端口 (默认 3306): "
if "%DB_PORT%"=="" set DB_PORT=3306
set /p DB_USER="数据库用户名 (默认 root): "
if "%DB_USER%"=="" set DB_USER=root
set /p DB_PASS="数据库密码: "
set /p DB_NAME="数据库名 (默认 competition_system): "
if "%DB_NAME%"=="" set DB_NAME=competition_system

echo.
echo 正在导入论坛种子数据...
mysql -h %DB_HOST% -P %DB_PORT% -u %DB_USER% -p%DB_PASS% %DB_NAME% < backend\src\main\resources\data-forum.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ==========================================
    echo   论坛种子数据导入成功！
    echo   现在论坛中有演示帖子可供查看。
    echo ==========================================
) else (
    echo.
    echo 导入失败，请检查：
    echo   1. MySQL 服务是否启动
    echo   2. 数据库连接信息是否正确
    echo   3. forum_post 和 forum_reply 表是否已创建
    echo   （先执行 schema-forum.sql 创建表结构）
)
pause
