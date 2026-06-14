package com.competition.common.enums;

import lombok.Getter;

/**
 * 竞赛级别枚举
 */
@Getter
public enum CompetitionLevel {

    SCHOOL(1, "校级"),
    PROVINCE(2, "省级"),
    NATIONAL(3, "国家级"),
    INTERNATIONAL(4, "国际级");

    private final int code;
    private final String name;

    CompetitionLevel(int code, String name) {
        this.code = code;
        this.name = name;
    }

    public static String nameOf(Integer code) {
        if (code == null) return "其他";
        for (CompetitionLevel l : values()) {
            if (l.code == code) return l.name;
        }
        return "其他";
    }
}
