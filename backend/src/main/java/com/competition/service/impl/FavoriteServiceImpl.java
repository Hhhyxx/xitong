package com.competition.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.competition.entity.Competition;
import com.competition.entity.CompetitionFavorite;
import com.competition.mapper.CompetitionFavoriteMapper;
import com.competition.mapper.CompetitionMapper;
import com.competition.service.FavoriteService;
import com.competition.vo.FavoriteVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FavoriteServiceImpl implements FavoriteService {

    private final CompetitionFavoriteMapper favoriteMapper;
    private final CompetitionMapper competitionMapper;

    @Override
    @Transactional
    public void addFavorite(Long userId, Long competitionId) {
        // 检查是否已收藏
        if (favoriteMapper.countByUserAndComp(userId, competitionId) > 0) {
            throw new RuntimeException("已收藏该竞赛");
        }
        // 检查竞赛是否存在
        Competition competition = competitionMapper.selectById(competitionId);
        if (competition == null || competition.getStatus() != 1) {
            throw new RuntimeException("竞赛不存在");
        }

        CompetitionFavorite favorite = new CompetitionFavorite();
        favorite.setUserId(userId);
        favorite.setCompetitionId(competitionId);
        favoriteMapper.insert(favorite);
    }

    @Override
    @Transactional
    public void removeFavorite(Long userId, Long competitionId) {
        CompetitionFavorite favorite = favoriteMapper.selectByUserAndComp(userId, competitionId);
        if (favorite != null) {
            favoriteMapper.deleteById(favorite.getId());
        }
    }

    @Override
    public List<FavoriteVO> listFavorites(Long userId) {
        LambdaQueryWrapper<CompetitionFavorite> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(CompetitionFavorite::getUserId, userId);
        wrapper.orderByDesc(CompetitionFavorite::getCreateTime);

        return favoriteMapper.selectList(wrapper).stream()
                .map(this::convertToVO)
                .collect(Collectors.toList());
    }

    @Override
    public boolean isFavorited(Long userId, Long competitionId) {
        return favoriteMapper.countByUserAndComp(userId, competitionId) > 0;
    }

    private FavoriteVO convertToVO(CompetitionFavorite favorite) {
        FavoriteVO vo = new FavoriteVO();
        vo.setId(favorite.getId());
        vo.setCompetitionId(favorite.getCompetitionId());
        vo.setCreateTime(favorite.getCreateTime());

        // 获取竞赛信息
        Competition competition = competitionMapper.selectById(favorite.getCompetitionId());
        if (competition != null) {
            vo.setTitle(competition.getTitle());
            vo.setCover(competition.getCover());
            vo.setOrganizer(competition.getOrganizer());
            vo.setEndTime(competition.getEndTime());
            vo.setCompTime(competition.getCompTime());
            vo.setLevel(competition.getLevel());
            // 设置级别名称
            switch (competition.getLevel()) {
                case 1 -> vo.setLevelName("校级");
                case 2 -> vo.setLevelName("省级");
                case 3 -> vo.setLevelName("国家级");
                case 4 -> vo.setLevelName("国际级");
                default -> vo.setLevelName("其他");
            }
        }

        return vo;
    }
}
