package com.competition.common.enums;

import lombok.Getter;

/**
 * 竞赛状态枚举
 */
@Getter
public enum CompetitionStatus {

    OFFLINE(0, "已下线"),
    ONLINE(1, "正常");

    private final int code;
    private final String name;

    CompetitionStatus(int code, String name) {
        this.code = code;
        this.name = name;
    }

    public static CompetitionStatus of(Integer code) {
        if (code == null) return ONLINE;
        for (CompetitionStatus s : values()) {
            if (s.code == code) return s;
        }
        return ONLINE;
    }
}
