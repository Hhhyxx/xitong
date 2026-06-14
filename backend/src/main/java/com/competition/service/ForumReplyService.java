package com.competition.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.competition.entity.ForumReply;

import java.util.List;

public interface ForumReplyService extends IService<ForumReply> {

    List<ForumReply> getRepliesByPostId(Long postId);

    ForumReply createReply(ForumReply reply, Long userId, String userNickname);

    void deleteReply(Long id, Long userId);

    /**
     * 点赞回复
     * @param id 回复ID
     */
    void likeReply(Long id);
}
