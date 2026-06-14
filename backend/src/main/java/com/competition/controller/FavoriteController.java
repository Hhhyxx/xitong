package com.competition.controller;

import com.competition.common.Result;
import com.competition.security.JwtUtils;
import com.competition.service.FavoriteService;
import com.competition.vo.FavoriteVO;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 收藏接口
 */
@RestController
@RequestMapping("/favorite")
@RequiredArgsConstructor
public class FavoriteController {

    private final FavoriteService favoriteService;
    private final JwtUtils jwtUtils;

    /**
     * 添加收藏
     */
    @PostMapping("/{competitionId}")
    public Result<Void> add(@RequestHeader("Authorization") String authorization,
                            @PathVariable Long competitionId) {
        Long userId = jwtUtils.getUserIdFromToken(authorization.replace("Bearer ", ""));
        favoriteService.addFavorite(userId, competitionId);
        return Result.ok(null, "收藏成功");
    }

    /**
     * 取消收藏
     */
    @DeleteMapping("/{competitionId}")
    public Result<Void> remove(@RequestHeader("Authorization") String authorization,
                               @PathVariable Long competitionId) {
        Long userId = jwtUtils.getUserIdFromToken(authorization.replace("Bearer ", ""));
        favoriteService.removeFavorite(userId, competitionId);
        return Result.ok(null, "取消收藏成功");
    }

    /**
     * 获取收藏列表
     */
    @GetMapping("/list")
    public Result<List<FavoriteVO>> list(@RequestHeader("Authorization") String authorization) {
        Long userId = jwtUtils.getUserIdFromToken(authorization.replace("Bearer ", ""));
        return Result.ok(favoriteService.listFavorites(userId));
    }

    /**
     * 检查是否已收藏
     */
    @GetMapping("/check/{competitionId}")
    public Result<Boolean> check(@RequestHeader("Authorization") String authorization,
                                  @PathVariable Long competitionId) {
        Long userId = jwtUtils.getUserIdFromToken(authorization.replace("Bearer ", ""));
        return Result.ok(favoriteService.isFavorited(userId, competitionId));
    }
}
