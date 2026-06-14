package com.competition.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 论坛帖子实体
 */
@Data
@TableName("forum_post")
public class ForumPost {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;

    private String userNickname;

    private String title;

    private String content;

    private String category;

    private Integer viewCount;

    private Integer replyCount;

    private Integer likeCount;

    private Integer isTop;

    private Integer isEssence;

    private Integer status;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;

    @TableLogic
    @TableField(fill = FieldFill.INSERT)
    private Integer deleted;
}
