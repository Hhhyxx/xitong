package com.competition.service;

import com.competition.dto.LoginDTO;
import com.competition.dto.RegisterDTO;

public interface AuthService {

    String login(LoginDTO dto);

    void register(RegisterDTO dto);

    void sendSmsCode(String phone);

    void sendEmailCode(String email);

    String loginByPhone(String phone, String code);

    String loginByEmail(String email, String code);

    void logout(String authorization);
}
