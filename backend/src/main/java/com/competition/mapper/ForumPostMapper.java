package com.competition.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.competition.entity.ForumPost;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface ForumPostMapper extends BaseMapper<ForumPost> {

    @Update("UPDATE forum_post SET view_count = view_count + 1 WHERE id = #{id}")
    void incrementViewCount(Long id);

    @Update("UPDATE forum_post SET reply_count = reply_count + 1 WHERE id = #{id}")
    void incrementReplyCount(Long id);

    @Update("UPDATE forum_post SET like_count = like_count + 1 WHERE id = #{id}")
    void incrementLikeCount(Long id);

    @Update("UPDATE forum_post SET like_count = like_count - 1 WHERE id = #{id}")
    void decrementLikeCount(Long id);

    @Update("UPDATE forum_reply SET deleted = 1 WHERE post_id = #{postId}")
    void deleteRepliesByPostId(Long postId);
}
