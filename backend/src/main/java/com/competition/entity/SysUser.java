package com.competition.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 用户实体
 */
@Data
@TableName("sys_user")
public class SysUser {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 登录账号 */
    private String username;

    /** BCrypt 加密密码（查询时包含，序列化时由VO层屏蔽） */
    private String password;

    /** 昵称 */
    private String nickname;

    /** 真实姓名 */
    private String realName;

    /** 邮箱 */
    private String email;

    /** 手机号 */
    private String phone;

    /** 头像 URL */
    private String avatar;

    /** 性别 0未知 1男 2女 */
    private Integer gender;

    /** 学院 */
    private String college;

    /** 专业 */
    private String major;

    /** 学号 */
    private String studentId;

    /** 年级 */
    private String grade;

    /**
     * 角色：
     * 1 = 高级管理员（开发者）
     * 2 = 管理员（辅导员）
     * 3 = 认证用户
     * 4 = 普通用户
     */
    private Integer role;

    /** 状态 0禁用 1正常 */
    private Integer status;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;

    private LocalDateTime lastLogin;

    @TableLogic
    private Integer deleted;
}
