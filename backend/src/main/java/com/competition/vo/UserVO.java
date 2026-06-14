package com.competition.vo;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 用户信息视图对象
 */
@Data
public class UserVO {
    private Long id;
    private String username;
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
    private Integer role;
    private String roleName;
    private Integer status;
    private LocalDateTime createTime;
    private LocalDateTime lastLogin;
    private List<String> interestTags;
}
