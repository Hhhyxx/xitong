package com.competition.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.competition.entity.CompetitionEnrollment;
import com.competition.vo.EnrollmentVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface CompetitionEnrollmentMapper extends BaseMapper<CompetitionEnrollment> {

    @Select("SELECT * FROM competition_enrollment WHERE user_id = #{userId} AND competition_id = #{compId}")
    CompetitionEnrollment selectByUserAndComp(@Param("userId") Long userId, @Param("compId") Long compId);

    @Select("SELECT COUNT(*) FROM competition_enrollment WHERE user_id = #{userId} AND competition_id = #{compId}")
    int countByUserAndComp(@Param("userId") Long userId, @Param("compId") Long compId);

    IPage<EnrollmentVO> selectPageWithDetails(Page<EnrollmentVO> page,
                                               @Param("compId") Long compId,
                                               @Param("status") Integer status,
                                               @Param("keyword") String keyword);

    List<EnrollmentVO> selectExportList(@Param("compId") Long compId,
                                         @Param("status") Integer status);
}
