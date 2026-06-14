-- =====================================================
-- 修复数据库 - 创建所有缺失的表
-- =====================================================

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

USE competition_system;

-- 1. 用户表
CREATE TABLE IF NOT EXISTS sys_user (
    id          BIGINT       AUTO_INCREMENT PRIMARY KEY,
    username    VARCHAR(50)  UNIQUE,
    password    VARCHAR(255),
    nickname    VARCHAR(50),
    real_name   VARCHAR(50),
    email       VARCHAR(100),
    phone       VARCHAR(20),
    avatar      VARCHAR(500),
    gender      TINYINT      DEFAULT 0,
    college     VARCHAR(100),
    major       VARCHAR(100),
    student_id  VARCHAR(30),
    grade       VARCHAR(20),
    role        TINYINT      DEFAULT 3,
    status      TINYINT      DEFAULT 1,
    create_time TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login  TIMESTAMP,
    deleted     TINYINT      DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. 竞赛分类表
CREATE TABLE IF NOT EXISTS competition_category (
    id          INT          AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(50),
    icon        VARCHAR(100),
    sort        INT          DEFAULT 0,
    status      TINYINT      DEFAULT 1,
    create_time TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. 竞赛信息表
CREATE TABLE IF NOT EXISTS competition (
    id           BIGINT       AUTO_INCREMENT PRIMARY KEY,
    title        VARCHAR(200),
    category_id  INT,
    level        TINYINT      DEFAULT 1,
    level_name   VARCHAR(50),
    organizer    VARCHAR(200),
    description  LONGTEXT,
    requirements LONGTEXT,
    start_time   TIMESTAMP,
    end_time     TIMESTAMP,
    contest_time TIMESTAMP,
    location     VARCHAR(200),
    url          VARCHAR(500),
    cover_image  VARCHAR(500),
    status       TINYINT      DEFAULT 1,
    view_count   INT          DEFAULT 0,
    favorite_count INT        DEFAULT 0,
    enroll_count INT          DEFAULT 0,
    create_by    BIGINT,
    create_time  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    update_time  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted      TINYINT      DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. 竞赛报名表
CREATE TABLE IF NOT EXISTS competition_enrollment (
    id             BIGINT       AUTO_INCREMENT PRIMARY KEY,
    competition_id BIGINT,
    user_id        BIGINT,
    team_name      VARCHAR(100),
    team_members   VARCHAR(500),
    contact_phone  VARCHAR(20),
    contact_email  VARCHAR(100),
    remark         VARCHAR(500),
    status         TINYINT      DEFAULT 0,
    reject_reason  VARCHAR(500),
    create_time    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    update_time    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted        TINYINT      DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. 竞赛收藏表
CREATE TABLE IF NOT EXISTS competition_favorite (
    id             BIGINT   AUTO_INCREMENT PRIMARY KEY,
    user_id        BIGINT,
    competition_id BIGINT,
    create_time    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted        TINYINT  DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. 获奖记录表
CREATE TABLE IF NOT EXISTS award_record (
    id             BIGINT       AUTO_INCREMENT PRIMARY KEY,
    user_id        BIGINT,
    competition_id BIGINT,
    comp_name      VARCHAR(200),
    award_level    VARCHAR(50),
    award_time     DATE,
    certificate    VARCHAR(500),
    description    VARCHAR(500),
    create_time    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    update_time    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. 用户兴趣标签表
CREATE TABLE IF NOT EXISTS user_interest_tag (
    id          INT          AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT,
    tag_name    VARCHAR(50),
    create_time TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. 系统通知表
CREATE TABLE IF NOT EXISTS sys_notification (
    id          BIGINT       AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT,
    title       VARCHAR(200),
    content     LONGTEXT,
    type        TINYINT      DEFAULT 1,
    is_read     TINYINT      DEFAULT 0,
    create_time TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. 论坛帖子表
CREATE TABLE IF NOT EXISTS forum_post (
    id              BIGINT          AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT          NOT NULL,
    user_nickname   VARCHAR(50),
    title           VARCHAR(200)    NOT NULL,
    content         LONGTEXT        NOT NULL,
    category        VARCHAR(50)     DEFAULT 'general',
    view_count      INT             DEFAULT 0,
    reply_count     INT             DEFAULT 0,
    like_count      INT             DEFAULT 0,
    is_top          TINYINT         DEFAULT 0,
    is_essence      TINYINT         DEFAULT 0,
    status          TINYINT         DEFAULT 1,
    create_time     TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    update_time     TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted         TINYINT         DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. 论坛回复表
CREATE TABLE IF NOT EXISTS forum_reply (
    id              BIGINT          AUTO_INCREMENT PRIMARY KEY,
    post_id         BIGINT          NOT NULL,
    user_id         BIGINT          NOT NULL,
    user_nickname   VARCHAR(50),
    content         TEXT            NOT NULL,
    parent_id       BIGINT          DEFAULT NULL,
    like_count      INT             DEFAULT 0,
    status          TINYINT         DEFAULT 1,
    create_time     TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    update_time     TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted         TINYINT         DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. 论坛点赞表
CREATE TABLE IF NOT EXISTS forum_like (
    id          BIGINT          AUTO_INCREMENT PRIMARY KEY,
    target_type TINYINT         NOT NULL COMMENT '1=帖子 2=回复',
    target_id   BIGINT          NOT NULL,
    user_id     BIGINT          NOT NULL,
    create_time TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_like (target_type, target_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- 插入初始数据
-- =====================================================

-- 超级管理员
INSERT IGNORE INTO sys_user (id, username, password, nickname, role, status) VALUES
(1, 'admin', '$2a$10$vTKfmxipVPOLJWtX26zU.eB.PKRq7PbFiq2/mlrIx6U6uPoUPBm7u', '超级管理员', 1, 1);

-- 测试用户
INSERT IGNORE INTO sys_user (id, username, password, nickname, real_name, email, phone, college, major, student_id, role, status) VALUES
(2, 'zhangsan', '$2a$10$x/a9KRs/2Dhlro79rkbK3.PzN0zhmJC8bDK4lFIFqvAKDQCOtug3q', '张三', '张三', 'zhangsan@example.com', '13800000001', '计算机学院', '软件工程', '2024001', 4, 1),
(3, 'lisi', '$2a$10$Cb3fCSn2bv3D2OWLt4wGA./I4IYiCokj9tUFGKvf8TSi0/036Yhi.', '李四', '李四', 'lisi@example.com', '13800000002', '信息学院', '网络安全', '2024002', 4, 1);

-- 竞赛分类
INSERT IGNORE INTO competition_category (id, name, icon, sort) VALUES
(1, '数学建模', '📐', 1),
(2, '程序设计', '💻', 2),
(3, '创新创业', '🚀', 3),
(4, '电子设计', '🔌', 4),
(5, '机器人', '🤖', 5),
(6, '数据科学', '📊', 6),
(7, '人文社科', '📚', 7),
(8, '艺术设计', '🎨', 8);

-- 示例竞赛
INSERT IGNORE INTO competition (id, title, category_id, level, level_name, organizer, description, start_time, end_time, status) VALUES
(1, '全国大学生数学建模竞赛', 1, 1, '国家级', '中国工业与应用数学学会', '全国大学生数学建模竞赛是全国高校规模最大的基础性学科竞赛', '2026-09-01 00:00:00', '2026-09-30 23:59:59', 1),
(2, '蓝桥杯全国软件和信息技术专业人才大赛', 2, 1, '国家级', '工业和信息化部人才交流中心', '蓝桥杯大赛是工信部举办的全国性IT学科赛事', '2026-03-01 00:00:00', '2026-05-31 23:59:59', 1),
(3, '中国国际大学生创新大赛', 3, 1, '国家级', '教育部', '原互联网+大学生创新创业大赛', '2026-06-01 00:00:00', '2026-10-31 23:59:59', 1);

SELECT 'Database fixed successfully!' AS result;
