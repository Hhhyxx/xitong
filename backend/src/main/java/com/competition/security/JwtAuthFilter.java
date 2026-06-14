package com.competition.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtils jwtUtils;
    private final StringRedisTemplate redisTemplate;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String token = getTokenFromRequest(request);

        if (StringUtils.hasText(token) && jwtUtils.validateToken(token)) {
            // 检查 token 是否在黑名单（已登出）
            String blackKey = "token:blacklist:" + token;
            Boolean isBlacklisted = null;
            try {
                isBlacklisted = redisTemplate.hasKey(blackKey);
            } catch (Exception e) {
                // Redis 不可用：安全优先，拒绝请求
                response.setStatus(HttpServletResponse.SC_SERVICE_UNAVAILABLE);
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write("{\"code\":503,\"message\":\"服务暂时不可用，请稍后重试\"}");
                return;
            }
            
            if (Boolean.TRUE.equals(isBlacklisted)) {
                // token 已被加入黑名单，不设置认证信息，相当于未登录
                filterChain.doFilter(request, response);
                return;
            }

            Long userId   = jwtUtils.getUserIdFromToken(token);
            String username = jwtUtils.getUsernameFromToken(token);
            Integer role  = jwtUtils.getRoleFromToken(token);

            // 将角色转换为 Spring Security 权限
            String roleName = switch (role) {
                case 1 -> "ROLE_SUPER_ADMIN";
                case 2 -> "ROLE_ADMIN";
                case 3 -> "ROLE_CERTIFIED";
                default -> "ROLE_USER";
            };

            UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(
                    username,
                    null,
                    List.of(new SimpleGrantedAuthority(roleName))
                );
            authentication.setDetails(userId);
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        filterChain.doFilter(request, response);
    }

    private String getTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}

