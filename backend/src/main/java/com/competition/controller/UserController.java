package com.competition.controller;

import com.competition.common.Result;
import com.competition.dto.ChangePasswordDTO;
import com.competition.dto.UpdateUserDTO;
import com.competition.security.JwtUtils;
import com.competition.service.UserService;
import com.competition.vo.UserVO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 用户接口
 */
@RestController
@RequestMapping("/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final JwtUtils jwtUtils;

    /**
     * 获取当前用户信息
     */
    @GetMapping("/info")
    public Result<UserVO> getUserInfo(@RequestHeader("Authorization") String authorization) {
        Long userId = jwtUtils.getUserIdFromToken(authorization.replace("Bearer ", ""));
        return Result.ok(userService.getCurrentUser(userId));
    }

    /**
     * 更新用户信息
     */
    @PutMapping("/info")
    public Result<Void> updateUserInfo(@RequestHeader("Authorization") String authorization,
                                        @RequestBody UpdateUserDTO dto) {
        Long userId = jwtUtils.getUserIdFromToken(authorization.replace("Bearer ", ""));
        userService.updateUser(userId, dto);
        return Result.ok(null, "更新成功");
    }

    /**
     * 修改密码
     */
    @PutMapping("/password")
    public Result<Void> changePassword(@RequestHeader("Authorization") String authorization,
                                        @Valid @RequestBody ChangePasswordDTO dto) {
        Long userId = jwtUtils.getUserIdFromToken(authorization.replace("Bearer ", ""));
        userService.changePassword(userId, dto);
        return Result.ok(null, "密码修改成功");
    }

    /**
     * 获取用户兴趣标签
     */
    @GetMapping("/tags")
    public Result<List<String>> getUserTags(@RequestHeader("Authorization") String authorization) {
        Long userId = jwtUtils.getUserIdFromToken(authorization.replace("Bearer ", ""));
        return Result.ok(userService.getUserTags(userId));
    }

    /**
     * 更新用户兴趣标签
     */
    @PutMapping("/tags")
    public Result<Void> updateUserTags(@RequestHeader("Authorization") String authorization,
                                        @RequestBody List<String> tags) {
        Long userId = jwtUtils.getUserIdFromToken(authorization.replace("Bearer ", ""));
        userService.updateUserTags(userId, tags);
        return Result.ok(null, "标签更新成功");
    }
}
