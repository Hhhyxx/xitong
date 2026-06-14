package com.competition.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.competition.dto.EnrollDTO;
import com.competition.vo.EnrollmentVO;

import java.util.List;

public interface EnrollmentService {

    void enroll(Long userId, EnrollDTO dto);

    void cancelEnroll(Long userId, Long competitionId);

    IPage<EnrollmentVO> listEnrollments(Page<EnrollmentVO> page, Long compId, Integer status, String keyword);

    List<EnrollmentVO> listForExport(Long compId, Integer status);

    void approve(Long enrollId);

    void reject(Long enrollId, String reason);

    /**
     * 查询当前用户自己的报名记录
     */
    List<EnrollmentVO> listMyEnrollments(Long userId, Integer status);

    /**
     * 管理员物理删除一条报名记录（数据库同步，并减少竞赛报名人数）
     */
    void deleteByAdmin(Long enrollmentId);
}
