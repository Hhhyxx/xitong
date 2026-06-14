package com.competition.controller;

import com.competition.common.Result;
import com.competition.dto.LoginDTO;
import com.competition.dto.RegisterDTO;
import com.competition.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 认证接口：登录 / 注册 / 登出
 */
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * 用户名密码登录
     * POST /api/auth/login
     */
    @PostMapping("/login")
    public Result<String> login(@Valid @RequestBody LoginDTO dto) {
        String token = authService.login(dto);
        return Result.ok(token, "登录成功");
    }

    /**
     * 注册
     * POST /api/auth/register
     */
    @PostMapping("/register")
    public Result<Void> register(@Valid @RequestBody RegisterDTO dto) {
        authService.register(dto);
        return Result.ok(null, "注册成功");
    }

    /**
     * 发送手机验证码
     * POST /api/auth/send-code
     */
    @PostMapping("/send-code")
    public Result<Void> sendCode(@RequestParam String phone) {
        authService.sendSmsCode(phone);
        return Result.ok(null, "验证码已发送");
    }

    /**
     * 发送邮箱验证码
     * POST /api/auth/send-email-code
     */
    @PostMapping("/send-email-code")
    public Result<Void> sendEmailCode(@RequestParam String email) {
        authService.sendEmailCode(email);
        return Result.ok(null, "验证码已发送");
    }

    /**
     * 手机验证码登录
     * POST /api/auth/login-phone
     */
    @PostMapping("/login-phone")
    public Result<String> loginByPhone(@RequestParam String phone,
                                       @RequestParam String code) {
        String token = authService.loginByPhone(phone, code);
        return Result.ok(token, "登录成功");
    }

    /**
     * 邮箱验证码登录
     * POST /api/auth/login-email
     */
    @PostMapping("/login-email")
    public Result<String> loginByEmail(@RequestParam String email,
                                       @RequestParam String code) {
        String token = authService.loginByEmail(email, code);
        return Result.ok(token, "登录成功");
    }

    /**
     * 登出（前端清除 token 即可，此接口将 token 加入黑名单）
     * POST /api/auth/logout
     */
    @PostMapping("/logout")
    public Result<Void> logout(@RequestHeader("Authorization") String authorization) {
        authService.logout(authorization);
        return Result.ok(null, "已退出");
    }
}
