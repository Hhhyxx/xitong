package com.competition.service;

import com.competition.dto.AwardRecordDTO;
import com.competition.entity.AwardRecord;

import java.util.List;
import java.util.Map;

public interface AwardRecordService {

    List<AwardRecord> listByUser(Long userId);

    AwardRecord addRecord(Long userId, AwardRecordDTO dto);

    AwardRecord updateRecord(Long userId, AwardRecordDTO dto);

    /**
     * 删除获奖记录
     * @param isAdmin true 时跳过所有权校验（管理员专用）
     */
    void deleteRecord(Long userId, Long recordId, boolean isAdmin);

    /** 向后兼容：普通用户删除自己的记录 */
    default void deleteRecord(Long userId, Long recordId) {
        deleteRecord(userId, recordId, false);
    }

    /**
     * 获取所有获奖记录（管理员用）
     */
    List<Map<String, Object>> listAllWithUserInfo();

    /**
     * 获取指定用户的公开获奖记录（论坛用，仅返回已审核通过的）
     */
    List<AwardRecord> listPublicByUserId(Long userId);

    /**
     * 审核通过获奖记录（管理员）
     */
    AwardRecord approveRecord(Long id);
}
