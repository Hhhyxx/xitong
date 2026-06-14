package com.competition.common;

/**
 * 竞赛 ID 约定：独立爬虫表 external_crawled_competition.expose id 通过加本偏移映射为虚拟竞赛 ID，
 * 与主表主键隔离（正常数据库存量 id 远小于该值）。
 */
public final class CompetitionConstants {

    /** 合并展示时，外部爬虫行对应的 id = EXTERNAL_ID_BASE + external_crawled_competition.id */
    public static final long EXTERNAL_COMPETITION_ID_BASE = 9_000_000_000L;

    private CompetitionConstants() {}
}
