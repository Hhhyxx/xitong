package com.competition.config;

import com.competition.security.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity   // 支持 @PreAuthorize 注解
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final CorsConfig corsConfig;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // ---- 完全公开的接口 ----
                .requestMatchers("/auth/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/competition/list").permitAll()
                .requestMatchers(HttpMethod.GET, "/competition/latest").permitAll()
                .requestMatchers(HttpMethod.GET, "/competition/hot").permitAll()
                .requestMatchers(HttpMethod.GET, "/competition/category/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/competition/{id}").permitAll()
                .requestMatchers(HttpMethod.GET, "/category/list").permitAll()
                .requestMatchers(HttpMethod.GET, "/forum/posts").permitAll()
                .requestMatchers(HttpMethod.GET, "/forum/post/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/notice/list").permitAll()
                .requestMatchers(HttpMethod.GET, "/competition/by-month").permitAll()
                .requestMatchers(HttpMethod.GET, "/award/user/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/uploads/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/file/**").permitAll()

                // ---- 需要管理员权限的接口（角色 1 或 2）----
                .requestMatchers(HttpMethod.POST, "/notice").hasAnyAuthority("ROLE_ADMIN", "ROLE_SUPER_ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/notice/**").hasAnyAuthority("ROLE_ADMIN", "ROLE_SUPER_ADMIN")
                .requestMatchers(HttpMethod.POST, "/competition").hasAnyAuthority("ROLE_ADMIN", "ROLE_SUPER_ADMIN")
                .requestMatchers(HttpMethod.PUT, "/competition/**").hasAnyAuthority("ROLE_ADMIN", "ROLE_SUPER_ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/competition/**").hasAnyAuthority("ROLE_ADMIN", "ROLE_SUPER_ADMIN")
                .requestMatchers("/crawler/**").hasAnyAuthority("ROLE_ADMIN", "ROLE_SUPER_ADMIN")
                .requestMatchers("/enrollment/list").hasAnyAuthority("ROLE_ADMIN", "ROLE_SUPER_ADMIN")
                .requestMatchers("/enrollment/export").hasAnyAuthority("ROLE_ADMIN", "ROLE_SUPER_ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/enrollment/admin/**").hasAnyAuthority("ROLE_ADMIN", "ROLE_SUPER_ADMIN")
                .requestMatchers("/enrollment/*/approve").hasAnyAuthority("ROLE_ADMIN", "ROLE_SUPER_ADMIN")
                .requestMatchers("/enrollment/*/reject").hasAnyAuthority("ROLE_ADMIN", "ROLE_SUPER_ADMIN")

                // ---- 其余接口需要登录 ----
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public org.springframework.web.cors.CorsConfigurationSource corsConfigurationSource() {
        org.springframework.web.cors.CorsConfiguration config = new org.springframework.web.cors.CorsConfiguration();
        config.setAllowCredentials(true);
        config.addAllowedOriginPattern("*");
        config.addAllowedHeader("*");
        config.addAllowedMethod("*");
        config.addExposedHeader("Authorization");

        org.springframework.web.cors.UrlBasedCorsConfigurationSource source = new org.springframework.web.cors.UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}

