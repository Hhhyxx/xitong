package com.competition.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.competition.common.exception.BusinessException;
import com.competition.entity.ForumPost;
import com.competition.mapper.ForumPostMapper;
import com.competition.service.ForumPostService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class ForumPostServiceImpl extends ServiceImpl<ForumPostMapper, ForumPost> implements ForumPostService {

    private final ForumPostMapper forumPostMapper;

    @Override
    public Page<ForumPost> getPostPage(Integer page, Integer size, String category, String keyword) {
        LambdaQueryWrapper<ForumPost> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ForumPost::getStatus, 1)
               .eq(ForumPost::getDeleted, 0);

        if (StringUtils.hasText(category) && !"all".equals(category)) {
            wrapper.eq(ForumPost::getCategory, category);
        }

        if (StringUtils.hasText(keyword)) {
            wrapper.and(w -> w.like(ForumPost::getTitle, keyword)
                             .or()
                             .like(ForumPost::getContent, keyword));
        }

        // 置顶帖子优先，然后按时间倒序
        wrapper.orderByDesc(ForumPost::getIsTop)
               .orderByDesc(ForumPost::getCreateTime);

        return this.page(new Page<>(page, size), wrapper);
    }

    @Override
    public ForumPost getPostDetail(Long id) {
        ForumPost post = this.getById(id);
        if (post == null || post.getDeleted() == 1 || post.getStatus() == 0) {
            throw new BusinessException(404, "帖子不存在或已被删除");
        }
        // 增加浏览量
        forumPostMapper.incrementViewCount(id);
        post.setViewCount(post.getViewCount() + 1);
        return post;
    }

    @Override
    public ForumPost createPost(ForumPost post, Long userId, String userNickname) {
        post.setUserId(userId);
        post.setUserNickname(userNickname);
        post.setViewCount(0);
        post.setReplyCount(0);
        post.setLikeCount(0);
        post.setIsTop(0);
        post.setIsEssence(0);
        post.setStatus(1);
        post.setDeleted(0);

        this.save(post);
        return post;
    }

    @Override
    @Transactional
    public void deletePost(Long id, Long userId, boolean isAdmin) {
        ForumPost post = this.getById(id);
        if (post == null) {
            throw new BusinessException(404, "帖子不存在");
        }
        if (!isAdmin && !post.getUserId().equals(userId)) {
            throw new BusinessException(403, "无权删除他人帖子");
        }
        // 级联删除该帖子的所有回复
        forumPostMapper.deleteRepliesByPostId(id);
        // 删除帖子
        this.removeById(id);
    }

    @Override
    public void likePost(Long id) {
        ForumPost post = this.getById(id);
        if (post == null || post.getDeleted() == 1 || post.getStatus() == 0) {
            throw new BusinessException(404, "帖子不存在或已被删除");
        }
        forumPostMapper.incrementLikeCount(id);
    }
}
