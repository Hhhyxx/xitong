package com.competition.controller;

import com.competition.common.Result;
import com.competition.dto.AwardRecordDTO;
import com.competition.entity.AwardRecord;
import com.competition.security.JwtUtils;
import com.competition.service.AwardRecordService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 获奖记录接口
 */
@RestController
@RequestMapping("/award")
@RequiredArgsConstructor
public class AwardRecordController {

    private final AwardRecordService awardRecordService;
    private final JwtUtils jwtUtils;

    /**
     * 获取指定用户的公开获奖记录（论坛用，任何人可查看）
     */
    @GetMapping("/user/{userId}")
    public Result<List<AwardRecord>> listByUser(@PathVariable Long userId) {
        return Result.ok(awardRecordService.listPublicByUserId(userId));
    }

    /**
     * 获取用户获奖记录
     */
    @GetMapping("/list")
    public Result<List<AwardRecord>> list(@RequestHeader("Authorization") String authorization) {
        Long userId = jwtUtils.getUserIdFromToken(authorization.replace("Bearer ", ""));
        return Result.ok(awardRecordService.listByUser(userId));
    }

    /**
     * 获取所有获奖记录（管理员用）
     */
    @GetMapping("/all")
    public Result<List<Map<String, Object>>> listAll(@RequestHeader("Authorization") String authorization) {
        return Result.ok(awardRecordService.listAllWithUserInfo());
    }

    /**
     * 添加获奖记录
     * - 普通用户：自动使用当前登录用户ID
     * - 管理员（role <= 2）：可通过 targetUserId 为指定学生添加获奖记录
     */
    @PostMapping
    public Result<AwardRecord> add(@RequestHeader("Authorization") String authorization,
                                   @Valid @RequestBody AwardRecordDTO dto) {
        Long userId = jwtUtils.getUserIdFromToken(authorization.replace("Bearer ", ""));
        Integer role = jwtUtils.getRoleFromToken(authorization.replace("Bearer ", ""));
        boolean isAdmin = (role != null && role <= 2);

        // 管理员可以为指定学生添加获奖记录
        Long targetUserId = userId;
        if (isAdmin && dto.getTargetUserId() != null) {
            targetUserId = dto.getTargetUserId();
        }

        // 管理员录入时强制设置 source 为 admin
        if (isAdmin && dto.getTargetUserId() != null && !dto.getTargetUserId().equals(userId)) {
            dto.setSource("admin");
        }

        return Result.ok(awardRecordService.addRecord(targetUserId, dto), "添加成功");
    }

    /**
     * 更新获奖记录
     */
    @PutMapping("/{id}")
    public Result<AwardRecord> update(@RequestHeader("Authorization") String authorization,
                                      @PathVariable Long id,
                                      @Valid @RequestBody AwardRecordDTO dto) {
        Long userId = jwtUtils.getUserIdFromToken(authorization.replace("Bearer ", ""));
        dto.setId(id);
        return Result.ok(awardRecordService.updateRecord(userId, dto), "更新成功");
    }

    /**
     * 删除获奖记录
     * - 普通用户只能删除自己的记录
     * - 管理员（role <= 2）可以删除任意记录
     */
    @DeleteMapping("/{id}")
    public Result<Void> delete(@RequestHeader("Authorization") String authorization,
                               @PathVariable Long id) {
        Long userId = jwtUtils.getUserIdFromToken(authorization.replace("Bearer ", ""));
        Integer role = jwtUtils.getRoleFromToken(authorization.replace("Bearer ", ""));
        boolean isAdmin = (role != null && role <= 2);
        awardRecordService.deleteRecord(userId, id, isAdmin);
        return Result.ok(null, "删除成功");
    }

    /**
     * 审核通过获奖记录（管理员专用）
     */
    @PutMapping("/{id}/approve")
    public Result<AwardRecord> approve(@RequestHeader("Authorization") String authorization,
                                       @PathVariable Long id) {
        Integer role = jwtUtils.getRoleFromToken(authorization.replace("Bearer ", ""));
        if (role == null || role > 2) {
            throw new RuntimeException("无权限操作");
        }
        return Result.ok(awardRecordService.approveRecord(id), "审核通过");
    }
}
