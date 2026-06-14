package com.competition.controller;

import com.competition.common.Result;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/file")
@RequiredArgsConstructor
public class FileController {

    @Value("${file.upload-path:./uploads/}")
    private String uploadPath;

    @PostMapping("/upload")
    public Result<Map<String, String>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "type", defaultValue = "general") String type) {
        
        if (file.isEmpty()) {
            return Result.error("请选择要上传的文件");
        }

        // 检查文件大小（最大 2MB）
        if (file.getSize() > 2 * 1024 * 1024) {
            return Result.error("文件大小不能超过 2MB");
        }

        try {
            // 创建上传目录
            String dir = uploadPath + type + "/";
            Path dirPath = Paths.get(dir);
            if (!Files.exists(dirPath)) {
                Files.createDirectories(dirPath);
            }

            // 生成唯一文件名
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null ? 
                originalFilename.substring(originalFilename.lastIndexOf(".")) : ".jpg";
            String newFilename = UUID.randomUUID().toString() + extension;
            
            // 保存文件
            Path filePath = dirPath.resolve(newFilename);
            file.transferTo(filePath.toFile());

            // 返回文件访问 URL
            String fileUrl = "/uploads/" + type + "/" + newFilename;
            return Result.ok(Map.of("url", fileUrl, "filename", newFilename));

        } catch (IOException e) {
            return Result.error("文件上传失败：" + e.getMessage());
        }
    }
}
