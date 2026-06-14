package com.competition.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 竞赛信息实体
 */
@Data
@TableName("competition")
public class Competition {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 竞赛标题 */
    private String title;

    /** 分类ID */
    private Integer categoryId;

    /** 封面图片URL - 数据库字段为cover_image */
    @TableField("cover_image")
    private String cover;

    /** 主办方 */
    private String organizer;

    /** 报名开始时间 */
    private LocalDateTime startTime;

    /** 报名截止时间 */
    private LocalDateTime endTime;

    /** 竞赛时间描述 - 数据库字段为contest_time */
    @TableField("contest_time")
    private String compTime;

    /** 级别 1校级 2省级 3国家级 4国际级 */
    private Integer level;

    /** 级别名称 */
    @TableField("level_name")
    private String levelName;

    /** 原始链接 - 数据库字段为url */
    @TableField("url")
    private String url;

    /** 来源URL - 爬虫用，数据库字段为source_url */
    @TableField("source_url")
    private String sourceUrl;

    /** 竞赛描述 */
    private String description;

    /** 参赛要求 */
    @TableField("requirements")
    private String requirements;

    /** 竞赛地点 */
    @TableField("location")
    private String location;

    /** 标签（逗号分隔） */
    private String tags;

    /** 是否爬取 0手动 1爬取 */
    private Integer isCrawled;

    /** 来源网站 */
    private String sourceSite;

    /** 状态 0下线 1正常 */
    private Integer status;

    /** 浏览次数 */
    private Integer viewCount;

    /** 收藏次数 */
    @TableField("favorite_count")
    private Integer favoriteCount;

    /** 报名人数 */
    private Integer enrollCount;

    /** 创建人ID */
    @TableField("create_by")
    private Long createBy;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;

    /** 逻辑删除字段 */
    @TableLogic
    private Integer deleted;
}
