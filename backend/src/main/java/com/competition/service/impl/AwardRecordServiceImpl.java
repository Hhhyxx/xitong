package com.competition.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.competition.dto.AwardRecordDTO;
import com.competition.entity.AwardRecord;
import com.competition.mapper.AwardRecordMapper;
import com.competition.service.AwardRecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AwardRecordServiceImpl implements AwardRecordService {

    private final AwardRecordMapper awardRecordMapper;

    @Override
    public List<AwardRecord> listByUser(Long userId) {
        LambdaQueryWrapper<AwardRecord> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(AwardRecord::getUserId, userId);
        wrapper.orderByDesc(AwardRecord::getAwardTime);
        return awardRecordMapper.selectList(wrapper);
    }

    @Override
    @Transactional
    public AwardRecord addRecord(Long userId, AwardRecordDTO dto) {
        AwardRecord record = new AwardRecord();
        BeanUtils.copyProperties(dto, record);
        record.setUserId(userId);
        record.setPhotoUrl(dto.getPhotoUrl());
        String source = dto.getSource() != null ? dto.getSource() : "self";
        record.setSource(source);
        // 管理员录入直接标记为已审核，学生自填需要等待审核
        record.setStatus("admin".equals(source) ? 1 : 0);
        awardRecordMapper.insert(record);
        return record;
    }

    @Override
    @Transactional
    public AwardRecord updateRecord(Long userId, AwardRecordDTO dto) {
        AwardRecord record = awardRecordMapper.selectById(dto.getId());
        if (record == null || !record.getUserId().equals(userId)) {
            throw new RuntimeException("记录不存在或无权限");
        }
        // 使用 updateWrapper 确保 photoUrl 为 null 时也能更新
        LambdaUpdateWrapper<AwardRecord> updateWrapper = new LambdaUpdateWrapper<>();
        updateWrapper.eq(AwardRecord::getId, dto.getId())
                .set(AwardRecord::getCompName, dto.getCompName())
                .set(AwardRecord::getAwardLevel, dto.getAwardLevel())
                .set(AwardRecord::getAwardTime, dto.getAwardTime())
                .set(AwardRecord::getCertificate, dto.getCertificate())
                .set(AwardRecord::getDescription, dto.getDescription())
                .set(AwardRecord::getPhotoUrl, dto.getPhotoUrl()); // 允许 null 值更新
        awardRecordMapper.update(updateWrapper);

        // 返回更新后的记录
        return awardRecordMapper.selectById(dto.getId());
    }

    @Override
    @Transactional
    public void deleteRecord(Long userId, Long recordId, boolean isAdmin) {
        AwardRecord record = awardRecordMapper.selectById(recordId);
        if (record == null) {
            throw new RuntimeException("记录不存在");
        }
        if (!isAdmin && !record.getUserId().equals(userId)) {
            throw new RuntimeException("无权限删除他人的获奖记录");
        }
        awardRecordMapper.deleteById(recordId);
    }

    @Override
    public List<Map<String, Object>> listAllWithUserInfo() {
        return awardRecordMapper.selectAllWithUserInfo();
    }

    @Override
    public List<AwardRecord> listPublicByUserId(Long userId) {
        LambdaQueryWrapper<AwardRecord> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(AwardRecord::getUserId, userId)
               .eq(AwardRecord::getStatus, 1)
               .orderByDesc(AwardRecord::getAwardTime);
        return awardRecordMapper.selectList(wrapper);
    }

    @Override
    @Transactional
    public AwardRecord approveRecord(Long id) {
        AwardRecord record = awardRecordMapper.selectById(id);
        if (record == null) {
            throw new RuntimeException("记录不存在");
        }
        LambdaUpdateWrapper<AwardRecord> updateWrapper = new LambdaUpdateWrapper<>();
        updateWrapper.eq(AwardRecord::getId, id)
                     .set(AwardRecord::getStatus, 1);
        awardRecordMapper.update(updateWrapper);
        record.setStatus(1);
        return record;
    }
}
