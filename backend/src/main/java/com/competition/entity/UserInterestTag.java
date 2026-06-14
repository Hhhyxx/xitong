package com.competition.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 用户兴趣标签实体
 */
@Data
@TableName("user_interest_tag")
public class UserInterestTag {

    @TableId(type = IdType.AUTO)
    private Integer id;

    /** 用户ID */
    private Long userId;

    /** 标签名称 */
    private String tagName;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}
