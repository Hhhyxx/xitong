package com.competition.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 竞赛报名实体
 */
@Data
@TableName("competition_enrollment")
public class CompetitionEnrollment {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 竞赛ID */
    private Long competitionId;

    /** 用户ID */
    private Long userId;

    /** 团队名称 */
    private String teamName;

    /** 团队成员（JSON格式） */
    private String teamMembers;

    /** 备注 */
    private String remark;

    /** 审核状态 0待审核 1通过 2拒绝 */
    private Integer status;

    /** 报名时用户信息快照（即使后续用户信息变更也能追溯） */
    @TableField("student_id")
    private String studentId;

    @TableField("real_name")
    private String realName;

    @TableField("college")
    private String college;

    @TableField("major")
    private String major;

    @TableField("phone")
    private String phone;

    /** 报名时间 - 映射到数据库 create_time 列 */
    @TableField(value = "create_time", fill = FieldFill.INSERT)
    private LocalDateTime enrollTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
