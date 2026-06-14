package com.competition.dto;

import lombok.Data;

/**
 * 更新用户信息DTO
 */
@Data
public class UpdateUserDTO {
    private String nickname;
    private String realName;
    private String email;
    private String phone;
    private String avatar;
    private Integer gender;
    private String college;
    private String major;
    private String studentId;
    private String grade;
}
