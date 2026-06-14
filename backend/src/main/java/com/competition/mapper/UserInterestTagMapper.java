package com.competition.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.competition.entity.UserInterestTag;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface UserInterestTagMapper extends BaseMapper<UserInterestTag> {

    @Select("SELECT * FROM user_interest_tag WHERE user_id = #{userId}")
    List<UserInterestTag> selectByUserId(Long userId);

    @Select("SELECT tag_name FROM user_interest_tag WHERE user_id = #{userId}")
    List<String> selectTagNamesByUserId(Long userId);
}
