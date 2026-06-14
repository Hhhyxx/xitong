package com.competition.common.exception;

import lombok.Getter;

/**
 * 业务异常
 * 区别于系统异常（RuntimeException），用于可预期的业务错误
 * 使用示例：
 *   throw new BusinessException(404, "竞赛不存在");
 *   throw new BusinessException(409, "您已报名该竞赛");
 *   throw BusinessException.notFound("竞赛");
 *   throw BusinessException.forbidden();
 */
@Getter
public class BusinessException extends RuntimeException {

    private final int code;

    public BusinessException(int code, String message) {
        super(message);
        this.code = code;
    }

    // ---- 快捷工厂方法 ----

    public static BusinessException notFound(String resource) {
        return new BusinessException(404, resource + "不存在");
    }

    public static BusinessException conflict(String message) {
        return new BusinessException(409, message);
    }

    public static BusinessException forbidden() {
        return new BusinessException(403, "权限不足");
    }

    public static BusinessException badRequest(String message) {
        return new BusinessException(400, message);
    }

    public static BusinessException unauthorized() {
        return new BusinessException(401, "请先登录");
    }
}
