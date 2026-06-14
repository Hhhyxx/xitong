package com.competition.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.competition.common.Result;
import com.competition.entity.Competition;
import com.competition.security.JwtUtils;
import com.competition.service.CompetitionService;
import com.competition.vo.CompetitionVO;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Calendar;


/**
 * 竞赛接口
 */
@RestController
@RequestMapping("/competition")
@RequiredArgsConstructor
public class CompetitionController {

    private final CompetitionService competitionService;
    private final JwtUtils jwtUtils;

    /**
     * 分页查询竞赛列表
     */
    @GetMapping("/list")
    public Result<Page<CompetitionVO>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer categoryId,
            @RequestParam(required = false) Integer level,
            @RequestParam(defaultValue = "true") boolean includeExternal) {
        Page<CompetitionVO> result = (Page<CompetitionVO>) competitionService.listCompetitions(
                new Page<>(page, size), keyword, categoryId, level, includeExternal);
        return Result.ok(result);
    }

    /**
     * 获取最新竞赛
     */
    @GetMapping("/latest")
    public Result<List<CompetitionVO>> latest(@RequestParam(defaultValue = "6") int limit) {
        return Result.ok(competitionService.getLatest(limit));
    }

    /**
     * 获取热门竞赛
     */
    @GetMapping("/hot")
    public Result<List<CompetitionVO>> hot(@RequestParam(defaultValue = "6") int limit) {
        return Result.ok(competitionService.getHot(limit));
    }

    /**
     * 获取分类下的竞赛
     */
    @GetMapping("/category/{categoryId}")
    public Result<List<CompetitionVO>> byCategory(@PathVariable Integer categoryId) {
        return Result.ok(competitionService.getByCategory(categoryId));
    }

    /**
     * 按月份查询报名中的竞赛（以报名开始时间 startTime 所在月份为准）
     */
    @GetMapping("/by-month")
    public Result<List<CompetitionVO>> listByMonth(
            @RequestParam Integer year,
            @RequestParam Integer month) {
        List<CompetitionVO> all = competitionService.getLatest(9999);
        return Result.ok(all.stream().filter(c -> {
            // 优先使用 startTime，其次 endTime
            java.time.LocalDateTime t = c.getStartTime() != null ? c.getStartTime() : c.getEndTime();
            if (t == null) return false;
            return t.getYear() == year && t.getMonthValue() == month;
        }).toList());
    }


	
	@GetMapping("/{id}")
    public Result<CompetitionVO> detail(@PathVariable Long id,
                                        @RequestHeader(value = "Authorization", required = false) String authorization) {
        Long userId = null;
        if (authorization != null && authorization.startsWith("Bearer ")) {
            try {
                userId = jwtUtils.getUserIdFromToken(authorization.substring(7));
            } catch (Exception ignored) {
            }
        }
        return Result.ok(competitionService.getDetail(id, userId));
    }

    /**
     * 创建竞赛（管理员）
     */
    @PostMapping
    public Result<Competition> create(@RequestBody Competition competition) {
        return Result.ok(competitionService.saveCompetition(competition), "创建成功");
    }

    /**
     * 更新竞赛（管理员）
     */
    @PutMapping("/{id}")
    public Result<Competition> update(@PathVariable Long id, @RequestBody Competition competition) {
        competition.setId(id);
        return Result.ok(competitionService.saveCompetition(competition), "更新成功");
    }

    /**
     * 删除竞赛（管理员）
     */
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        competitionService.deleteCompetition(id);
        return Result.ok(null, "删除成功");
    }
}
