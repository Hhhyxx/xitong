package com.competition.controller;

import com.competition.common.Result;
import com.competition.service.CrawlerService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 爬虫管理接口（仅限高级管理员和管理员）
 */
@RestController
@RequestMapping("/crawler")
@RequiredArgsConstructor
public class CrawlerController {

    private final CrawlerService crawlerService;

    /**
     * 获取所有爬虫任务
     * GET /api/crawler/tasks
     */
    @GetMapping("/tasks")
    public Result<?> listTasks() {
        return Result.ok(crawlerService.listTasks());
    }

    /**
     * 立即执行某个爬虫任务
     * POST /api/crawler/tasks/{id}/run
     */
    @PostMapping("/tasks/{id}/run")
    public Result<Void> runTask(@PathVariable Integer id) {
        crawlerService.runTask(id);
        return Result.ok(null, "爬虫任务已启动");
    }

    /**
     * 启动任务（修改状态为运行）
     * PUT /api/crawler/tasks/{id}/start
     */
    @PutMapping("/tasks/{id}/start")
    public Result<Void> startTask(@PathVariable Integer id) {
        crawlerService.startTask(id);
        return Result.ok(null, "任务已启动");
    }

    /**
     * 停止任务
     * PUT /api/crawler/tasks/{id}/stop
     */
    @PutMapping("/tasks/{id}/stop")
    public Result<Void> stopTask(@PathVariable Integer id) {
        crawlerService.stopTask(id);
        return Result.ok(null, "任务已停止");
    }

    /**
     * 添加爬虫任务
     * POST /api/crawler/tasks
     */
    @PostMapping("/tasks")
    public Result<Void> addTask(@RequestBody com.competition.entity.CrawlerTask task) {
        crawlerService.addTask(task);
        return Result.ok(null, "任务创建成功");
    }

    /**
     * 删除爬虫任务
     * DELETE /api/crawler/tasks/{id}
     */
    @DeleteMapping("/tasks/{id}")
    public Result<Void> deleteTask(@PathVariable Integer id) {
        crawlerService.deleteTask(id);
        return Result.ok(null, "任务已删除");
    }

    /**
     * 查询爬虫实时进度
     * GET /api/crawler/tasks/{id}/progress
     */
    @GetMapping("/tasks/{id}/progress")
    public Result<?> progress(@PathVariable Integer id) {
        return Result.ok(crawlerService.getProgress(id));
    }

    /**
     * 获取爬虫任务爬取的竞赛数据
     * GET /api/crawler/tasks/{id}/competitions
     */
    @GetMapping("/tasks/{id}/competitions")
    public Result<?> getTaskCompetitions(@PathVariable Integer id) {
        return Result.ok(crawlerService.getTaskCompetitions(id));
    }
}
