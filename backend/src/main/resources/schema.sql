-- =====================================================
-- 大学生竞赛管理系统 - MySQL 数据库设计
-- =====================================================

-- 设置字符集
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- 1. 用户表 (sys_user)
-- =====================================================
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

-- =====================================================
-- 2. 竞赛分类表 (competition_category)
-- =====================================================
CREATE TABLE IF NOT EXISTS competition_category (
    id          INT          AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(50),
    icon        VARCHAR(100),
    sort        INT          DEFAULT 0,
    status      TINYINT      DEFAULT 1,
    create_time TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 3. 竞赛信息表 (competition)
-- =====================================================
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
    tags         VARCHAR(500),
    source_url   VARCHAR(500),
    is_crawled   TINYINT      DEFAULT 0,
    source_site  VARCHAR(100),
    status       TINYINT      DEFAULT 1,
    view_count   INT          DEFAULT 0,
    favorite_count INT        DEFAULT 0,
    enroll_count INT          DEFAULT 0,
    create_by    BIGINT,
    create_time  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    update_time  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted      TINYINT      DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 4. 竞赛报名表 (competition_enrollment)
-- =====================================================
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
    enroll_time    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    create_time    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    update_time    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted        TINYINT      DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 5. 竞赛收藏表 (competition_favorite)
-- =====================================================
CREATE TABLE IF NOT EXISTS competition_favorite (
    id             BIGINT   AUTO_INCREMENT PRIMARY KEY,
    user_id        BIGINT,
    competition_id BIGINT,
    create_time    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted        TINYINT  DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 6. 获奖记录表 (award_record)
-- =====================================================
CREATE TABLE IF NOT EXISTS award_record (
    id             BIGINT       AUTO_INCREMENT PRIMARY KEY,
    user_id        BIGINT,
    competition_id BIGINT,
    comp_name      VARCHAR(200),
    award_level    VARCHAR(50),
    award_time     DATE,
    certificate    VARCHAR(500),
    photo_url      LONGTEXT,
    source         VARCHAR(20)  DEFAULT 'self',
    status         TINYINT      DEFAULT 0,
    description    VARCHAR(500),
    create_time    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    update_time    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 7. 用户兴趣标签表 (user_interest_tag)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_interest_tag (
    id          INT          AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT,
    tag_name    VARCHAR(50),
    create_time TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 8. 爬虫任务表 (crawler_task)
-- =====================================================
CREATE TABLE IF NOT EXISTS crawler_task (
    id          INT          AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100),
    target_url  VARCHAR(500),
    site_name   VARCHAR(100),
    rule        LONGTEXT,
    status      TINYINT      DEFAULT 0,
    crawl_count INT          DEFAULT 0,
    last_run    TIMESTAMP,
    cron_expr   VARCHAR(50),
    remark      VARCHAR(500),
    create_time TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 9. 系统通知表 (sys_notification)
-- =====================================================
CREATE TABLE IF NOT EXISTS sys_notification (
    id          BIGINT       AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT,
    title       VARCHAR(200),
    content     LONGTEXT,
    type        TINYINT      DEFAULT 1,
    is_read     TINYINT      DEFAULT 0,
    create_time TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- 10. 论坛帖子表 (forum_post)
-- =====================================================
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

-- =====================================================
-- 11. 论坛回复表 (forum_reply)
-- =====================================================
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



