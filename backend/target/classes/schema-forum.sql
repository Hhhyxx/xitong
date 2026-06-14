-- =====================================================
-- 论坛功能 - 数据库表设计
-- =====================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- 论坛帖子表 (forum_post)
-- =====================================================
CREATE TABLE IF NOT EXISTS forum_post (
    id              BIGINT          AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT          NOT NULL COMMENT '发帖用户ID',
    user_nickname   VARCHAR(50)     COMMENT '发帖用户昵称（冗余存储，方便展示）',
    title           VARCHAR(200)    NOT NULL COMMENT '帖子标题',
    content         LONGTEXT        NOT NULL COMMENT '帖子内容',
    category        VARCHAR(50)     DEFAULT 'general' COMMENT '帖子分类：general-综合讨论, competition-赛事讨论, experience-经验分享, question-问题求助',
    view_count      INT             DEFAULT 0 COMMENT '浏览次数',
    reply_count     INT             DEFAULT 0 COMMENT '回复次数',
    like_count      INT             DEFAULT 0 COMMENT '点赞次数',
    is_top          TINYINT         DEFAULT 0 COMMENT '是否置顶：0-否，1-是',
    is_essence      TINYINT         DEFAULT 0 COMMENT '是否精华：0-否，1-是',
    status          TINYINT         DEFAULT 1 COMMENT '状态：0-禁用，1-正常',
    create_time     TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    update_time     TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted         TINYINT         DEFAULT 0 COMMENT '逻辑删除：0-未删除，1-已删除'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='论坛帖子表';

-- =====================================================
-- 论坛回复表 (forum_reply)
-- =====================================================
CREATE TABLE IF NOT EXISTS forum_reply (
    id              BIGINT          AUTO_INCREMENT PRIMARY KEY,
    post_id         BIGINT          NOT NULL COMMENT '所属帖子ID',
    user_id         BIGINT          NOT NULL COMMENT '回复用户ID',
    user_nickname   VARCHAR(50)     COMMENT '回复用户昵称',
    content         TEXT            NOT NULL COMMENT '回复内容',
    parent_id       BIGINT          DEFAULT NULL COMMENT '父回复ID（用于楼中楼回复）',
    like_count      INT             DEFAULT 0 COMMENT '点赞次数',
    status          TINYINT         DEFAULT 1 COMMENT '状态：0-禁用，1-正常',
    create_time     TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    update_time     TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted         TINYINT         DEFAULT 0 COMMENT '逻辑删除'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='论坛回复表';

-- =====================================================
-- 论坛点赞表 (forum_like)
-- =====================================================
CREATE TABLE IF NOT EXISTS forum_like (
    id              BIGINT          AUTO_INCREMENT PRIMARY KEY,
    target_type     VARCHAR(20)     NOT NULL COMMENT '点赞目标类型：post-帖子，reply-回复',
    target_id       BIGINT          NOT NULL COMMENT '点赞目标ID',
    user_id         BIGINT          NOT NULL COMMENT '点赞用户ID',
    create_time     TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_like (target_type, target_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='论坛点赞表';

SET FOREIGN_KEY_CHECKS = 1;
