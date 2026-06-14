-- =====================================================
-- 大学生竞赛管理系统 - MySQL 数据库初始化
-- =====================================================

-- 用户表
CREATE TABLE IF NOT EXISTS sys_user (
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
    deleted     TINYINT      DEFAULT 0 COMMENT '逻辑删除 0正常 1删除',
    PRIMARY KEY (id),
    UNIQUE KEY uk_username (username),
    KEY idx_role (role),
    KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 竞赛分类表
CREATE TABLE IF NOT EXISTS competition_category (
    id          INT          NOT NULL AUTO_INCREMENT COMMENT '分类ID',
    name        VARCHAR(50)  NOT NULL COMMENT '分类名称',
    icon        VARCHAR(100) DEFAULT NULL COMMENT '分类图标',
    sort        INT          DEFAULT 0   COMMENT '排序',
    status      TINYINT      DEFAULT 1   COMMENT '状态 0禁用 1正常',
    create_time DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted     TINYINT      DEFAULT 0 COMMENT '逻辑删除',
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='竞赛分类表';

-- 竞赛信息表
CREATE TABLE IF NOT EXISTS competition (
    id           BIGINT       NOT NULL AUTO_INCREMENT COMMENT '竞赛ID',
    title        VARCHAR(200) NOT NULL COMMENT '竞赛标题',
    category_id  INT          DEFAULT NULL COMMENT '分类ID',
    level        TINYINT      DEFAULT 1 COMMENT '级别 1校级 2省级 3国家级',
    level_name   VARCHAR(50)  DEFAULT NULL COMMENT '级别名称',
    organizer    VARCHAR(200) DEFAULT NULL COMMENT '主办单位',
    description  TEXT         DEFAULT NULL COMMENT '竞赛描述',
    requirements TEXT         DEFAULT NULL COMMENT '参赛要求',
    start_time   DATETIME     DEFAULT NULL COMMENT '报名开始时间',
    end_time     DATETIME     DEFAULT NULL COMMENT '报名截止时间',
    contest_time DATETIME     DEFAULT NULL COMMENT '比赛时间',
    location     VARCHAR(200) DEFAULT NULL COMMENT '比赛地点',
    url          VARCHAR(500) DEFAULT NULL COMMENT '官网链接',
    cover_image  VARCHAR(500) DEFAULT NULL COMMENT '封面图片',
    tags         VARCHAR(500) DEFAULT NULL COMMENT '标签',
    source_url   VARCHAR(500) DEFAULT NULL COMMENT '来源URL',
    is_crawled   TINYINT      DEFAULT 0 COMMENT '是否爬取',
    source_site  VARCHAR(100) DEFAULT NULL COMMENT '来源网站',
    status       TINYINT      DEFAULT 1 COMMENT '状态 0草稿 1已发布 2已结束',
    view_count   INT          DEFAULT 0 COMMENT '浏览次数',
    favorite_count INT        DEFAULT 0 COMMENT '收藏数',
    enroll_count INT          DEFAULT 0 COMMENT '报名人数',
    create_by    BIGINT       DEFAULT NULL COMMENT '创建人ID',
    create_time  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted      TINYINT      DEFAULT 0 COMMENT '逻辑删除',
    PRIMARY KEY (id),
    KEY idx_category (category_id),
    KEY idx_level (level),
    KEY idx_status (status),
    KEY idx_end_time (end_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='竞赛信息表';

-- 报名表
CREATE TABLE IF NOT EXISTS competition_enrollment (
    id              BIGINT       NOT NULL AUTO_INCREMENT COMMENT '报名ID',
    user_id         BIGINT       NOT NULL COMMENT '用户ID',
    competition_id  BIGINT       NOT NULL COMMENT '竞赛ID',
    team_name       VARCHAR(100) DEFAULT NULL COMMENT '团队名称',
    team_members    VARCHAR(500) DEFAULT NULL COMMENT '团队成员（JSON格式）',
    student_id      VARCHAR(30)  DEFAULT NULL COMMENT '学号（报名时快照）',
    real_name       VARCHAR(50)  DEFAULT NULL COMMENT '真实姓名（报名时快照）',
    college         VARCHAR(100) DEFAULT NULL COMMENT '学院（报名时快照）',
    major           VARCHAR(100) DEFAULT NULL COMMENT '专业（报名时快照）',
    phone           VARCHAR(20)  DEFAULT NULL COMMENT '联系电话',
    remark          VARCHAR(500) DEFAULT NULL COMMENT '备注',
    status          TINYINT      DEFAULT 0 COMMENT '状态 0待审核 1已通过 2已拒绝',
    reject_reason   VARCHAR(500) DEFAULT NULL COMMENT '拒绝原因',
    create_time     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted         TINYINT      DEFAULT 0 COMMENT '逻辑删除',
    PRIMARY KEY (id),
    UNIQUE KEY uk_user_comp (user_id, competition_id, deleted),
    KEY idx_competition (competition_id),
    KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='报名表';

-- 收藏表
CREATE TABLE IF NOT EXISTS competition_favorite (
    id             BIGINT   NOT NULL AUTO_INCREMENT,
    user_id        BIGINT   NOT NULL COMMENT '用户ID',
    competition_id BIGINT   NOT NULL COMMENT '竞赛ID',
    create_time    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted        TINYINT  DEFAULT 0 COMMENT '逻辑删除',
    PRIMARY KEY (id),
    UNIQUE KEY uk_user_comp (user_id, competition_id, deleted),
    KEY idx_user (user_id),
    KEY idx_competition (competition_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='收藏表';

-- 获奖记录表
CREATE TABLE IF NOT EXISTS award_record (
    id             BIGINT       NOT NULL AUTO_INCREMENT COMMENT '记录ID',
    user_id        BIGINT       NOT NULL COMMENT '用户ID',
    competition_id BIGINT       DEFAULT NULL COMMENT '竞赛ID',
    comp_name      VARCHAR(200) DEFAULT NULL COMMENT '竞赛名称（冗余）',
    award_level    VARCHAR(50)  DEFAULT NULL COMMENT '获奖等级名称（一等奖/二等奖等）',
    award_time     DATE         DEFAULT NULL COMMENT '获奖日期',
    certificate    VARCHAR(500) DEFAULT NULL COMMENT '证书图片URL',
    photo_url      LONGTEXT       DEFAULT NULL COMMENT '获奖证书照片URL或base64',
    source         VARCHAR(20)  DEFAULT 'self' COMMENT '来源 self=学生自填 admin=管理员录入',
    status         TINYINT      DEFAULT 0 COMMENT '0=待审核 1=已审核公开',
    description    VARCHAR(500) DEFAULT NULL COMMENT '描述',
    create_time    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted        TINYINT      DEFAULT 0 COMMENT '逻辑删除',
    PRIMARY KEY (id),
    KEY idx_user (user_id),
    KEY idx_competition (competition_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='获奖记录表';

-- 用户兴趣标签表
CREATE TABLE IF NOT EXISTS user_interest_tag (
    id          BIGINT   NOT NULL AUTO_INCREMENT,
    user_id     BIGINT   NOT NULL COMMENT '用户ID',
    tag_name    VARCHAR(50) NOT NULL COMMENT '标签名称',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted     TINYINT  DEFAULT 0 COMMENT '逻辑删除',
    PRIMARY KEY (id),
    UNIQUE KEY uk_user_tag (user_id, tag_name, deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户兴趣标签表';

-- 系统通知表
CREATE TABLE IF NOT EXISTS sys_notification (
    id          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '通知ID',
    user_id     BIGINT       DEFAULT NULL COMMENT '接收用户ID（null为全体）',
    title       VARCHAR(200) NOT NULL COMMENT '标题',
    content     TEXT         DEFAULT NULL COMMENT '内容',
    type        TINYINT      DEFAULT 1 COMMENT '类型 1系统通知 2竞赛提醒 3审核通知',
    is_read     TINYINT      DEFAULT 0 COMMENT '是否已读 0否 1是',
    create_time DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted     TINYINT      DEFAULT 0 COMMENT '逻辑删除',
    PRIMARY KEY (id),
    KEY idx_user (user_id),
    KEY idx_is_read (is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统通知表';

-- 插入默认分类数据
INSERT IGNORE INTO competition_category (id, name, icon, sort) VALUES
(1, '程序设计', '💻', 1),
(2, '数学建模', '📐', 2),
(3, '创新创业', '🚀', 3),
(4, '电子设计', '⚡', 4),
(5, '机器人', '🤖', 5),
(6, '英语竞赛', '📚', 6),
(7, '艺术设计', '🎨', 7),
(8, '商业策划', '📊', 8);

-- 插入默认管理员账号（密码: admin123）
INSERT IGNORE INTO sys_user (id, username, password, nickname, real_name, role, status) VALUES
(1, 'admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EO', '系统管理员', '管理员', 1, 1);

-- 插入示例竞赛数据
INSERT IGNORE INTO competition (id, title, category_id, level, level_name, organizer, description, start_time, end_time, status, view_count) VALUES
(1, '第十六届蓝桥杯全国软件和信息技术专业人才大赛', 1, 3, '国家级', '工业和信息化部人才交流中心', '蓝桥杯是全国性的IT学科赛事，旨在推动软件开发技术的发展，促进软件专业技术人才培养。', '2025-10-01 00:00:00', '2026-04-10 23:59:59', 1, 12580),
(2, '2026年全国大学生数学建模竞赛', 2, 3, '国家级', '中国工业与应用数学学会', '全国大学生数学建模竞赛是全国高校规模最大的基础性学科竞赛。', '2026-05-01 00:00:00', '2026-09-12 23:59:59', 1, 8920),
(3, '第十四届全国大学生电子商务创新创意创业挑战赛', 3, 3, '国家级', '教育部高等学校电子商务类专业教学指导委员会', '激发大学生兴趣与潜能，培养大学生创新意识、创意思维、创业能力以及团队协同实战精神。', '2025-12-01 00:00:00', '2026-03-31 23:59:59', 1, 7560);
