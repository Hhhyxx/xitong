package com.competition.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 竞赛分类实体
 */
@Data
@TableName("competition_category")
public class CompetitionCategory {

    @TableId(type = IdType.AUTO)
    private Integer id;

    /** 分类名称 */
    private String name;

    /** 分类图标 */
    private String icon;

    /** 排序 */
    private Integer sort;

    /** 状态 0禁用 1正常 */
    private Integer status;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}
