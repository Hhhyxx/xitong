package com.competition.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.competition.entity.SysNotification;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;

@Mapper
public interface SysNotificationMapper extends BaseMapper<SysNotification> {

    @Select("SELECT * FROM sys_notification WHERE user_id IS NULL OR user_id = #{userId} ORDER BY create_time DESC")
    List<SysNotification> selectByUserId(Long userId);

    @Select("SELECT COUNT(*) FROM sys_notification WHERE (user_id IS NULL OR user_id = #{userId}) AND is_read = 0")
    int countUnread(Long userId);

    @Update("UPDATE sys_notification SET is_read = 1 WHERE id = #{id} AND (user_id IS NULL OR user_id = #{userId})")
    int markAsRead(@Param("id") Long id, @Param("userId") Long userId);
}
