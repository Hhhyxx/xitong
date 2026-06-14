package com.competition.vo;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * 收藏信息视图对象
 */
@Data
public class FavoriteVO {
    private Long id;
    private Long competitionId;
    private String title;
    private String cover;
    private String organizer;
    private LocalDateTime endTime;
    private String compTime;
    private Integer level;
    private String levelName;
    private LocalDateTime createTime;
}
