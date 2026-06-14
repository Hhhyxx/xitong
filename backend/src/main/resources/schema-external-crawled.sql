-- 独立爬虫脚本写入的竞赛资讯表（与主业务 competition 表分离，仅只读展示）
CREATE TABLE IF NOT EXISTS external_crawled_competition (
    id            BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键',
    title         VARCHAR(500) NOT NULL COMMENT '竞赛标题',
    source_url    VARCHAR(500) NOT NULL COMMENT '官方/来源链接',
    enroll_start  DATETIME     DEFAULT NULL COMMENT '报名开始时间',
    enroll_end    DATETIME     DEFAULT NULL COMMENT '报名截止时间',
    source_site   VARCHAR(100) DEFAULT NULL COMMENT '来源站点名称',
    crawled_at    DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT '爬取入库时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_source_url (source_url(191))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='外部爬虫竞赛资讯（独立脚本写入）';
