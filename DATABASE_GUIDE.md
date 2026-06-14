# 数据库操作指南

## 用户信息表 (sys_user)

### 表结构
| 字段名 | 说明 | 类型 |
|--------|------|------|
| id | 用户ID | BIGINT |
| username | 登录账号（邮箱注册时等于email） | VARCHAR(50) |
| password | BCrypt加密密码 | VARCHAR(100) |
| nickname | 昵称 | VARCHAR(50) |
| real_name | 真实姓名 | VARCHAR(50) |
| email | 邮箱 | VARCHAR(100) |
| phone | 手机号 | VARCHAR(20) |
| avatar | 头像URL | VARCHAR(255) |
| gender | 性别 0未知 1男 2女 | INT |
| college | 学院 | VARCHAR(100) |
| major | 专业 | VARCHAR(100) |
| student_id | 学号 | VARCHAR(50) |
| grade | 年级 | VARCHAR(20) |
| role | 角色 1超管 2管理员 3认证用户 4普通用户 | INT |
| status | 状态 0禁用 1正常 | INT |
| create_time | 创建时间 | DATETIME |
| update_time | 更新时间 | DATETIME |

### 手动修改用户信息

```sql
-- 连接到MySQL
mysql -u root -p123456

-- 使用数据库
USE competition_system;

-- 查看所有用户
SELECT id, username, nickname, real_name, email, college, major, student_id FROM sys_user;

-- 修改用户信息（示例：修改张三的学院和专业）
UPDATE sys_user SET 
    college = '计算机学院',
    major = '软件工程',
    nickname = '张三三',
    update_time = NOW()
WHERE username = 'zhangsan';

-- 修改密码（密码需要使用BCrypt加密，以下只是示例）
-- 密码 admin123 的BCrypt加密值：$2a$10$vTKfmxipVPOLJWtX26zU.eB.PKRq7PbFiq2/mlrIx6U6uPoUPBm7u
UPDATE sys_user SET 
    password = '$2a$10$vTKfmxipVPOLJWtX26zU.eB.PKRq7PbFiq2/mlrIx6U6uPoUPBm7u'
WHERE username = 'zhangsan';

-- 删除用户
DELETE FROM sys_user WHERE username = '要删除的用户名';

-- 退出
EXIT;
```

### 常用查询

```sql
-- 查看普通用户列表
SELECT id, username, nickname, email, college, major, create_time 
FROM sys_user 
WHERE role = 4;

-- 查看管理员列表
SELECT id, username, nickname, email, role 
FROM sys_user 
WHERE role <= 2;

-- 统计各学院人数
SELECT college, COUNT(*) as count 
FROM sys_user 
WHERE role = 4 AND college IS NOT NULL 
GROUP BY college;
```

## 其他重要表

### 竞赛表 (competition)
```sql
-- 查看所有竞赛
SELECT id, title, level_name, organizer, start_time, end_time, status FROM competition;

-- 修改竞赛信息
UPDATE competition SET 
    title = '新的竞赛名称',
    description = '新的描述'
WHERE id = 1;
```

### 收藏表 (competition_favorite)
```sql
-- 查看某用户的收藏
SELECT f.*, c.title 
FROM competition_favorite f
JOIN competition c ON f.competition_id = c.id
WHERE f.user_id = 1;
```

### 报名表 (competition_enrollment)
```sql
-- 查看报名列表
SELECT e.*, u.nickname, c.title
FROM competition_enrollment e
JOIN sys_user u ON e.user_id = u.id
JOIN competition c ON e.competition_id = c.id;
```

### 获奖记录表 (award_record)
```sql
-- 查看获奖记录
SELECT a.*, u.nickname, c.title
FROM award_record a
JOIN sys_user u ON a.user_id = u.id
JOIN competition c ON a.competition_id = c.id;
```

### 论坛表
```sql
-- 查看帖子
SELECT p.*, u.nickname 
FROM forum_post p
JOIN sys_user u ON p.user_id = u.id;

-- 查看回复
SELECT r.*, u.nickname 
FROM forum_reply r
JOIN sys_user u ON r.user_id = u.id;
```

## 数据备份与恢复

### 备份数据库
```bash
mysqldump -u root -p123456 competition_system > backup.sql
```

### 恢复数据库
```bash
mysql -u root -p123456 competition_system < backup.sql
```

### 重建数据库（解决乱码问题）
```bash
# 运行项目目录下的 rebuild-db.bat
rebuild-db.bat
```
