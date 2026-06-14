package com.competition.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 获奖记录实体
 */
@Data
@TableName("award_record")
public class AwardRecord {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 用户ID */
	@TableField("user_id")
    private Long userId;

    /** 关联竞赛ID（可选） */
    private Long competitionId;

    /** 竞赛名称 */
	@TableField("comp_name")
    private String compName;

    /** 获奖等级（一等奖/二等奖等） */
	@TableField("award_level")
    private String awardLevel;

    /** 获奖时间 */
	@TableField("award_time")
    private LocalDate awardTime;

    /** 证书图片URL */
    private String certificate;

    /** 描述 */
    private String description;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
	
	/** 获奖证书照片URL */
	@TableField("photo_url")
	private String photoUrl;

	/** 来源：self=学生自填，admin=管理员录入 */
	@TableField("source")
	private String source;

	/** 审核状态：0=待审核，1=已审核公开 */
	@TableField("status")
	private Integer status;

}
