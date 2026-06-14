package com.competition.vo;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * 竞赛信息视图对象
 */
@Data
public class CompetitionVO {
    private Long id;
    private String title;
    private Integer categoryId;
    private String categoryName;
    private String cover;
    private String organizer;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String compTime;
    private Integer level;
    private String levelName;
    private String sourceUrl;
    private String description;
    private String tags;
    private Integer status;
    private Integer viewCount;
    private Integer enrollCount;
    private LocalDateTime createTime;
    private Boolean isFavorited;
    private Boolean isEnrolled;
}
