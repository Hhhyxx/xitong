package com.competition.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.competition.dto.EnrollDTO;
import com.competition.entity.Competition;
import com.competition.entity.CompetitionEnrollment;
import com.competition.entity.SysUser;
import com.competition.mapper.CompetitionEnrollmentMapper;
import com.competition.mapper.CompetitionMapper;
import com.competition.mapper.SysUserMapper;
import com.competition.service.EnrollmentService;
import com.competition.vo.EnrollmentVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EnrollmentServiceImpl implements EnrollmentService {

    private final CompetitionEnrollmentMapper enrollmentMapper;
    private final CompetitionMapper competitionMapper;
    private final SysUserMapper userMapper;

    @Override
    @Transactional
    public void enroll(Long userId, EnrollDTO dto) {
        // 检查竞赛是否存在
        Competition competition = competitionMapper.selectById(dto.getCompetitionId());
        if (competition == null || competition.getStatus() != 1) {
            throw new RuntimeException("竞赛不存在或已下线");
        }
        // 检查是否已报名
        if (enrollmentMapper.countByUserAndComp(userId, dto.getCompetitionId()) > 0) {
            throw new RuntimeException("您已报名该竞赛");
        }

        CompetitionEnrollment enrollment = new CompetitionEnrollment();
        enrollment.setCompetitionId(dto.getCompetitionId());
        enrollment.setUserId(userId);
        enrollment.setTeamName(dto.getTeamName());
        enrollment.setTeamMembers(dto.getTeamMembers());
        enrollment.setRemark(dto.getRemark());
        enrollment.setStatus(0);
        // 存储用户信息快照（报名时的个人信息，确保管理员端始终可见）
        enrollment.setStudentId(dto.getStudentId());
        enrollment.setRealName(dto.getRealName());
        enrollment.setCollege(dto.getCollege());
        enrollment.setMajor(dto.getMajor());
        enrollment.setPhone(dto.getPhone());

        // 如果用户资料为空，从sys_user同步一份到报名记录
        if (!StringUtils.hasText(enrollment.getStudentId()) || !StringUtils.hasText(enrollment.getRealName())) {
            SysUser user = userMapper.selectByIdIgnoreDelete(userId);
            if (user != null) {
                if (!StringUtils.hasText(enrollment.getStudentId())) {
                    enrollment.setStudentId(user.getStudentId());
                }
                if (!StringUtils.hasText(enrollment.getRealName())) {
                    enrollment.setRealName(user.getRealName());
                }
                if (!StringUtils.hasText(enrollment.getCollege())) {
                    enrollment.setCollege(user.getCollege());
                }
                if (!StringUtils.hasText(enrollment.getMajor())) {
                    enrollment.setMajor(user.getMajor());
                }
                if (!StringUtils.hasText(enrollment.getPhone())) {
                    enrollment.setPhone(user.getPhone());
                }
            }
        }

        enrollmentMapper.insert(enrollment);
        // 增加报名人数
        competitionMapper.incrementEnrollCount(dto.getCompetitionId());
    }

    @Override
    @Transactional
    public void cancelEnroll(Long userId, Long competitionId) {
        CompetitionEnrollment enrollment = enrollmentMapper.selectByUserAndComp(userId, competitionId);
        if (enrollment == null) {
            throw new RuntimeException("未找到报名记录");
        }
        enrollmentMapper.deleteById(enrollment.getId());
        // 减少报名人数
        competitionMapper.decrementEnrollCount(competitionId);
    }

    @Override
    public IPage<EnrollmentVO> listEnrollments(Page<EnrollmentVO> page, Long compId, Integer status, String keyword) {
        LambdaQueryWrapper<CompetitionEnrollment> wrapper = new LambdaQueryWrapper<>();
        if (compId != null) {
            wrapper.eq(CompetitionEnrollment::getCompetitionId, compId);
        }
        if (status != null) {
            wrapper.eq(CompetitionEnrollment::getStatus, status);
        }

        Page<CompetitionEnrollment> enrollPage = new Page<>(page.getCurrent(), Math.max(page.getSize(), 200));
        Page<CompetitionEnrollment> result = enrollmentMapper.selectPage(enrollPage, wrapper);

        List<EnrollmentVO> voList = result.getRecords().stream()
                .map(this::convertToVO)
                .collect(Collectors.toList());

        // 关键词过滤
        if (keyword != null && !keyword.isEmpty()) {
            final String kw = keyword.toLowerCase();
            voList = voList.stream()
                    .filter(vo -> (vo.getRealName() != null && vo.getRealName().toLowerCase().contains(kw))
                            || (vo.getCompetitionTitle() != null && vo.getCompetitionTitle().toLowerCase().contains(kw))
                            || (vo.getStudentId() != null && vo.getStudentId().toLowerCase().contains(kw)))
                    .collect(Collectors.toList());
        }

        Page<EnrollmentVO> voPage = new Page<>(result.getCurrent(), result.getSize(), voList.size());
        voPage.setRecords(voList);
        return voPage;
    }

    @Override
    public List<EnrollmentVO> listForExport(Long compId, Integer status) {
        LambdaQueryWrapper<CompetitionEnrollment> wrapper = new LambdaQueryWrapper<>();
        if (compId != null) {
            wrapper.eq(CompetitionEnrollment::getCompetitionId, compId);
        }
        if (status != null) {
            wrapper.eq(CompetitionEnrollment::getStatus, status);
        }
        return enrollmentMapper.selectList(wrapper).stream()
                .map(this::convertToVO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void approve(Long enrollId) {
        CompetitionEnrollment enrollment = enrollmentMapper.selectById(enrollId);
        if (enrollment == null) {
            throw new RuntimeException("报名记录不存在");
        }
        enrollment.setStatus(1);
        enrollmentMapper.updateById(enrollment);
    }

    @Override
    public List<EnrollmentVO> listMyEnrollments(Long userId, Integer status) {
        LambdaQueryWrapper<CompetitionEnrollment> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(CompetitionEnrollment::getUserId, userId);
        if (status != null) {
            wrapper.eq(CompetitionEnrollment::getStatus, status);
        }
        wrapper.orderByDesc(CompetitionEnrollment::getEnrollTime);
        return enrollmentMapper.selectList(wrapper).stream()
                .map(this::convertToVO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteByAdmin(Long enrollmentId) {
        CompetitionEnrollment enrollment = enrollmentMapper.selectById(enrollmentId);
        if (enrollment == null) {
            throw new RuntimeException("报名记录不存在");
        }
        Long competitionId = enrollment.getCompetitionId();
        enrollmentMapper.deleteById(enrollmentId);
        if (competitionId != null) {
            competitionMapper.decrementEnrollCount(competitionId);
        }
    }

    @Override
    @Transactional
    public void reject(Long enrollId, String reason) {
        CompetitionEnrollment enrollment = enrollmentMapper.selectById(enrollId);
        if (enrollment == null) {
            throw new RuntimeException("报名记录不存在");
        }
        enrollment.setStatus(2);
        enrollment.setRemark(reason);
        enrollmentMapper.updateById(enrollment);
    }

    private EnrollmentVO convertToVO(CompetitionEnrollment enrollment) {
        EnrollmentVO vo = new EnrollmentVO();
        vo.setId(enrollment.getId());
        vo.setCompetitionId(enrollment.getCompetitionId());
        vo.setUserId(enrollment.getUserId());
        vo.setTeamName(enrollment.getTeamName());
        vo.setTeamMembers(enrollment.getTeamMembers());
        vo.setRemark(enrollment.getRemark());
        vo.setStatus(enrollment.getStatus());
        vo.setEnrollTime(enrollment.getEnrollTime());

        // 设置状态名称
        switch (enrollment.getStatus()) {
            case 0 -> vo.setStatusName("待审核");
            case 1 -> vo.setStatusName("已通过");
            case 2 -> vo.setStatusName("已拒绝");
            default -> vo.setStatusName("未知");
        }

        // 获取竞赛信息
        Competition competition = competitionMapper.selectById(enrollment.getCompetitionId());
        if (competition != null) {
            vo.setCompetitionTitle(competition.getTitle());
        }

        // 优先使用报名快照中的用户信息（报名时的真实数据）
        vo.setStudentId(enrollment.getStudentId());
        vo.setRealName(enrollment.getRealName());
        vo.setCollege(enrollment.getCollege());
        vo.setMajor(enrollment.getMajor());
        vo.setPhone(enrollment.getPhone());

        // 如果快照为空，从 sys_user 表回填
        SysUser user = userMapper.selectByIdIgnoreDelete(enrollment.getUserId());
        if (user != null) {
            if (!StringUtils.hasText(vo.getRealName())) {
                vo.setRealName(user.getRealName());
            }
            if (!StringUtils.hasText(vo.getStudentId())) {
                vo.setStudentId(user.getStudentId());
            }
            if (!StringUtils.hasText(vo.getCollege())) {
                vo.setCollege(user.getCollege());
            }
            if (!StringUtils.hasText(vo.getMajor())) {
                vo.setMajor(user.getMajor());
            }
            if (!StringUtils.hasText(vo.getPhone())) {
                vo.setPhone(user.getPhone());
            }
            vo.setUsername(user.getUsername());
            vo.setEmail(user.getEmail());
        }

        return vo;
    }
}
