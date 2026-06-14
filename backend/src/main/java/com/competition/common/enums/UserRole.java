package com.competition.common.enums;

import lombok.Getter;

/**
 * 用户角色枚举
 * 替代代码中的魔法数字 1/2/3/4
 */
@Getter
public enum UserRole {

    SUPER_ADMIN(1, "高级管理员", "ROLE_SUPER_ADMIN"),
    ADMIN(2, "管理员", "ROLE_ADMIN"),
    CERTIFIED(3, "认证用户", "ROLE_CERTIFIED"),
    USER(4, "普通用户", "ROLE_USER");

    private final int code;
    private final String name;
    private final String authority;

    UserRole(int code, String name, String authority) {
        this.code = code;
        this.name = name;
        this.authority = authority;
    }

    public static UserRole of(Integer code) {
        if (code == null) return USER;
        for (UserRole r : values()) {
            if (r.code == code) return r;
        }
        return USER;
    }

    /** 是否具有管理员或以上权限 */
    public boolean isAdmin() {
        return this == SUPER_ADMIN || this == ADMIN;
    }
}
