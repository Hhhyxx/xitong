package com.competition.service.impl;

import com.competition.dto.ChangePasswordDTO;
import com.competition.dto.UpdateUserDTO;
import com.competition.entity.SysUser;
import com.competition.entity.UserInterestTag;
import com.competition.mapper.SysUserMapper;
import com.competition.mapper.UserInterestTagMapper;
import com.competition.common.enums.UserRole;
import com.competition.service.UserService;
import com.competition.vo.UserVO;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final SysUserMapper userMapper;
    private final UserInterestTagMapper tagMapper;
    /** 通过 Spring IoC 注入，不再 new 实例 */
    private final BCryptPasswordEncoder passwordEncoder;

    @Override
    public UserVO getCurrentUser(Long userId) {
        SysUser user = userMapper.selectById(userId);
        if (user == null) {
            throw new RuntimeException("用户不存在");
        }
        return convertToVO(user);
    }

    @Override
    @Transactional
    public void updateUser(Long userId, UpdateUserDTO dto) {
        SysUser user = userMapper.selectById(userId);
        if (user == null) {
            throw new RuntimeException("用户不存在");
        }
        BeanUtils.copyProperties(dto, user);
        userMapper.updateById(user);
    }

    @Override
    @Transactional
    public void changePassword(Long userId, ChangePasswordDTO dto) {
        SysUser user = userMapper.selectById(userId);
        if (user == null) {
            throw new RuntimeException("用户不存在");
        }
        if (!passwordEncoder.matches(dto.getOldPassword(), user.getPassword())) {
            throw new RuntimeException("原密码错误");
        }
        if (!dto.getNewPassword().equals(dto.getConfirmPassword())) {
            throw new RuntimeException("两次密码输入不一致");
        }
        user.setPassword(passwordEncoder.encode(dto.getNewPassword()));
        userMapper.updateById(user);
    }

    @Override
    public List<String> getUserTags(Long userId) {
        return tagMapper.selectTagNamesByUserId(userId);
    }

    @Override
    @Transactional
    public void updateUserTags(Long userId, List<String> tags) {
        // 删除旧标签
        tagMapper.delete(new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<UserInterestTag>()
                .eq(UserInterestTag::getUserId, userId));
        // 添加新标签
        for (String tag : tags) {
            UserInterestTag interestTag = new UserInterestTag();
            interestTag.setUserId(userId);
            interestTag.setTagName(tag);
            tagMapper.insert(interestTag);
        }
    }

    private UserVO convertToVO(SysUser user) {
        UserVO vo = new UserVO();
        BeanUtils.copyProperties(user, vo);
        // 如果昵称为空，使用用户名
        if (vo.getNickname() == null || vo.getNickname().trim().isEmpty()) {
            vo.setNickname(vo.getUsername());
        }
        // 设置角色名称（使用枚举）
        vo.setRoleName(UserRole.of(user.getRole()).getName());
        // 获取兴趣标签
        vo.setInterestTags(getUserTags(user.getId()));
        return vo;
    }
}
