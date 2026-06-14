# 大学生竞赛管理系统 - 部署指南

## 📋 系统架构

- **前端**: 纯 HTML/CSS/JS (无框架依赖)
- **后端**: SpringBoot 3.2 + MyBatis-Plus + JWT + Spring Security
- **数据库**: MySQL 8.0+
- **缓存**: Redis (可选，用于Token黑名单和验证码)

---

## 🛠️ 环境要求

| 组件 | 版本要求 |
|------|---------|
| Java | JDK 17+ |
| Maven | 3.8+ |
| MySQL | 8.0+ |
| Redis | 6.0+ (可选) |
| Node.js | 仅用于前端开发服务器 |

---

## 📦 第一步：数据库初始化

### 1. 创建数据库

```sql
-- 登录 MySQL
mysql -u root -p

-- 创建数据库
CREATE DATABASE IF NOT EXISTS competition_system 
DEFAULT CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- 使用数据库
USE competition_system;
```

### 2. 执行初始化脚本

```bash
# 在项目根目录执行
mysql -u root -p competition_system < docs/database-design.sql
```

### 3. 验证数据

```sql
-- 检查表是否创建成功
SHOW TABLES;

-- 检查初始数据
SELECT * FROM sys_user;
SELECT * FROM competition_category;
```

---

## ⚙️ 第二步：后端配置

### 1. 修改数据库连接

编辑 `backend/src/main/resources/application.yml`:

```yaml
spring:
  datasource:
    driver-class-name: com.mysql.cj.jdbc.Driver
    url: jdbc:mysql://localhost:3306/competition_system?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai
    username: root          # 修改为你的 MySQL 用户名
    password: your_password # 修改为你的 MySQL 密码
  data:
    redis:
      host: localhost
      port: 6379
      password:             # 如果有密码请填写
      database: 0
```

### 2. 编译打包

```bash
cd backend

# 编译
mvn clean compile

# 打包
mvn clean package -DskipTests
```

### 3. 启动服务

```bash
# 方式一：直接运行
mvn spring-boot:run

# 方式二：运行 jar 包
java -jar target/competition-system-1.0.0.jar
```

### 4. 验证后端启动

访问: http://localhost:8080/api/competition/latest

应该返回 JSON 格式的竞赛列表。

---

## 🌐 第三步：前端配置

### 1. 修改 API 地址（如需要）

编辑 `frontend/js/api.js`，修改 `API_BASE`:

```javascript
const API_BASE = 'http://localhost:8080/api';  // 后端地址
```

### 2. 启动前端服务器

```bash
cd frontend

# Python 3
python -m http.server 8088

# 或 Node.js
npx serve -p 8088

# 或 PHP
php -S localhost:8088
```

### 3. 访问系统

打开浏览器访问: http://localhost:8088

---

## 🔐 默认账号

| 账号 | 密码 | 角色 |
|------|------|------|
| admin | admin123 | 高级管理员 |
| teacher01 | teacher123 | 管理员(辅导员) |

---

## 📁 项目结构

```
competition-system/
├── backend/                    # SpringBoot 后端
│   ├── src/main/java/
│   │   └── com/competition/
│   │       ├── CompetitionApplication.java    # 启动类
│   │       ├── common/         # 通用类
│   │       ├── config/         # 配置类
│   │       ├── controller/     # 控制器
│   │       ├── dto/            # 数据传输对象
│   │       ├── entity/         # 实体类
│   │       ├── mapper/         # MyBatis Mapper
│   │       ├── security/       # JWT/安全
│   │       ├── service/        # 服务层
│   │       └── vo/             # 视图对象
│   ├── src/main/resources/
│   │   └── application.yml     # 配置文件
│   └── pom.xml                 # Maven 配置
├── frontend/                   # 前端
│   ├── index.html
│   ├── css/                    # 样式文件
│   └── js/                     # JS 文件
│       ├── api.js              # API 接口层
│       ├── pages/              # 页面组件
│       └── ...
├── docs/
│   └── database-design.sql     # 数据库脚本
└── DEPLOY.md                   # 本文件
```

