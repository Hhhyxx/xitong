@echo off
chcp 65001 >nul
echo ==========================================
echo  启动后端服务 (SpringBoot)
echo ==========================================
echo.

set JAVA_HOME=C:\Program Files\Java\jdk-17
set PATH=%JAVA_HOME%\bin;%PATH%

REM 获取脚本所在目录
set "SCRIPT_DIR=%~dp0"
set "BACKEND_DIR=%SCRIPT_DIR%backend"

cd /d "%BACKEND_DIR%"

set JAVA_TOOL_OPTIONS=-Dfile.encoding=UTF-8 -Dstdout.encoding=UTF-8 -Dstderr.encoding=UTF-8
set MAVEN_OPTS=-Dfile.encoding=UTF-8 -Dstdout.encoding=UTF-8 -Dstderr.encoding=UTF-8

REM 检查 jar 包是否存在
if not exist "target\competition-system-1.0.0.jar" (
    echo 正在编译打包...
    call mvn clean package -DskipTests -q
    if errorlevel 1 (
        echo 编译失败！
        pause
        exit /b 1
    )
)

echo 启动后端服务...
echo 访问地址: http://localhost:8080/api
echo.

java -Dfile.encoding=UTF-8 -Dstdout.encoding=UTF-8 -Dstderr.encoding=UTF-8 -jar target\competition-system-1.0.0.jar

pause
