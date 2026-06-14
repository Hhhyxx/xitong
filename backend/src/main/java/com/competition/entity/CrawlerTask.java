package com.competition.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 爬虫任务实体
 */
@Data
@TableName("crawler_task")
public class CrawlerTask {

    @TableId(type = IdType.AUTO)
    private Integer id;

    /** 任务名称 */
    private String name;

    /** 目标URL */
    private String targetUrl;

    /** 网站名称 */
    private String siteName;

    /** 爬取规则（JSON） */
    private String rule;

    /** 状态 0停止 1运行中 2完成 3失败 */
    private Integer status;

    /** 爬取数量 */
    private Integer crawlCount;

    /** 最后运行时间 */
    private LocalDateTime lastRun;

    /** Cron表达式（定时任务） */
    private String cronExpr;

    /** 备注信息（如失败原因） */
    private String remark;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
