package com.competition.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 独立爬虫脚本写入的竞赛资讯（仅展示，不参与报名等业务）
 */
@Data
@TableName("external_crawled_competition")
public class ExternalCrawledCompetition {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String title;

    /**
     * 与库列 source_url 对应（MP 默认驼峰映射到 source_url）
     */
    private String sourceUrl;

    private LocalDateTime enrollStart;

    private LocalDateTime enrollEnd;

    private String sourceSite;

    private LocalDateTime crawledAt;
}
