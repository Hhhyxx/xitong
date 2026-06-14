-- =====================================================
-- 大学生竞赛管理系统 - MySQL 数据库设计
-- Database: competition_system
-- Version: 1.0.0
-- =====================================================

CREATE DATABASE IF NOT EXISTS competition_system DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE competition_system;

-- =====================================================
-- 1. 用户表 (sys_user)
-- =====================================================
CREATE TABLE sys_user (
    id          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '用户ID',
    username    VARCHAR(50)  NOT NULL COMMENT '账号（登录用）',
    password    VARCHAR(255) NOT NULL COMMENT '密码（BCrypt加密）',
    nickname    VARCHAR(50)  DEFAULT NULL COMMENT '昵称',
    real_name   VARCHAR(50)  DEFAULT NULL COMMENT '真实姓名',
    email       VARCHAR(100) DEFAULT NULL COMMENT '邮箱',
    phone       VARCHAR(20)  DEFAULT NULL COMMENT '手机号',
    avatar      VARCHAR(500) DEFAULT NULL COMMENT '头像URL',
    gender      TINYINT      DEFAULT 0   COMMENT '性别 0未知 1男 2女',
    college     VARCHAR(100) DEFAULT NULL COMMENT '学院',
    major       VARCHAR(100) DEFAULT NULL COMMENT '专业',
    student_id  VARCHAR(30)  DEFAULT NULL COMMENT '学号',
    grade       VARCHAR(20)  DEFAULT NULL COMMENT '年级',
    role        TINYINT      NOT NULL DEFAULT 3 COMMENT '角色 1高级管理员 2管理员(辅导员) 3认证用户 4普通用户',
    status      TINYINT      NOT NULL DEFAULT 1 COMMENT '状态 0禁用 1正常',
    create_time DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    last_login  DATETIME     DEFAULT NULL COMMENT '最后登录时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_username (username),
    KEY idx_role (role),
    KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- =====================================================
-- 2. 竞赛分类表 (competition_category)
-- =====================================================
CREATE TABLE competition_category (
    id          INT          NOT NULL AUTO_INCREMENT COMMENT '分类ID',
    name        VARCHAR(50)  NOT NULL COMMENT '分类名称',
    icon        VARCHAR(100) DEFAULT NULL COMMENT '分类图标',
    sort        INT          DEFAULT 0   COMMENT '排序',
    status      TINYINT      DEFAULT 1   COMMENT '状态 0禁用 1正常',
    create_time DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='竞赛分类表';

-- =====================================================
-- 3. 竞赛信息表 (competition)
-- =====================================================
CREATE TABLE competition (
    id           BIGINT       NOT NULL AUTO_INCREMENT COMMENT '竞赛ID',
    title        VARCHAR(200) NOT NULL COMMENT '竞赛标题',
    category_id  INT          DEFAULT NULL COMMENT '分类ID',
    cover        VARCHAR(500) DEFAULT NULL COMMENT '封面图片URL',
    organizer    VARCHAR(200) DEFAULT NULL COMMENT '主办方',
    start_time   DATETIME     DEFAULT NULL COMMENT '报名开始时间',
    end_time     DATETIME     DEFAULT NULL COMMENT '报名截止时间',
    comp_time    VARCHAR(100) DEFAULT NULL COMMENT '竞赛时间描述',
    level        TINYINT      DEFAULT 1   COMMENT '级别 1校级 2省级 3国家级 4国际级',
    source_url   VARCHAR(500) DEFAULT NULL COMMENT '原始链接',
    description  TEXT         DEFAULT NULL COMMENT '竞赛描述',
    tags         VARCHAR(200) DEFAULT NULL COMMENT '标签（逗号分隔）',
    is_crawled   TINYINT      DEFAULT 0   COMMENT '是否爬取 0手动 1爬取',
    source_site  VARCHAR(100) DEFAULT NULL COMMENT '来源网站',
    status       TINYINT      DEFAULT 1   COMMENT '状态 0下线 1正常',
    view_count   INT          DEFAULT 0   COMMENT '浏览次数',
    enroll_count INT          DEFAULT 0   COMMENT '报名人数',
    create_time  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    KEY idx_category (category_id),
    KEY idx_status (status),
    KEY idx_end_time (end_time),
    FULLTEXT KEY ft_title (title)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='竞赛信息表';

-- =====================================================
-- 4. 竞赛报名表 (competition_enrollment)
-- =====================================================
CREATE TABLE competition_enrollment (
    id             BIGINT       NOT NULL AUTO_INCREMENT COMMENT '报名ID',
    competition_id BIGINT       NOT NULL COMMENT '竞赛ID',
    user_id        BIGINT       NOT NULL COMMENT '用户ID',
    team_name      VARCHAR(100) DEFAULT NULL COMMENT '团队名称',
    team_members   VARCHAR(500) DEFAULT NULL COMMENT '团队成员（JSON）',
    remark         VARCHAR(500) DEFAULT NULL COMMENT '备注',
    status         TINYINT      DEFAULT 0 COMMENT '审核状态 0待审核 1通过 2拒绝',
    enroll_time    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '报名时间',
    update_time    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_comp_user (competition_id, user_id),
    KEY idx_competition (competition_id),
    KEY idx_user (user_id),
    KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='竞赛报名表';

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
