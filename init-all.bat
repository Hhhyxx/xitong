@echo off
chcp 65001 >nul
echo ==========================================
echo   竞赛通系统 - 完整数据库初始化
echo   包含：表结构 + 种子数据（论坛、获奖）
echo ==========================================
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

set MYSQL_CMD=mysql -h %DB_HOST% -P %DB_PORT% -u %DB_USER% -p%DB_PASS% %DB_NAME%

echo.
echo [1/4] 创建数据库...
%MYSQL_CMD% -e "CREATE DATABASE IF NOT EXISTS %DB_NAME% DEFAULT CHARSET utf8mb4 COLLATE utf8mb4_unicode_ci;"

echo [2/4] 创建基础表结构...
%MYSQL_CMD% < backend\src\main\resources\schema-mysql.sql

echo [3/4] 创建论坛表结构...
%MYSQL_CMD% < backend\src\main\resources\schema-forum.sql

echo [4/4] 执行数据库迁移（添加新字段）...
%MYSQL_CMD% < migrate-db.sql

echo [5/5] 导入基础数据（用户、竞赛等）...
%MYSQL_CMD% < backend\src\main\resources\data.sql

echo [6/6] 导入论坛种子数据...
%MYSQL_CMD% < backend\src\main\resources\data-forum.sql

echo [7/7] 导入获奖种子数据...
%MYSQL_CMD% < backend\src\main\resources\data-award.sql

echo.
echo ==========================================
echo   初始化完成！
echo   测试账号:
echo     管理员: admin / admin123
echo     学生1:  zhangsan / pass123
echo     学生2:  lisi / pass123
echo ==========================================
pause
