package com.competition.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.IService;
import com.competition.entity.ForumPost;

public interface ForumPostService extends IService<ForumPost> {

    Page<ForumPost> getPostPage(Integer page, Integer size, String category, String keyword);

    ForumPost getPostDetail(Long id);

    ForumPost createPost(ForumPost post, Long userId, String userNickname);

    /** @param isAdmin 角色 1/2 可删除任意帖子，否则仅能删除本人帖子 */
    void deletePost(Long id, Long userId, boolean isAdmin);

    /**
     * 点赞帖子
     * @param id 帖子ID
     */
    void likePost(Long id);
}
