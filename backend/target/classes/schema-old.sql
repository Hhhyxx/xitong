-- =====================================================
-- 大学生竞赛管理系统 - H2 数据库设计
-- =====================================================

CREATE TABLE sys_user (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE,
    password VARCHAR(255),
    nickname VARCHAR(50),
    real_name VARCHAR(50),
    email VARCHAR(100),
    phone VARCHAR(20),
    avatar VARCHAR(500),
    gender TINYINT DEFAULT 0,
    college VARCHAR(100),
    major VARCHAR(100),
    student_id VARCHAR(30),
    grade VARCHAR(20),
    role TINYINT DEFAULT 3,
    status TINYINT DEFAULT 1,
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

CREATE TABLE competition_category (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    icon VARCHAR(100),
    sort INT DEFAULT 0,
    status TINYINT DEFAULT 1,
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE competition (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    category_id INT,
    cover VARCHAR(500),
    organizer VARCHAR(200),
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    comp_time VARCHAR(100),
    level TINYINT DEFAULT 1,
    source_url VARCHAR(500),
    description CLOB,
    tags VARCHAR(200),
    is_crawled TINYINT DEFAULT 0,
    source_site VARCHAR(100),
    status TINYINT DEFAULT 1,
    view_count INT DEFAULT 0,
    enroll_count INT DEFAULT 0,
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE competition_enrollment (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    competition_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    team_name VARCHAR(100),
    team_members VARCHAR(500),
    remark VARCHAR(500),
    status TINYINT DEFAULT 0,
    enroll_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (competition_id, user_id)
);-- =====================================================
-- 大学生竞赛管理系统 - H2 数据库设计
-- Database: competition_system
-- Version: 1.0.0
-- =====================================================

-- =====================================================
-- 1. 用户表 (sys_user)
-- =====================================================
CREATE TABLE sys_user (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    username    VARCHAR(50)  NOT NULL,
    password    VARCHAR(255) NOT NULL,
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
    role        TINYINT      NOT NULL DEFAULT 3,
    status      TINYINT      NOT NULL DEFAULT 1,
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login  TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE (username)
);

-- =====================================================
-- 2. 竞赛分类表 (competition_category)
-- =====================================================
CREATE TABLE competition_category (
    id          INT          NOT NULL AUTO_INCREMENT,
    name        VARCHAR(50)  NOT NULL,
    icon        VARCHAR(100),
    sort        INT          DEFAULT 0,
    status      TINYINT      DEFAULT 1,
    create_time TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- =====================================================
-- 3. 竞赛信息表 (competition)
-- =====================================================
CREATE TABLE competition (
    id           BIGINT       NOT NULL AUTO_INCREMENT,
    title        VARCHAR(200) NOT NULL,
    category_id  INT,
    cover        VARCHAR(500),
    organizer    VARCHAR(200),
    start_time   TIMESTAMP,
    end_time     TIMESTAMP,
    comp_time    VARCHAR(100),
    level        TINYINT      DEFAULT 1,
    source_url   VARCHAR(500),
    description  CLOB,
    tags         VARCHAR(200),
    is_crawled   TINYINT      DEFAULT 0,
    source_site  VARCHAR(100),
    status       TINYINT      DEFAULT 1,
    view_count   INT          DEFAULT 0,
    enroll_count INT          DEFAULT 0,
    create_time  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- =====================================================
-- 4. 竞赛报名表 (competition_enrollment)
-- =====================================================
CREATE TABLE competition_enrollment (
    id             BIGINT       NOT NULL AUTO_INCREMENT,
    competition_id BIGINT       NOT NULL,
    user_id        BIGINT       NOT NULL,
    team_name      VARCHAR(100),
    team_members   VARCHAR(500),
    remark         VARCHAR(500),
    status         TINYINT      DEFAULT 0,
    enroll_time    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE (competition_id, user_id)
);-- =====================================================
-- 大学生竞赛管理系统 - H2 数据库设计
-- Database: competition_system
-- Version: 1.0.0
-- =====================================================

-- =====================================================
-- 1. 用户表 (sys_user)
-- =====================================================
CREATE TABLE sys_user (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    username    VARCHAR(50)  NOT NULL,
    password    VARCHAR(255) NOT NULL,
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
    role        TINYINT      NOT NULL DEFAULT 3,
    status      TINYINT      NOT NULL DEFAULT 1,
    create_time TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login  TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE (username)
);

-- =====================================================
-- 2. 竞赛分类表 (competition_category)
-- =====================================================
CREATE TABLE competition_category (
    id          INT          NOT NULL AUTO_INCREMENT,
    name        VARCHAR(50)  NOT NULL,
    icon        VARCHAR(100),
    sort        INT          DEFAULT 0,
    status      TINYINT      DEFAULT 1,
    create_time TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- =====================================================
-- 3. 竞赛信息表 (competition)
-- =====================================================
CREATE TABLE competition (
    id           BIGINT       NOT NULL AUTO_INCREMENT,
    title        VARCHAR(200) NOT NULL,
    category_id  INT,
    cover        VARCHAR(500),
    organizer    VARCHAR(200),
    start_time   TIMESTAMP,
    end_time     TIMESTAMP,
    comp_time    VARCHAR(100),
    level        TINYINT      DEFAULT 1,
    source_url   VARCHAR(500),
    description  CLOB,
    tags         VARCHAR(200),
    is_crawled   TINYINT      DEFAULT 0,
    source_site  VARCHAR(100),
    status       TINYINT      DEFAULT 1,
    view_count   INT          DEFAULT 0,
    enroll_count INT          DEFAULT 0,
    create_time  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- =====================================================
-- 4. 竞赛报名表 (competition_enrollment)
-- =====================================================
CREATE TABLE competition_enrollment (
    id             BIGINT       NOT NULL AUTO_INCREMENT,
    competition_id BIGINT       NOT NULL,
    user_id        BIGINT       NOT NULL,
    team_name      VARCHAR(100),
    team_members   VARCHAR(500),
    remark         VARCHAR(500),
    status         TINYINT      DEFAULT 0,
    enroll_time    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE (competition_id, user_id)
);

-- =====================================================
-- 5. 竞赛收藏表 (competition_favorite)
-- =====================================================
CREATE TABLE competition_favorite (
    id             BIGINT   NOT NULL AUTO_INCREMENT COMMENT '收藏ID',
    user_id        BIGINT   NOT NULL COMMENT '用户ID',
    competition_id BIGINT   NOT NULL COMMENT '竞赛ID',
    create_time    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '收藏时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_user_comp (user_id, competition_id),
    KEY idx_user (user_id),
    KEY idx_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='竞赛收藏表';

-- =====================================================
-- 6. 获奖记录表 (award_record)
-- =====================================================
CREATE TABLE award_record (
    id             BIGINT       NOT NULL AUTO_INCREMENT COMMENT '记录ID',
    user_id        BIGINT       NOT NULL COMMENT '用户ID',
    competition_id BIGINT       DEFAULT NULL COMMENT '关联竞赛ID（可选）',
    comp_name      VARCHAR(200) NOT NULL COMMENT '竞赛名称',
    award_level    VARCHAR(50)  DEFAULT NULL COMMENT '获奖等级（一等奖/二等奖等）',
    award_time     DATE         DEFAULT NULL COMMENT '获奖时间',
    certificate    VARCHAR(500) DEFAULT NULL COMMENT '证书图片URL',
    description    VARCHAR(500) DEFAULT NULL COMMENT '描述',
    create_time    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='获奖记录表';

-- =====================================================
-- 7. 用户兴趣标签表 (user_interest_tag)
-- =====================================================
CREATE TABLE user_interest_tag (
    id          INT          NOT NULL AUTO_INCREMENT COMMENT '标签ID',
    user_id     BIGINT       NOT NULL COMMENT '用户ID',
    tag_name    VARCHAR(50)  NOT NULL COMMENT '标签名称',
    create_time DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户兴趣标签表';

-- =====================================================
-- 8. 爬虫任务表 (crawler_task)
-- =====================================================
CREATE TABLE crawler_task (
    id          INT          NOT NULL AUTO_INCREMENT COMMENT '任务ID',
    name        VARCHAR(100) NOT NULL COMMENT '任务名称',
    target_url  VARCHAR(500) NOT NULL COMMENT '目标URL',
    site_name   VARCHAR(100) DEFAULT NULL COMMENT '网站名称',
    rule        TEXT         DEFAULT NULL COMMENT '爬取规则（JSON）',
    status      TINYINT      DEFAULT 0   COMMENT '状态 0停止 1运行中 2完成 3失败',
    crawl_count INT          DEFAULT 0   COMMENT '爬取数量',
    last_run    DATETIME     DEFAULT NULL COMMENT '最后运行时间',
    cron_expr   VARCHAR(50)  DEFAULT NULL COMMENT 'Cron表达式（定时任务）',
    create_time DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='爬虫任务表';

-- =====================================================
-- 9. 系统通知表 (sys_notification)
-- =====================================================
CREATE TABLE sys_notification (
    id          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '通知ID',
    user_id     BIGINT       DEFAULT NULL COMMENT '目标用户（NULL=全体）',
    title       VARCHAR(200) NOT NULL COMMENT '标题',
    content     TEXT         DEFAULT NULL COMMENT '内容',
    type        TINYINT      DEFAULT 1   COMMENT '类型 1系统 2报名状态 3竞赛提醒',
    is_read     TINYINT      DEFAULT 0   COMMENT '是否已读',
    create_time DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_user (user_id),
    KEY idx_is_read (is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统通知表';

-- =====================================================
-- 初始数据
-- =====================================================

-- 超级管理员账号（密码: admin123，BCrypt加密）
INSERT INTO sys_user (username, password, nickname, role, status) VALUES
('admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBpwTTyxuNNUiO', '超级管理员', 1, 1),
('teacher01', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBpwTTyxuNNUiO', '张老师', 2, 1);

-- 竞赛分类
INSERT INTO competition_category (name, icon, sort) VALUES
('数学建模', '📐', 1),
('程序设计', '💻', 2),
('创新创业', '🚀', 3),
('电子设计', '🔌', 4),
('机器人', '🤖', 5),
('数据科学', '📊', 6),
('人文社科', '📚', 7),
('艺术设计', '🎨', 8);

-- 爬虫任务配置
INSERT INTO crawler_task (name, target_url, site_name, cron_expr) VALUES
('全国大学生数学建模竞赛', 'http://www.mcm.edu.cn/', 'MCM官网', '0 0 6 * * ?'),
('中国高校计算机大赛', 'https://www.ccf.org.cn/', 'CCF官网', '0 0 6 * * ?'),
('全国大学生创新创业大赛', 'https://cy.ncss.cn/', '互联网+官网', '0 0 6 * * ?'),
('蓝桥杯程序设计竞赛', 'https://www.lanqiao.cn/', '蓝桥杯官网', '0 0 6 * * ?'),
('中国机器人大赛', 'https://robo.com.cn/', '机器人大赛官网', '0 0 6 * * ?');
