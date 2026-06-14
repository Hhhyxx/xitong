package com.competition.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.competition.common.Result;
import com.competition.entity.SysNotification;
import com.competition.mapper.SysNotificationMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 公告/通知接口
 */
@RestController
@RequestMapping("/notice")
@RequiredArgsConstructor
public class NotificationController {

    private final SysNotificationMapper notificationMapper;

    /**
     * 获取公告列表（登录用户可见自己的 + 全体公告）
     */
    @GetMapping("/list")
    public Result<List<SysNotification>> list(Authentication auth) {
        if (auth == null) {
            // 未登录：只返回全体公告（userId IS NULL）
            LambdaQueryWrapper<SysNotification> wrapper = new LambdaQueryWrapper<SysNotification>()
                    .isNull(SysNotification::getUserId)
                    .orderByDesc(SysNotification::getCreateTime);
            return Result.ok(notificationMapper.selectList(wrapper));
        }
        Long userId = getUserId(auth);
        return Result.ok(notificationMapper.selectByUserId(userId));
    }

    /**
     * 发布公告（管理员）
     */
    @PostMapping
    public Result<SysNotification> publish(@RequestBody SysNotification notice) {
        notice.setIsRead(0);
        notificationMapper.insert(notice);
        return Result.ok(notice, "公告发布成功");
    }

    /**
     * 删除公告（管理员）
     */
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        notificationMapper.deleteById(id);
        return Result.ok(null, "删除成功");
    }

    /**
     * 标记已读
     */
    @PutMapping("/{id}/read")
    public Result<Void> markRead(@PathVariable Long id, Authentication auth) {
        if (auth != null) {
            notificationMapper.markAsRead(id, getUserId(auth));
        }
        return Result.ok(null);
    }

    /**
     * 获取未读数量
     */
    @GetMapping("/unread-count")
    public Result<Integer> unreadCount(Authentication auth) {
        if (auth == null) return Result.ok(0);
        return Result.ok(notificationMapper.countUnread(getUserId(auth)));
    }

    private Long getUserId(Authentication auth) {
        // JWT 中 username 存的是用户 ID（数字字符串）
        try {
            return Long.parseLong(auth.getName());
        } catch (NumberFormatException e) {
            return 0L;
        }
    }
}
