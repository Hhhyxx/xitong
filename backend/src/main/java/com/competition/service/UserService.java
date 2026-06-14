package com.competition.service;

import com.competition.dto.ChangePasswordDTO;
import com.competition.dto.UpdateUserDTO;
import com.competition.vo.UserVO;

import java.util.List;

public interface UserService {

    UserVO getCurrentUser(Long userId);

    void updateUser(Long userId, UpdateUserDTO dto);

    void changePassword(Long userId, ChangePasswordDTO dto);

    List<String> getUserTags(Long userId);

    void updateUserTags(Long userId, List<String> tags);
}
