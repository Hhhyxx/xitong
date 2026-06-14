package com.competition.service;

import com.competition.vo.FavoriteVO;

import java.util.List;

public interface FavoriteService {

    void addFavorite(Long userId, Long competitionId);

    void removeFavorite(Long userId, Long competitionId);

    List<FavoriteVO> listFavorites(Long userId);

    boolean isFavorited(Long userId, Long competitionId);
}
