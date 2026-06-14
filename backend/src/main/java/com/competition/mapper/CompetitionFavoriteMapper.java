package com.competition.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.competition.entity.CompetitionFavorite;
import com.competition.vo.FavoriteVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface CompetitionFavoriteMapper extends BaseMapper<CompetitionFavorite> {

    @Select("SELECT * FROM competition_favorite WHERE user_id = #{userId} AND competition_id = #{compId}")
    CompetitionFavorite selectByUserAndComp(@Param("userId") Long userId, @Param("compId") Long compId);

    @Select("SELECT COUNT(*) FROM competition_favorite WHERE user_id = #{userId} AND competition_id = #{compId}")
    int countByUserAndComp(@Param("userId") Long userId, @Param("compId") Long compId);

    List<FavoriteVO> selectFavoritesByUser(@Param("userId") Long userId);
}
