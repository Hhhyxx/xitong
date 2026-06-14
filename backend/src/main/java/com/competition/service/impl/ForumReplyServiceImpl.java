package com.competition.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.competition.common.exception.BusinessException;
import com.competition.entity.ForumPost;
import com.competition.entity.ForumReply;
import com.competition.mapper.ForumPostMapper;
import com.competition.mapper.ForumReplyMapper;
import com.competition.service.ForumReplyService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ForumReplyServiceImpl extends ServiceImpl<ForumReplyMapper, ForumReply> implements ForumReplyService {

    private final ForumReplyMapper forumReplyMapper;
    private final ForumPostMapper forumPostMapper;

    @Override
    public List<ForumReply> getRepliesByPostId(Long postId) {
        return forumReplyMapper.selectByPostId(postId);
    }

    @Override
    @Transactional
    public ForumReply createReply(ForumReply reply, Long userId, String userNickname) {
        // 检查帖子是否存在
        ForumPost post = forumPostMapper.selectById(reply.getPostId());
        if (post == null || post.getDeleted() == 1) {
            throw new BusinessException(404, "帖子不存在或已被删除");
        }

        reply.setUserId(userId);
        reply.setUserNickname(userNickname);
        reply.setLikeCount(0);
        reply.setStatus(1);
        reply.setDeleted(0);

        this.save(reply);

        // 增加帖子回复数
        forumPostMapper.incrementReplyCount(reply.getPostId());
        return reply;
    }

    @Override
    public void deleteReply(Long id, Long userId) {
        ForumReply reply = this.getById(id);
        if (reply == null) {
            throw new BusinessException(404, "回复不存在");
        }
        // 只能删除自己的回复
        if (!reply.getUserId().equals(userId)) {
            throw new BusinessException(403, "无权删除他人回复");
        }
        this.removeById(id);
    }

    @Override
    public void likeReply(Long id) {
        ForumReply reply = this.getById(id);
        if (reply == null || reply.getDeleted() == 1) {
            throw new BusinessException(404, "回复不存在或已被删除");
        }
        forumReplyMapper.incrementLikeCount(id);
    }
}
