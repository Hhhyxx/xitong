package com.competition.common.enums;

import lombok.Getter;

/**
 * 报名状态枚举
 */
@Getter
public enum EnrollmentStatus {

    PENDING(0, "待审核"),
    APPROVED(1, "已通过"),
    REJECTED(2, "已拒绝"),
    CANCELLED(3, "已取消");

    private final int code;
    private final String name;

    EnrollmentStatus(int code, String name) {
        this.code = code;
        this.name = name;
    }

    public static EnrollmentStatus of(Integer code) {
        if (code == null) return PENDING;
        for (EnrollmentStatus s : values()) {
            if (s.code == code) return s;
        }
        return PENDING;
    }
}
