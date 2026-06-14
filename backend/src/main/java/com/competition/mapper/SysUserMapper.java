package com.competition.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.competition.entity.SysUser;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface SysUserMapper extends BaseMapper<SysUser> {

    @Select("SELECT * FROM sys_user WHERE username = #{username} AND status = 1")
    SysUser selectByUsername(String username);

    @Select("SELECT * FROM sys_user WHERE phone = #{phone} AND status = 1")
    SysUser selectByPhone(String phone);

    @Select("SELECT * FROM sys_user WHERE email = #{email} AND status = 1")
    SysUser selectByEmail(String email);

    @Update("UPDATE sys_user SET last_login = NOW() WHERE id = #{userId}")
    void updateLastLogin(Long userId);

    /** 忽略逻辑删除，直接按ID查询用户（用于管理端展示报名信息） */
    @Select("SELECT * FROM sys_user WHERE id = #{id}")
    SysUser selectByIdIgnoreDelete(Long id);
}
