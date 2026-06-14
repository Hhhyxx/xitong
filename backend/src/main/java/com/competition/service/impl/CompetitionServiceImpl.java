package com.competition.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.competition.common.CompetitionConstants;
import com.competition.common.enums.CompetitionLevel;
import com.competition.entity.Competition;
import com.competition.entity.CompetitionCategory;
import com.competition.entity.ExternalCrawledCompetition;
import com.competition.mapper.CompetitionCategoryMapper;
import com.competition.mapper.CompetitionFavoriteMapper;
import com.competition.mapper.CompetitionMapper;
import com.competition.mapper.ExternalCrawledCompetitionMapper;
import com.competition.service.CompetitionService;
import com.competition.vo.CompetitionVO;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CompetitionServiceImpl implements CompetitionService {

    private static final int MERGE_FETCH_CAP = 2500;

    private final CompetitionMapper competitionMapper;
    private final CompetitionCategoryMapper categoryMapper;
    private final CompetitionFavoriteMapper favoriteMapper;
    private final ExternalCrawledCompetitionMapper externalCrawledCompetitionMapper;

    @Override
    public IPage<CompetitionVO> listCompetitions(Page<CompetitionVO> page, String keyword, Integer categoryId, Integer level, boolean includeExternal) {
        boolean shouldIncludeExternal = includeExternal && categoryId == null && level == null;

        LambdaQueryWrapper<Competition> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Competition::getStatus, 1);
        if (keyword != null && !keyword.isEmpty()) {
            wrapper.like(Competition::getTitle, keyword);
        }
        if (categoryId != null) {
            wrapper.eq(Competition::getCategoryId, categoryId);
        }
        if (level != null) {
            wrapper.eq(Competition::getLevel, level);
        }
        wrapper.orderByDesc(Competition::getCreateTime);

        Page<Competition> compPage = new Page<>(1, MERGE_FETCH_CAP);
        Page<Competition> dbPage = competitionMapper.selectPage(compPage, wrapper);
        Map<Integer, String> categoryMap = buildCategoryMap(dbPage.getRecords());

        List<CompetitionVO> merged = new ArrayList<>(
                dbPage.getRecords().stream().map(c -> convertToVO(c, categoryMap)).collect(Collectors.toList())
        );

        if (shouldIncludeExternal) {
            LambdaQueryWrapper<ExternalCrawledCompetition> ew = new LambdaQueryWrapper<>();
            if (keyword != null && !keyword.isEmpty()) {
                ew.like(ExternalCrawledCompetition::getTitle, keyword);
            }
            ew.orderByDesc(ExternalCrawledCompetition::getCrawledAt);
            Page<ExternalCrawledCompetition> extPage = new Page<>(1, 500);
            List<ExternalCrawledCompetition> extRows = externalCrawledCompetitionMapper.selectPage(extPage, ew).getRecords();
            for (ExternalCrawledCompetition e : extRows) {
                merged.add(externalToVo(e));
            }
        }

        merged.removeIf(this::isExternalCrawlHallNoise);

        merged.sort(Comparator.comparing(CompetitionVO::getEndTime, Comparator.nullsLast(Comparator.naturalOrder())).reversed());

        long total = merged.size();
        int from = (int) ((page.getCurrent() - 1) * page.getSize());
        int to = (int) Math.min(from + page.getSize(), merged.size());
        List<CompetitionVO> slice = from >= merged.size() ? List.of() : merged.subList(from, to);

        Page<CompetitionVO> voPage = new Page<>(page.getCurrent(), page.getSize(), total);
        voPage.setRecords(slice);
        return voPage;
    }

    @Override
    public List<CompetitionVO> getLatest(int limit) {
        List<Competition> list = competitionMapper.selectLatest(limit);
        Map<Integer, String> categoryMap = buildCategoryMap(list);
        return list.stream().map(c -> convertToVO(c, categoryMap)).collect(Collectors.toList());
    }

    @Override
    public List<CompetitionVO> getHot(int limit) {
        List<Competition> list = competitionMapper.selectHot(limit);
        Map<Integer, String> categoryMap = buildCategoryMap(list);
        return list.stream().map(c -> convertToVO(c, categoryMap)).collect(Collectors.toList());
    }

    @Override
    public List<CompetitionVO> getByCategory(Integer categoryId) {
        List<Competition> list = competitionMapper.selectByCategory(categoryId);
        Map<Integer, String> categoryMap = buildCategoryMap(list);
        return list.stream().map(c -> convertToVO(c, categoryMap)).collect(Collectors.toList());
    }

    @Override
    public CompetitionVO getDetail(Long id, Long userId) {
        if (id != null && id >= CompetitionConstants.EXTERNAL_COMPETITION_ID_BASE) {
            long raw = id - CompetitionConstants.EXTERNAL_COMPETITION_ID_BASE;
            ExternalCrawledCompetition e = externalCrawledCompetitionMapper.selectById(raw);
            if (e == null) {
                throw new RuntimeException("竞赛不存在");
            }
            CompetitionVO vo = externalToVo(e);
            vo.setIsFavorited(false);
            vo.setIsEnrolled(false);
            return vo;
        }

        Competition competition = competitionMapper.selectById(id);
        if (competition == null || competition.getStatus() == null || competition.getStatus() != 1) {
            throw new RuntimeException("竞赛不存在");
        }
        competitionMapper.incrementViewCount(id);
        competition.setViewCount((competition.getViewCount() == null ? 0 : competition.getViewCount()) + 1);

        Map<Integer, String> categoryMap = buildCategoryMap(List.of(competition));
        CompetitionVO vo = convertToVO(competition, categoryMap);
        if (userId != null) {
            vo.setIsFavorited(favoriteMapper.countByUserAndComp(userId, id) > 0);
        }
        return vo;
    }

    @Override
    public Competition saveCompetition(Competition competition) {
        if (competition.getId() == null) {
            normalizeCompetitionDefaults(competition, true);
            competitionMapper.insert(competition);
        } else {
            normalizeCompetitionDefaults(competition, false);
            competitionMapper.updateById(competition);
        }
        return competition;
    }

    @Override
    public void deleteCompetition(Long id) {
        competitionMapper.deleteById(id);
    }

    private CompetitionVO externalToVo(ExternalCrawledCompetition e) {
        CompetitionVO vo = new CompetitionVO();
        vo.setId(CompetitionConstants.EXTERNAL_COMPETITION_ID_BASE + e.getId());
        vo.setTitle(e.getTitle());
        vo.setSourceUrl(e.getSourceUrl());
        vo.setStartTime(e.getEnrollStart());
        vo.setEndTime(e.getEnrollEnd());
        vo.setOrganizer("官网报名");
        vo.setCategoryId(null);
        vo.setCategoryName("大学生竞赛");
        vo.setLevel(3);
        vo.setLevelName(CompetitionLevel.nameOf(3));
        vo.setDescription("赛程与报名安排以官方网站公布为准。");
        vo.setStatus(1);
        vo.setViewCount(0);
        vo.setEnrollCount(0);
        vo.setCreateTime(e.getCrawledAt() != null ? e.getCrawledAt() : LocalDateTime.now());
        return vo;
    }

    private void normalizeCompetitionDefaults(Competition competition, boolean isNew) {
        LocalDateTime now = LocalDateTime.now();
        if (competition.getStatus() == null) {
            competition.setStatus(1);
        }
        if (competition.getDeleted() == null) {
            competition.setDeleted(0);
        }
        if (competition.getViewCount() == null) {
            competition.setViewCount(0);
        }
        if (competition.getFavoriteCount() == null) {
            competition.setFavoriteCount(0);
        }
        if (competition.getEnrollCount() == null) {
            competition.setEnrollCount(0);
        }
        if (competition.getLevelName() == null || competition.getLevelName().isBlank()) {
            competition.setLevelName(CompetitionLevel.nameOf(competition.getLevel()));
        }
        if (isNew && competition.getCreateTime() == null) {
            competition.setCreateTime(now);
        }
        competition.setUpdateTime(now);
    }

    /**
     * 剔除明显非赛事的爬虫链接（导航、账号、版权等）；仅针对合并进来的虚拟 ID 行。
     */
    private boolean isExternalCrawlHallNoise(CompetitionVO vo) {
        if (vo.getId() == null || vo.getId() < CompetitionConstants.EXTERNAL_COMPETITION_ID_BASE) {
            return false;
        }
        if (vo.getStartTime() == null || vo.getEndTime() == null || vo.getEndTime().isBefore(vo.getStartTime())) {
            return true;
        }
        String u = vo.getSourceUrl();
        if (u == null || u.isBlank() || sourceUrlLooksLikeHallNoise(u)) {
            return true;
        }
        String t = vo.getTitle();
        if (t == null) {
            return true;
        }
        t = t.trim();
        if (t.length() < 6 || t.length() > 120) {
            return true;
        }
        if (titleLooksLikeAggregateOrNavigation(t)) {
            return true;
        }
        String[] blacklist = {"登录", "注册", "sign in", "sign up", "关于我们", "联系我们", "网站地图", "法律声明",
                "隐私政策", "版权所有", "使用帮助", "帮助中心", "招聘信息", "加入我们", "账号安全", "忘记密码",
                "首页", "返回首页", "设为首页", "收藏本站", "订阅", "征稿启事", "媒体聚焦", "站点地图", "免责声明",
                "投稿须知", "意见反馈", "更多>>", "更多》", "更多 »", "下一页", "上一页", "english", "中文版",
                "会员中心", "个人中心", "控制台", "后台管理", "办公网", "OA系统", "下载中心", "软件下载"};
        for (String b : blacklist) {
            if (t.toLowerCase().contains(b)) {
                return true;
            }
        }
        return !titleLooksLikeCompetition(t);
    }

    private boolean titleLooksLikeAggregateOrNavigation(String title) {
        String t = title.trim().toLowerCase();
        String[] genericWords = {"汇总", "合集", "资源", "导航", "入口", "目录", "列表", "平台", "频道", "专题",
                "官网", "官方网站", "资料", "教程", "指南", "日历", "时间表", "政策", "介绍", "更多"};
        for (String word : genericWords) {
            if (t.contains(word.toLowerCase())) {
                return true;
            }
        }
        return false;
    }

    /** 外链：过滤登录、静态资源、下载等明显非赛事项链接 */
    private boolean sourceUrlLooksLikeHallNoise(String raw) {
        String u = raw.trim().toLowerCase();
        if (u.startsWith("mailto:") || u.startsWith("javascript:") || u.startsWith("tel:")) {
            return true;
        }
        String[] pathNoise = {"/login", "login.", "register", "signup", "signin", "sign_up", "lostpwd", "password",
                "/user/", "/users/", "/member", "/account", "/sso", "/cas/", "/oauth",
                ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".zip", ".rar", ".7z", "/download/", "/upload/"};
        for (String p : pathNoise) {
            if (u.contains(p)) {
                return true;
            }
        }
        return false;
    }

    private boolean titleLooksLikeCompetition(String t) {
        String[] cues = {"竞赛", "大赛", "比赛", "杯", "挑战", "选拔", "邀请", "锦标", "联赛", "国赛", "省赛",
                "Contest", "Championship", "ICPC", "建模", "设计赛", "创新赛", "创业赛", "智能车", "电子设计",
                "信息安全", "机器人", "ICT", "西门子", "工训", "结构", "生命科学", "广告", "英语", "演讲",
                "市场调查", "商业精英", "三创", "米兰", "工业设计", "数字艺术", "物理", "化学", "医学"};
        for (String c : cues) {
            if (t.contains(c)) {
                return true;
            }
        }
        return (t.contains("大学生") || t.contains("高校")) && (t.contains("赛") || t.contains("杯"));
    }

    private Map<Integer, String> buildCategoryMap(List<Competition> competitions) {
        List<Integer> categoryIds = competitions.stream()
                .map(Competition::getCategoryId)
                .filter(cid -> cid != null)
                .distinct()
                .collect(Collectors.toList());
        if (categoryIds.isEmpty()) {
            return Map.of();
        }
        return categoryMapper.selectBatchIds(categoryIds).stream()
                .collect(Collectors.toMap(CompetitionCategory::getId, CompetitionCategory::getName));
    }

    private CompetitionVO convertToVO(Competition competition, Map<Integer, String> categoryMap) {
        CompetitionVO vo = new CompetitionVO();
        BeanUtils.copyProperties(competition, vo);
        vo.setLevelName(CompetitionLevel.nameOf(competition.getLevel()));
        if (competition.getCategoryId() != null) {
            vo.setCategoryName(categoryMap.getOrDefault(competition.getCategoryId(), "未知分类"));
        }
        return vo;
    }
}
