package com.competition.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.competition.entity.Competition;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;

@Mapper
public interface CompetitionMapper extends BaseMapper<Competition> {

    @Select("SELECT * FROM competition WHERE status = 1 ORDER BY create_time DESC LIMIT #{limit}")
    List<Competition> selectLatest(int limit);

    @Select("SELECT * FROM competition WHERE status = 1 ORDER BY view_count DESC LIMIT #{limit}")
    List<Competition> selectHot(int limit);

    @Select("SELECT * FROM competition WHERE status = 1 AND category_id = #{categoryId} ORDER BY create_time DESC")
    List<Competition> selectByCategory(Integer categoryId);

    @Update("UPDATE competition SET view_count = view_count + 1 WHERE id = #{id}")
    void incrementViewCount(Long id);

    @Update("UPDATE competition SET enroll_count = enroll_count + 1 WHERE id = #{id}")
    void incrementEnrollCount(Long id);

    @Update("UPDATE competition SET enroll_count = enroll_count - 1 WHERE id = #{id} AND enroll_count > 0")
    void decrementEnrollCount(Long id);

    IPage<Competition> selectPageWithCategory(Page<Competition> page,
                                               @Param("keyword") String keyword,
                                               @Param("categoryId") Integer categoryId,
                                               @Param("level") Integer level);

    @Select("SELECT COUNT(*) FROM competition WHERE source_url = #{sourceUrl}")
    int countBySourceUrl(String sourceUrl);
}
