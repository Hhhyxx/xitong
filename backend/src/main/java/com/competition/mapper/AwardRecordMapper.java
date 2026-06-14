package com.competition.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.competition.entity.AwardRecord;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.Map;

@Mapper
public interface AwardRecordMapper extends BaseMapper<AwardRecord> {

    @Select("SELECT * FROM award_record WHERE user_id = #{userId} ORDER BY award_time DESC")
    List<AwardRecord> selectByUserId(Long userId);

    /**
     * 查询所有获奖记录（包含用户信息和来源）
     */
    @Select("SELECT ar.id, ar.user_id as userId, ar.competition_id as competitionId, " +
            "ar.comp_name as compName, ar.award_level as awardLevel, ar.award_time as awardTime, " +
            "ar.certificate, ar.description, ar.photo_url as photoUrl, " +
            "ar.source, ar.status, " +
            "ar.create_time as createTime, ar.update_time as updateTime, " +
            "su.student_id as studentId, su.real_name as studentName, su.nickname " +
            "FROM award_record ar " +
            "LEFT JOIN sys_user su ON ar.user_id = su.id " +
            "ORDER BY ar.award_time DESC")
    List<Map<String, Object>> selectAllWithUserInfo();

}
