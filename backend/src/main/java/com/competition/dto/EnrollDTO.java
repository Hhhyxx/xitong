package com.competition.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 报名请求DTO
 */
@Data
public class EnrollDTO {

    @NotNull(message = "竞赛ID不能为空")
    private Long competitionId;

    private String teamName;
    private String teamMembers;
    private String remark;

    // === 用户信息快照（报名时附带，确保管理员端能显示） ===
    private String studentId;
    private String realName;
    private String college;
    private String major;
    private String phone;
}
