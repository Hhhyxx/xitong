package com.competition.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.competition.entity.Competition;
import com.competition.vo.CompetitionVO;

import java.util.List;

public interface CompetitionService {

    IPage<CompetitionVO> listCompetitions(Page<CompetitionVO> page, String keyword, Integer categoryId, Integer level, boolean includeExternal);

    List<CompetitionVO> getLatest(int limit);

    List<CompetitionVO> getHot(int limit);

    List<CompetitionVO> getByCategory(Integer categoryId);

    CompetitionVO getDetail(Long id, Long userId);

    Competition saveCompetition(Competition competition);

    void deleteCompetition(Long id);
}
