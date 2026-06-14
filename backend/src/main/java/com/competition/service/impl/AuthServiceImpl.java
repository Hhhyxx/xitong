package com.competition.service.impl;

import com.competition.dto.LoginDTO;
import com.competition.dto.RegisterDTO;
import com.competition.entity.SysUser;
import com.competition.mapper.SysUserMapper;
import com.competition.security.JwtUtils;
import com.competition.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.ObjectProvider;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final SysUserMapper userMapper;
    private final JwtUtils jwtUtils;
    private final StringRedisTemplate redisTemplate;
    /** 通过 Spring IoC 注入，避免重复实例化（SecurityConfig 中已定义 @Bean） */
    private final BCryptPasswordEncoder passwordEncoder;
    private final ObjectProvider<JavaMailSender> mailSenderProvider;

    @Value("${spring.mail.username:}")
    private String mailFrom;

    @Override
    public String login(LoginDTO dto) {
        String input = dto.getUsername();
        SysUser user = null;
        
        // 先尝试用用户名查询
        user = userMapper.selectByUsername(input);
        
        // 如果没找到，且输入包含@，尝试用邮箱查询
        if (user == null && input.contains("@")) {
            user = userMapper.selectByEmail(input);
        }
        
        if (user == null) {
            throw new RuntimeException("用户名或密码错误");
        }
        if (!passwordEncoder.matches(dto.getPassword(), user.getPassword())) {
            throw new RuntimeException("用户名或密码错误");
        }
        if (user.getStatus() != 1) {
            throw new RuntimeException("账号已被禁用");
        }
        // 更新最后登录时间
        userMapper.updateLastLogin(user.getId());
        return jwtUtils.generateToken(user.getId(), user.getUsername(), user.getRole());
    }

    @Override
    @Transactional
    public void register(RegisterDTO dto) {
        // 检查邮箱是否已存在
        if (userMapper.selectByUsername(dto.getEmail()) != null) {
            throw new RuntimeException("该邮箱已被注册");
        }
        if (userMapper.selectByEmail(dto.getEmail()) != null) {
            throw new RuntimeException("该邮箱已被注册");
        }
        // 检查密码是否一致
        if (!dto.getPassword().equals(dto.getConfirmPassword())) {
            throw new RuntimeException("两次密码输入不一致");
        }
        verifyEmailCode(dto.getEmail(), dto.getEmailCode());

        SysUser user = new SysUser();
        user.setUsername(dto.getEmail()); // 使用邮箱作为用户名
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        user.setNickname(dto.getNickname() != null && !dto.getNickname().trim().isEmpty() ? dto.getNickname() : dto.getEmail().split("@")[0]);
        user.setPhone(dto.getPhone());
        user.setEmail(dto.getEmail());
        user.setCollege(dto.getCollege());
        user.setMajor(dto.getMajor());
        user.setStudentId(dto.getStudentId());
        user.setRole(4); // 默认普通用户
        user.setStatus(1);

        userMapper.insert(user);
        redisTemplate.delete(emailCodeKey(dto.getEmail()));
    }

    @Override
    public void sendSmsCode(String phone) {
        // 生成6位验证码
        String code = String.format("%06d", (int) (Math.random() * 1000000));
        // 存入Redis，5分钟有效；Redis 不可用则不允许发送
        redisTemplate.opsForValue().set("sms:code:" + phone, code, Duration.ofMinutes(5));
        // TODO: 调用短信服务商API发送验证码（当前为开发模式，仅记录Debug日志）
        log.debug("[开发模式] 手机号 {} 的验证码：{}", phone, code);
    }

    @Override
    public void sendEmailCode(String email) {
        if (!StringUtils.hasText(email) || !email.contains("@")) {
            throw new RuntimeException("邮箱格式不正确");
        }
        if (!StringUtils.hasText(mailFrom)) {
            throw new RuntimeException("邮件服务未配置，请先配置 SMTP 邮箱账号");
        }
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            throw new RuntimeException("邮件服务未启用，请先配置 SMTP 邮箱服务器");
        }
        // 生成6位验证码
        String code = String.format("%06d", (int) (Math.random() * 1000000));
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(mailFrom);
        message.setTo(email);
        message.setSubject("竞赛通注册验证码");
        message.setText("您的竞赛通注册验证码是：" + code + "\n\n验证码 5 分钟内有效，请勿转发给他人。");

        try {
            mailSender.send(message);
        } catch (Exception e) {
            log.warn("邮箱验证码发送失败: {}", e.getMessage());
            throw new RuntimeException("验证码邮件发送失败，请检查邮箱地址或 SMTP 配置");
        }

        // 真实邮件发送成功后再存入 Redis，5分钟有效；Redis 不可用则不允许注册
        redisTemplate.opsForValue().set(emailCodeKey(email), code, Duration.ofMinutes(5));
        log.info("邮箱验证码已发送到 {}", email);
    }

    @Override
    @Transactional
    public String loginByPhone(String phone, String code) {
        // Redis不可用会直接抛出异常，不能跳过验证
        String cacheCode = redisTemplate.opsForValue().get("sms:code:" + phone);
        if (cacheCode == null || !cacheCode.equals(code)) {
            throw new RuntimeException("验证码错误或已过期");
        }
        // 验证通过后删除验证码，防止重复使用
        redisTemplate.delete("sms:code:" + phone);
        
        // 根据手机号查找用户
        SysUser user = userMapper.selectByPhone(phone);
        if (user == null) {
            // 用户不存在，自动创建新用户
            user = new SysUser();
            user.setUsername(phone);
            user.setPassword(passwordEncoder.encode(phone)); // 默认密码为手机号
            user.setNickname("用户" + phone.substring(phone.length() - 4));
            user.setPhone(phone);
            user.setRole(4); // 默认普通用户
            user.setStatus(1);
            userMapper.insert(user);
        }
        
        if (user.getStatus() != 1) {
            throw new RuntimeException("账号已被禁用");
        }
        
        // 更新最后登录时间
        userMapper.updateLastLogin(user.getId());
        return jwtUtils.generateToken(user.getId(), user.getUsername(), user.getRole());
    }

    @Override
    @Transactional
    public String loginByEmail(String email, String code) {
        // Redis不可用会直接抛出异常，不能跳过验证
        String cacheCode = redisTemplate.opsForValue().get(emailCodeKey(email));
        if (cacheCode == null || !cacheCode.equals(code)) {
            throw new RuntimeException("验证码错误或已过期");
        }
        // 验证通过后删除验证码，防止重复使用
        redisTemplate.delete(emailCodeKey(email));
        
        // 根据邮箱查找用户
        SysUser user = userMapper.selectByEmail(email);
        if (user == null) {
            // 用户不存在，自动创建新用户
            user = new SysUser();
            user.setUsername(email);
            user.setPassword(passwordEncoder.encode(email)); // 默认密码为邮箱
            user.setNickname("用户" + email.split("@")[0]);
            user.setEmail(email);
            user.setRole(4); // 默认普通用户
            user.setStatus(1);
            userMapper.insert(user);
        }
        
        if (user.getStatus() != 1) {
            throw new RuntimeException("账号已被禁用");
        }
        
        // 更新最后登录时间
        userMapper.updateLastLogin(user.getId());
        return jwtUtils.generateToken(user.getId(), user.getUsername(), user.getRole());
    }

    @Override
    public void logout(String authorization) {
        if (authorization != null && authorization.startsWith("Bearer ")) {
            String token = authorization.substring(7);
            try {
                // 将token加入黑名单
                redisTemplate.opsForValue().set("token:blacklist:" + token, "1",
                        jwtUtils.getExpiration(), TimeUnit.MILLISECONDS);
            } catch (Exception e) {
                // Redis不可用，忽略
            }
        }
    }

    private void verifyEmailCode(String email, String code) {
        String cacheCode = redisTemplate.opsForValue().get(emailCodeKey(email));
        if (cacheCode == null || !cacheCode.equals(code)) {
            throw new RuntimeException("邮箱验证码错误或已过期");
        }
    }

    private String emailCodeKey(String email) {
        return "email:code:" + email;
    }
}