---

## 🔌 API 接口列表

### 认证接口
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/login | 登录 |
| POST | /api/auth/register | 注册 |
| POST | /api/auth/logout | 登出 |

### 用户接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/user/info | 获取用户信息 |
| PUT | /api/user/info | 更新用户信息 |
| PUT | /api/user/password | 修改密码 |
| GET | /api/user/tags | 获取兴趣标签 |
| PUT | /api/user/tags | 更新兴趣标签 |

### 竞赛接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/competition/list | 竞赛列表 |
| GET | /api/competition/latest | 最新竞赛 |
| GET | /api/competition/hot | 热门竞赛 |
| GET | /api/competition/{id} | 竞赛详情 |
| POST | /api/competition | 创建竞赛 |
| PUT | /api/competition/{id} | 更新竞赛 |
| DELETE | /api/competition/{id} | 删除竞赛 |

### 收藏接口
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/favorite/{compId} | 添加收藏 |
| DELETE | /api/favorite/{compId} | 取消收藏 |
| GET | /api/favorite/list | 收藏列表 |

### 报名接口
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/enrollment | 报名 |
| DELETE | /api/enrollment/{compId} | 取消报名 |
| GET | /api/enrollment/list | 报名列表 |
| GET | /api/enrollment/export | 导出报名数据 |
| PUT | /api/enrollment/{id}/approve | 审核通过 |
| PUT | /api/enrollment/{id}/reject | 审核拒绝 |

### 获奖记录接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/award/list | 获奖列表 |
| POST | /api/award | 添加记录 |
| PUT | /api/award/{id} | 更新记录 |
| DELETE | /api/award/{id} | 删除记录 |

### 分类接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/category/list | 分类列表 |

---

## ⚠️ 常见问题

### 1. 数据库连接失败

**问题**: `Communications link failure`

**解决**:
- 检查 MySQL 服务是否启动
- 检查用户名密码是否正确
- 检查数据库 `competition_system` 是否存在

### 2. 跨域问题

**问题**: `CORS policy: No 'Access-Control-Allow-Origin' header`

**解决**:
- 后端已配置 CORS，确保前端访问地址正确
- 检查 `CorsConfig.java` 中的配置

### 3. JWT Token 无效

**问题**: `401 Unauthorized`

**解决**:
- 检查 token 是否过期（默认24小时）
- 检查请求头格式: `Authorization: Bearer {token}`
- 检查 Redis 是否正常运行（Token黑名单功能需要Redis）

### 4. 端口冲突

**问题**: `Port 8080 was already in use`

**解决**:
```bash
# 查找占用端口的进程
netstat -ano | findstr :8080

# 修改后端端口
# 编辑 application.yml
server:
  port: 8081  # 修改为其他端口
```

---

## 🚀 生产环境部署

### 使用 Docker 部署（推荐）

```bash
# 构建镜像
docker build -t competition-system .

# 运行容器
docker run -d \
  -p 8080:8080 \
  -e SPRING_DATASOURCE_URL=jdbc:mysql://mysql:3306/competition_system \
  -e SPRING_DATASOURCE_USERNAME=root \
  -e SPRING_DATASOURCE_PASSWORD=your_password \
  competition-system
```

### Nginx 反向代理

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /var/www/competition-system/frontend;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # 后端 API 代理
    location /api/ {
        proxy_pass http://localhost:8080/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 📞 技术支持

如有问题，请检查：
1. 后端日志: `backend/logs/`
2. 浏览器控制台 Network 面板
3. 数据库连接配置

---

## 📝 更新日志

### v1.0.0 (2026-04-11)
- 初始版本发布
- 完成前后端全栈对接
- 支持 JWT 认证
- 支持 MySQL 数据持久化
