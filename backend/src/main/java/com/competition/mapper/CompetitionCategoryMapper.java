package com.competition.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.competition.entity.CompetitionCategory;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface CompetitionCategoryMapper extends BaseMapper<CompetitionCategory> {

    @Select("SELECT * FROM competition_category WHERE status = 1 ORDER BY sort")
    List<CompetitionCategory> selectAllActive();
}
