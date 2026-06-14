package com.competition.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDate;

/**
 * 获奖记录DTO
 */
@Data
public class AwardRecordDTO {

    private Long id;

    private Long competitionId;

    @NotBlank(message = "竞赛名称不能为空")
    private String compName;

    private String awardLevel;

    private LocalDate awardTime;

    private String certificate;

    private String description;

    private String photoUrl;  // 获奖证书照片 URL

    private String source;  // 来源：self=学生自填，admin=管理员录入

    private Long targetUserId;  // 管理员录入时可指定目标学生ID

}
