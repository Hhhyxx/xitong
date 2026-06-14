package com.competition.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.File;

/**
 * Web MVC 配置 - 静态资源映射
 * 使上传的文件（获奖证书照片等）可以通过 HTTP 直接访问
 */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Value("${file.upload-path:./uploads/}")
    private String uploadPath;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 将 /uploads/** 映射到实际的文件夹路径
        File uploadDir = new File(uploadPath);
        String absolutePath = uploadDir.getAbsolutePath();
        if (!absolutePath.endsWith("/") && !absolutePath.endsWith("\\")) {
            absolutePath += "/";
        }
        // Windows 路径需要 file:/// 前缀
        String location = "file:" + absolutePath;
        if (!location.endsWith("/")) {
            location += "/";
        }

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(location)
                .setCachePeriod(3600);

        System.out.println("[WebMvcConfig] 静态资源映射: /uploads/** -> " + location);
    }
}
