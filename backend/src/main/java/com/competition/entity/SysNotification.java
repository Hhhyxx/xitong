package com.competition.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 系统通知实体
 */
@Data
@TableName("sys_notification")
public class SysNotification {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 目标用户（NULL=全体） */
    private Long userId;

    /** 标题 */
    private String title;

    /** 内容 */
    private String content;

    /** 类型 1系统 2报名状态 3竞赛提醒 */
    private Integer type;

    /** 是否已读 */
    private Integer isRead;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}
