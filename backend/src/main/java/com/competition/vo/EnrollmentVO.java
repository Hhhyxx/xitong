package com.competition.vo;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * 报名信息视图对象
 */
@Data
public class EnrollmentVO {
    private Long id;
    private Long competitionId;
    private String competitionTitle;
    private Long userId;
    private String username;
    private String realName;
    private String studentId;
    private String college;
    private String major;
    private String phone;
    private String email;
    private String teamName;
    private String teamMembers;
    private String remark;
    private Integer status;
    private String statusName;
    private LocalDateTime enrollTime;
}
