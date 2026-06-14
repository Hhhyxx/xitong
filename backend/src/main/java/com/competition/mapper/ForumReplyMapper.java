package com.competition.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.competition.entity.ForumReply;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;

@Mapper
public interface ForumReplyMapper extends BaseMapper<ForumReply> {

    @Select("SELECT * FROM forum_reply WHERE post_id = #{postId} AND deleted = 0 ORDER BY create_time ASC")
    List<ForumReply> selectByPostId(Long postId);

    @Update("UPDATE forum_reply SET like_count = like_count + 1 WHERE id = #{id}")
    void incrementLikeCount(Long id);

    @Update("UPDATE forum_reply SET like_count = like_count - 1 WHERE id = #{id}")
    void decrementLikeCount(Long id);
}
