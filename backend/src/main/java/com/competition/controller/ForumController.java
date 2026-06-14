package com.competition.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.competition.common.Result;
import com.competition.entity.ForumPost;
import com.competition.entity.ForumReply;
import com.competition.security.JwtUtils;
import com.competition.service.ForumPostService;
import com.competition.service.ForumReplyService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/forum")
@RequiredArgsConstructor
public class ForumController {

    private final ForumPostService forumPostService;
    private final ForumReplyService forumReplyService;
    private final JwtUtils jwtUtils;

    /**
     * 获取帖子列表
     */
    @GetMapping("/posts")
    public Result<Page<ForumPost>> getPosts(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String keyword) {
        Page<ForumPost> result = forumPostService.getPostPage(page, size, category, keyword);
        return Result.ok(result);
    }

    /**
     * 获取帖子详情（含回复）
     */
    @GetMapping("/post/{id}")
    public Result<Map<String, Object>> getPostDetail(@PathVariable Long id) {
        ForumPost post = forumPostService.getPostDetail(id);
        List<ForumReply> replies = forumReplyService.getRepliesByPostId(id);

        Map<String, Object> result = new HashMap<>();
        result.put("post", post);
        result.put("replies", replies);
        return Result.ok(result);
    }

    /**
     * 发布帖子
     */
    @PostMapping("/post")
    public Result<ForumPost> createPost(@RequestBody ForumPost post, HttpServletRequest request) {
        Long userId = jwtUtils.getUserIdFromRequest(request);
        String nickname = jwtUtils.getUsernameFromRequest(request);
        ForumPost saved = forumPostService.createPost(post, userId, nickname);
        return Result.ok(saved, "发帖成功");
    }

    /**
     * 删除帖子
     */
    @DeleteMapping("/post/{id}")
    public Result<Void> deletePost(@PathVariable Long id,
                                   @RequestHeader("Authorization") String authorization) {
        String token = authorization.replace("Bearer ", "");
        Long userId = jwtUtils.getUserIdFromToken(token);
        Integer role = jwtUtils.getRoleFromToken(token);
        boolean isAdmin = role != null && role <= 2;
        forumPostService.deletePost(id, userId, isAdmin);
        return Result.ok(null, "删除成功");
    }

    /**
     * 发布回复
     */
    @PostMapping("/reply")
    public Result<ForumReply> createReply(@RequestBody ForumReply reply, HttpServletRequest request) {
        Long userId = jwtUtils.getUserIdFromRequest(request);
        String nickname = jwtUtils.getUsernameFromRequest(request);
        ForumReply saved = forumReplyService.createReply(reply, userId, nickname);
        return Result.ok(saved, "回复成功");
    }

    /**
     * 删除回复
     */
    @DeleteMapping("/reply/{id}")
    public Result<Void> deleteReply(@PathVariable Long id, HttpServletRequest request) {
        Long userId = jwtUtils.getUserIdFromRequest(request);
        forumReplyService.deleteReply(id, userId);
        return Result.ok(null);
    }

    /**
     * 点赞帖子
     */
    @PostMapping("/post/{id}/like")
    public Result<Void> likePost(@PathVariable Long id) {
        forumPostService.likePost(id);
        return Result.ok(null, "点赞成功");
    }

    /**
     * 点赞回复
     */
    @PostMapping("/reply/{id}/like")
    public Result<Void> likeReply(@PathVariable Long id) {
        forumReplyService.likeReply(id);
        return Result.ok(null, "点赞成功");
    }
}
