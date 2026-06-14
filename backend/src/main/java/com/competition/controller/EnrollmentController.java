package com.competition.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.competition.common.Result;
import com.competition.dto.EnrollDTO;
import com.competition.security.JwtUtils;
import com.competition.service.EnrollmentService;
import com.competition.vo.EnrollmentVO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 报名接口
 */
@RestController
@RequestMapping("/enrollment")
@RequiredArgsConstructor
public class EnrollmentController {

    private final EnrollmentService enrollmentService;
    private final JwtUtils jwtUtils;

    /**
     * 报名
     */
    @PostMapping
    public Result<Void> enroll(@RequestHeader("Authorization") String authorization,
                                @Valid @RequestBody EnrollDTO dto) {
        Long userId = jwtUtils.getUserIdFromToken(authorization.replace("Bearer ", ""));
        enrollmentService.enroll(userId, dto);
        return Result.ok(null, "报名成功");
    }

    /**
     * 管理员删除报名记录（按报名主键 id）
     */
    @DeleteMapping("/admin/{id}")
    public Result<Void> deleteByAdmin(@PathVariable Long id) {
        enrollmentService.deleteByAdmin(id);
        return Result.ok(null, "删除成功");
    }

    /**
     * 取消报名（路径为竞赛 id，勿与 /admin/{id} 混淆）
     */
    @DeleteMapping("/{competitionId}")
    public Result<Void> cancel(@RequestHeader("Authorization") String authorization,
                                @PathVariable Long competitionId) {
        Long userId = jwtUtils.getUserIdFromToken(authorization.replace("Bearer ", ""));
        enrollmentService.cancelEnroll(userId, competitionId);
        return Result.ok(null, "取消报名成功");
    }

    /**
     * 查询当前用户自己的报名记录
     */
    @GetMapping("/my")
    public Result<List<EnrollmentVO>> myList(
            @RequestHeader("Authorization") String authorization,
            @RequestParam(required = false) Integer status) {
        Long userId = jwtUtils.getUserIdFromToken(authorization.replace("Bearer ", ""));
        return Result.ok(enrollmentService.listMyEnrollments(userId, status));
    }

    /**
     * 查询报名列表（管理员）
     */
    @GetMapping("/list")
    public Result<Page<EnrollmentVO>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Long compId,
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) String keyword) {
        Page<EnrollmentVO> result = (Page<EnrollmentVO>) enrollmentService.listEnrollments(
                new Page<>(page, size), compId, status, keyword);
        return Result.ok(result);
    }

    /**
     * 导出报名数据
     */
    @GetMapping("/export")
    public Result<List<EnrollmentVO>> export(
            @RequestParam(required = false) Long compId,
            @RequestParam(required = false) Integer status) {
        return Result.ok(enrollmentService.listForExport(compId, status));
    }

    /**
     * 审核通过
     */
    @PutMapping("/{id}/approve")
    public Result<Void> approve(@PathVariable Long id) {
        enrollmentService.approve(id);
        return Result.ok(null, "审核通过");
    }

    /**
     * 审核拒绝
     */
    @PutMapping("/{id}/reject")
    public Result<Void> reject(@PathVariable Long id, @RequestParam String reason) {
        enrollmentService.reject(id, reason);
        return Result.ok(null, "已拒绝");
    }
}
