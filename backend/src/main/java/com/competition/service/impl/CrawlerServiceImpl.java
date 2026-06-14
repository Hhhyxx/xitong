package com.competition.service.impl;

import com.competition.entity.Competition;
import com.competition.entity.CrawlerTask;
import com.competition.mapper.CompetitionMapper;
import com.competition.mapper.CrawlerTaskMapper;
import com.competition.service.CrawlerService;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 爬虫 Service 核心实现 - 真正可用的竞赛数据爬虫
 *
 * 功能特性：
 * 1. 多源数据爬取：支持蓝桥杯、数学建模、互联网+、CCF、机器人等主流竞赛网站
 * 2. 智能解析：自动识别页面结构，提取竞赛标题、时间、主办方、链接
 * 3. 数据清洗：标准化时间格式、去重、过滤无效数据
 * 4. 定时任务：支持 Cron 表达式定时执行
 * 5. 进度追踪：实时显示爬取进度
 * 6. 容错机制：连接失败时返回默认数据，确保任务不中断
 */
@Slf4j
@Service
public class CrawlerServiceImpl implements CrawlerService {

    private final CrawlerTaskMapper   taskMapper;
    private final CompetitionMapper   competitionMapper;

    @Autowired(required = false)
    private StringRedisTemplate redisTemplate;  // 可选：Redis不可用时进度只存内存

    public CrawlerServiceImpl(CrawlerTaskMapper taskMapper, CompetitionMapper competitionMapper) {
        this.taskMapper = taskMapper;
        this.competitionMapper = competitionMapper;
    }

    @Value("${crawler.user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36}")
    private String userAgent;

    @Value("${crawler.timeout:30000}")
    private int timeout;

    /** 运行中的任务进度（taskId → 进度0~100） */
    private final Map<Integer, Integer> progressMap = new ConcurrentHashMap<>();

    /* =============================================
       定时任务：每天 06:00 扫描所有启用任务执行爬取
    ============================================= */
    @Scheduled(cron = "0 0 6 * * ?")
    public void scheduledCrawl() {
        log.info("[爬虫] 定时任务触发，开始扫描启用的爬虫任务…");
        List<CrawlerTask> tasks = taskMapper.selectRunningTasks();
        if (tasks.isEmpty()) {
            log.info("[爬虫] 没有启用的爬虫任务");
            return;
        }
        log.info("[爬虫] 发现 {} 个启用的任务", tasks.size());
        tasks.forEach(task -> runTaskAsync(task.getId()));
    }

    /* =============================================
       立即执行指定任务（异步）
    ============================================= */
    @Override
    @Async("crawlerExecutor")
    public void runTask(Integer taskId) {
        runTaskAsync(taskId);
    }

    private void runTaskAsync(Integer taskId) {
        CrawlerTask task = taskMapper.selectById(taskId);
        if (task == null) {
            log.warn("[爬虫] 任务 {} 不存在", taskId);
            return;
        }

        log.info("[爬虫] 开始执行任务 [{}] → {}", task.getName(), task.getTargetUrl());
        // 更新状态为运行中
        task.setStatus(1);
        task.setLastRun(LocalDateTime.now());
        taskMapper.updateById(task);
        setProgress(taskId, 0);

        try {
            List<Competition> results = doCrawl(task);
            int savedCount = 0;
            // 批量保存（忽略重复 URL）
            for (Competition c : results) {
                try {
                    if (c.getSourceUrl() != null && !c.getSourceUrl().isBlank()) {
                        Integer count = competitionMapper.countBySourceUrl(c.getSourceUrl());
                        if (count == null || count == 0) {
                            c.setIsCrawled(1);
                            c.setSourceSite(task.getSiteName());
                            c.setStatus(1);
                            c.setCreateTime(LocalDateTime.now());
                            c.setUpdateTime(LocalDateTime.now());
                            c.setDeleted(0);
                            competitionMapper.insert(c);
                            savedCount++;
                        }
                    }
                } catch (Exception e) {
                    log.warn("[爬虫] 保存单条数据失败: {}", e.getMessage());
                }
            }
            task.setStatus(2); // 完成
            task.setCrawlCount(task.getCrawlCount() + savedCount);
            log.info("[爬虫] 任务 [{}] 完成，爬取 {} 条，新增 {} 条", task.getName(), results.size(), savedCount);
        } catch (Exception e) {
            task.setStatus(3); // 失败
            task.setRemark(e.getMessage() != null && e.getMessage().length() > 200 
                ? e.getMessage().substring(0, 200) : e.getMessage());
            task.setCrawlCount(task.getCrawlCount() + 0);
            log.error("[爬虫] 任务 [{}] 失败：{}", task.getName(), e.getMessage(), e);
        } finally {
            taskMapper.updateById(task);
            setProgress(taskId, 100);
            // 5分钟后清理进度（Redis 可用时）
            if (redisTemplate != null) {
                try {
                    redisTemplate.expire("crawler:progress:" + taskId, 5, TimeUnit.MINUTES);
                } catch (Exception e) {
                    log.warn("[爬虫] Redis进度清理失败");
                }
            }
        }
    }

    /**
     * 核心爬取逻辑（Jsoup）
     * 根据不同网站选择不同解析策略
     * 注意：连接失败或解析为空时不再静默返回硬编码假数据
     */
    private List<Competition> doCrawl(CrawlerTask task) throws Exception {
        String url = task.getTargetUrl();
        List<Competition> list = new ArrayList<>();

        log.info("[爬虫] 正在连接: {}", url);
        Document doc;
        try {
            doc = Jsoup.connect(url)
                    .userAgent(userAgent)
                    .timeout(timeout)
                    .followRedirects(true)
                    .ignoreHttpErrors(true)
                    .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8;charset=UTF-8")
                    .header("Accept-Language", "zh-CN,zh;q=0.9,en;q=0.8")
                    .header("Connection", "keep-alive")
                    .header("Upgrade-Insecure-Requests", "1")
                    .header("Sec-Fetch-Dest", "document")
                    .header("Sec-Fetch-Mode", "navigate")
                    .header("Sec-Fetch-Site", "none")
                    .get();
        } catch (Exception e) {
            log.error("[爬虫] 连接失败 {}: {}", url, e.getMessage());
            // 连接失败时不再返回假数据，抛出异常让调用方标记失败
            throw new RuntimeException("连接失败: " + e.getMessage());
        }

        log.info("[爬虫] 成功获取页面，标题: {}", doc.title());
        
        // 检查HTTP状态
        int statusCode = doc.connection().response().statusCode();
        if (statusCode != 200) {
            log.warn("[爬虫] 返回非200状态码: {}", statusCode);
            throw new RuntimeException("HTTP状态码: " + statusCode);
        }

        // 根据来源网站选择解析策略
        String site = task.getSiteName() == null ? "" : task.getSiteName().toLowerCase();
        String lowerUrl = url.toLowerCase();
        
        if (site.contains("蓝桥") || lowerUrl.contains("lanqiao")) {
            list = parseLanqiao(doc, url, task.getId());
        } else if (site.contains("数学建模") || lowerUrl.contains("mcm") || lowerUrl.contains("math")) {
            list = parseMcm(doc, url, task.getId());
        } else if (site.contains("互联网") || lowerUrl.contains("ncss") || lowerUrl.contains("cy.ncss")) {
            list = parseInternetPlus(doc, url, task.getId());
        } else if (site.contains("ccf") || lowerUrl.contains("ccf")) {
            list = parseCcf(doc, url, task.getId());
        } else if (site.contains("机器人") || lowerUrl.contains("robo")) {
            list = parseRobot(doc, url, task.getId());
        } else if (site.contains("赛氪") || lowerUrl.contains("saikr")) {
            list = parseSaikr(doc, url, task.getId());
        } else if (site.contains("我爱竞赛网") || lowerUrl.contains("52jingsai")) {
            list = parse52Jingsai(doc, url, task.getId());
        } else {
            // 通用解析策略
            list = parseGeneric(doc, url, task.getId());
        }

        // 过滤掉非真实爬取数据（isCrawled=0 的是兜底假数据，不保存）
        list = list.stream()
                .filter(c -> c.getIsCrawled() != null && c.getIsCrawled() == 1)
                .collect(java.util.stream.Collectors.toList());

        // 数据清洗和标准化
        list = cleanAndStandardize(list, task);

        if (list.isEmpty()) {
            log.warn("[爬虫] 未能从 {} 解析到有效竞赛数据（网站可能为SPA动态渲染，Jsoup无法处理）", url);
            throw new RuntimeException("未能解析到有效竞赛数据（目标网站可能为动态渲染页面）");
        }

        // 更新进度
        setProgress(task.getId(), 100);
        return list;
    }

    /** 蓝桥杯 解析 */
    private List<Competition> parseLanqiao(Document doc, String baseUrl, Integer taskId) {
        List<Competition> list = new ArrayList<>();
        
        // 蓝桥杯官网可能的列表选择器
        String[] selectors = {
            ".comp-item", ".competition-card", "article.comp", ".contest-item", ".game-item",
            ".match-item", ".list-item", ".news-item", ".item",
            "a[href*='/cup/']", "a[href*='/contest/']", "a[href*='/game/']",
            ".container a[href*='lanqiao']", ".main a[href*='lanqiao']"
        };
        
        Elements items = new Elements();
        for (String selector : selectors) {
            items = doc.select(selector);
            if (!items.isEmpty()) break;
        }
        
        int total = items.size();
        log.info("[蓝桥杯] 找到 {} 个条目", total);
        
        int done = 0;
        for (Element el : items) {
            try {
                Competition c = new Competition();
                
                // 标题选择器 - 多种尝试
                String title = "";
                Element titleEl = el.selectFirst(".title, h2, h3, h4, .name, .contest-title, .item-title");
                if (titleEl != null) {
                    title = titleEl.text().trim();
                } else if (el.is("a")) {
                    title = el.text().trim();
                } else {
                    // 尝试从子元素找标题
                    titleEl = el.selectFirst("a");
                    if (titleEl != null) title = titleEl.text().trim();
                }
                
                if (title.isEmpty() || title.length() < 3) continue;
                if (!containsCompetitionKeyword(title)) continue;
                
                c.setTitle(title);
                
                // 链接
                String link = "";
                if (el.is("a")) {
                    link = el.attr("abs:href");
                } else {
                    Element linkEl = el.selectFirst("a[href]");
                    link = linkEl != null ? linkEl.attr("abs:href") : baseUrl;
                }
                c.setSourceUrl(link.isBlank() ? baseUrl : link);
                
                // 封面图
                Element imgEl = el.selectFirst("img");
                if (imgEl != null) {
                    String imgSrc = imgEl.attr("abs:src");
                    if (!imgSrc.isBlank()) {
                        c.setCover(imgSrc);
                    }
                }
                
                // 主办方和级别
                c.setOrganizer("工业和信息化部人才交流中心");
                c.setLevel(3); // 国家级
                c.setLevelName("国家级");
                
                // 尝试提取时间信息
                extractDateInfo(el, c);
                
                // 分类
                c.setCategoryId(2); // 程序设计类
                
                // 描述
                if (c.getDescription() == null) {
                    Element descEl = el.selectFirst(".desc, .description, .summary, p");
                    if (descEl != null) {
                        c.setDescription(descEl.text().trim());
                    }
                }
                
                list.add(c);
            } catch (Exception e) {
                log.warn("[蓝桥杯] 解析单条失败：{}", e.getMessage());
            }
            setProgress(taskId, ++done * 100 / Math.max(total, 1));
        }
        
        // 如果没有找到真实数据，返回空列表（不添加假数据）
        log.info("[蓝桥杯] 实际解析到 {} 条有效数据", list.size());
        
        return list;
    }

    /** 数学建模 解析 */
    private List<Competition> parseMcm(Document doc, String baseUrl, Integer taskId) {
        List<Competition> list = new ArrayList<>();
        
        String[] selectors = {
            ".news-item", ".article-item", "li.news", ".list-item", ".content-item",
            "a[href*='/news/']", "a[href*='/notice/']", "a[href*='/article/']",
            ".container li", ".main li"
        };
        
        Elements items = new Elements();
        for (String selector : selectors) {
            items = doc.select(selector);
            if (!items.isEmpty()) break;
        }
        
        int total = items.size();
        log.info("[数学建模] 找到 {} 个条目", total);
        
        int done = 0;
        for (Element el : items) {
            try {
                Competition c = new Competition();
                
                Element linkEl = el.is("a") ? el : el.selectFirst("a[href]");
                if (linkEl == null) continue;
                
                String title = linkEl.text().trim();
                if (title.isEmpty() || title.length() < 5) continue;
                if (!containsCompetitionKeyword(title)) continue;
                
                c.setTitle(title);
                c.setSourceUrl(linkEl.attr("abs:href"));
                c.setOrganizer("中国大学生数学建模竞赛组委会");
                c.setLevel(3);
                c.setLevelName("国家级");
                c.setCategoryId(1); // 数学建模类
                
                extractDateInfo(el, c);
                
                list.add(c);
            } catch (Exception e) {
                log.warn("[数学建模] 解析单条失败：{}", e.getMessage());
            }
            setProgress(taskId, ++done * 100 / Math.max(total, 1));
        }
        
        // 如果没有找到真实数据，返回空列表（不添加假数据）
        log.info("[数学建模] 实际解析到 {} 条有效数据", list.size());
        
        return list;
    }

    /** 互联网+ 解析 */
    private List<Competition> parseInternetPlus(Document doc, String baseUrl, Integer taskId) {
        List<Competition> list = new ArrayList<>();
        
        String[] selectors = {
            ".comp-list-item", ".competition", ".match-item", ".activity-item",
            "a[href*='/match/']", "a[href*='/activity/']", "a[href*='/contest/']",
            ".container a", ".main a"
        };
        
        Elements items = new Elements();
        for (String selector : selectors) {
            items = doc.select(selector);
            if (!items.isEmpty()) break;
        }
        
        int total = items.size();
        log.info("[互联网+] 找到 {} 个条目", total);
        
        int done = 0;
        for (Element el : items) {
            try {
                Competition c = new Competition();
                
                Element titleEl = el.selectFirst(".name, .title, h3, h4, .match-title");
                if (titleEl == null && el.is("a")) {
                    titleEl = el;
                }
                
                String title = titleEl != null ? titleEl.text().trim() : "";
                if (title.isEmpty() || title.length() < 5) continue;
                if (!containsCompetitionKeyword(title)) continue;
                
                c.setTitle(title);
                
                String link = "";
                if (el.is("a")) {
                    link = el.attr("abs:href");
                } else {
                    Element linkEl = el.selectFirst("a[href]");
                    link = linkEl != null ? linkEl.attr("abs:href") : baseUrl;
                }
                c.setSourceUrl(link.isBlank() ? baseUrl : link);
                
                Element imgEl = el.selectFirst("img");
                if (imgEl != null) {
                    c.setCover(imgEl.attr("abs:src"));
                }
                
                c.setOrganizer("教育部");
                c.setLevel(3);
                c.setLevelName("国家级");
                c.setCategoryId(3); // 创新创业类
                
                extractDateInfo(el, c);
                
                list.add(c);
            } catch (Exception e) {
                log.warn("[互联网+] 解析单条失败：{}", e.getMessage());
            }
            setProgress(taskId, ++done * 100 / Math.max(total, 1));
        }
        
        // 如果没有找到真实数据，返回空列表（不添加假数据）
        log.info("[互联网+] 实际解析到 {} 条有效数据", list.size());
        
        return list;
    }

    /** CCF 解析 */
    private List<Competition> parseCcf(Document doc, String baseUrl, Integer taskId) {
        List<Competition> list = new ArrayList<>();
        
        String[] selectors = {
            ".news-item", ".list-item", ".contest-item", ".activity-item",
            "a[href*='/news/']", "a[href*='/contest/']", "a[href*='/activity/']",
            ".container a", ".main a"
        };
        
        Elements items = new Elements();
        for (String selector : selectors) {
            items = doc.select(selector);
            if (!items.isEmpty()) break;
        }
        
        int total = items.size();
        log.info("[CCF] 找到 {} 个条目", total);
        
        int done = 0;
        for (Element el : items) {
            try {
                Competition c = new Competition();
                
                Element linkEl = el.is("a") ? el : el.selectFirst("a[href]");
                if (linkEl == null) continue;
                
                String title = linkEl.text().trim();
                if (title.isEmpty() || title.length() < 5) continue;
                if (!containsCompetitionKeyword(title)) continue;
                
                c.setTitle(title);
                c.setSourceUrl(linkEl.attr("abs:href"));
                c.setOrganizer("中国计算机学会");
                c.setLevel(3);
                c.setLevelName("国家级");
                c.setCategoryId(2); // 程序设计类
                
                extractDateInfo(el, c);
                
                list.add(c);
            } catch (Exception e) {
                log.warn("[CCF] 解析单条失败：{}", e.getMessage());
            }
            setProgress(taskId, ++done * 100 / Math.max(total, 1));
        }
        
        // 如果没有找到真实数据，返回空列表（不添加假数据）
        log.info("[CCF] 实际解析到 {} 条有效数据", list.size());
        
        return list;
    }

    /** 机器人大赛 解析 */
    private List<Competition> parseRobot(Document doc, String baseUrl, Integer taskId) {
        List<Competition> list = new ArrayList<>();
        
        String[] selectors = {
            ".news-item", ".match-item", ".contest-item", ".activity-item",
            "a[href*='/match/']", "a[href*='/news/']",
            ".container a", ".main a"
        };
        
        Elements items = new Elements();
        for (String selector : selectors) {
            items = doc.select(selector);
            if (!items.isEmpty()) break;
        }
        
        int total = items.size();
        log.info("[机器人] 找到 {} 个条目", total);
        
        int done = 0;
        for (Element el : items) {
            try {
                Competition c = new Competition();
                
                Element linkEl = el.is("a") ? el : el.selectFirst("a[href]");
                if (linkEl == null) continue;
                
                String title = linkEl.text().trim();
                if (title.isEmpty() || title.length() < 5) continue;
                if (!containsCompetitionKeyword(title)) continue;
                
                c.setTitle(title);
                c.setSourceUrl(linkEl.attr("abs:href"));
                c.setOrganizer("中国自动化学会");
                c.setLevel(3);
                c.setLevelName("国家级");
                c.setCategoryId(5); // 机器人类
                
                extractDateInfo(el, c);
                
                list.add(c);
            } catch (Exception e) {
                log.warn("[机器人] 解析单条失败：{}", e.getMessage());
            }
            setProgress(taskId, ++done * 100 / Math.max(total, 1));
        }
        
        // 如果没有找到真实数据，返回空列表（不添加假数据）
        log.info("[机器人] 实际解析到 {} 条有效数据", list.size());
        
        return list;
    }

    /** 赛氪网 解析 - 国内大型竞赛平台 */
    private List<Competition> parseSaikr(Document doc, String baseUrl, Integer taskId) {
        List<Competition> list = new ArrayList<>();
        
        String[] selectors = {
            ".competition-item", ".match-item", ".activity-item",
            ".list-item", ".item", ".card",
            "a[href*='/cm/']", "a[href*='/vs/']"
        };
        
        Elements items = new Elements();
        for (String selector : selectors) {
            items = doc.select(selector);
            if (!items.isEmpty()) break;
        }
        
        int total = items.size();
        log.info("[赛氪] 找到 {} 个条目", total);
        
        int done = 0;
        for (Element el : items) {
            try {
                Competition c = new Competition();
                
                Element titleEl = el.selectFirst(".title, h3, h4, .name, .competition-title");
                if (titleEl == null && el.is("a")) {
                    titleEl = el;
                }
                
                String title = titleEl != null ? titleEl.text().trim() : "";
                if (title.isEmpty() || title.length() < 3) continue;
                if (!containsCompetitionKeyword(title)) continue;
                
                c.setTitle(title);
                
                String link = "";
                if (el.is("a")) {
                    link = el.attr("abs:href");
                } else {
                    Element linkEl = el.selectFirst("a[href]");
                    link = linkEl != null ? linkEl.attr("abs:href") : baseUrl;
                }
                c.setSourceUrl(link.isBlank() ? baseUrl : link);
                
                Element imgEl = el.selectFirst("img");
                if (imgEl != null) {
                    c.setCover(imgEl.attr("abs:src"));
                }
                
                // 尝试提取主办方
                Element orgEl = el.selectFirst(".organizer, .host, .sponsor");
                if (orgEl != null) {
                    c.setOrganizer(orgEl.text().trim());
                } else {
                    c.setOrganizer("赛氪网");
                }
                
                c.setLevel(3);
                c.setLevelName("国家级");
                c.setCategoryId(1);
                
                extractDateInfo(el, c);
                
                list.add(c);
            } catch (Exception e) {
                log.warn("[赛氪] 解析单条失败：{}", e.getMessage());
            }
            setProgress(taskId, ++done * 100 / Math.max(total, 1));
        }
        
        // 如果没有找到真实数据，返回空列表（不添加假数据）
        log.info("[赛氪] 实际解析到 {} 条有效数据", list.size());
        
        return list;
    }

    /** 我爱竞赛网 解析 */
    private List<Competition> parse52Jingsai(Document doc, String baseUrl, Integer taskId) {
        List<Competition> list = new ArrayList<>();
        
        String[] selectors = {
            ".news-item", ".list-item", ".match-item",
            "a[href*='/news/']", "a[href*='/match/']",
            ".container li", ".main li"
        };
        
        Elements items = new Elements();
        for (String selector : selectors) {
            items = doc.select(selector);
            if (!items.isEmpty()) break;
        }
        
        int total = items.size();
        log.info("[我爱竞赛网] 找到 {} 个条目", total);
        
        int done = 0;
        for (Element el : items) {
            try {
                Competition c = new Competition();
                
                Element linkEl = el.is("a") ? el : el.selectFirst("a[href]");
                if (linkEl == null) continue;
                
                String title = linkEl.text().trim();
                if (title.isEmpty() || title.length() < 3) continue;
                if (!containsCompetitionKeyword(title)) continue;
                
                c.setTitle(title);
                c.setSourceUrl(linkEl.attr("abs:href"));
                c.setOrganizer("我爱竞赛网");
                c.setLevel(3);
                c.setLevelName("国家级");
                c.setCategoryId(1);
                
                extractDateInfo(el, c);
                
                list.add(c);
            } catch (Exception e) {
                log.warn("[我爱竞赛网] 解析单条失败：{}", e.getMessage());
            }
            setProgress(taskId, ++done * 100 / Math.max(total, 1));
        }
        
        // 如果没有找到真实数据，返回空列表（不添加假数据）
        log.info("[我爱竞赛网] 实际解析到 {} 条有效数据", list.size());
        
        return list;
    }

    /** 通用解析策略 */
    private List<Competition> parseGeneric(Document doc, String baseUrl, Integer taskId) {
        List<Competition> list = new ArrayList<>();
        
        // 寻找包含竞赛关键词的链接
        String[] keywords = {"竞赛", "大赛", "比赛", "杯", "挑战", "Contest", "Competition", "Challenge"};
        Elements links = doc.select("a[href]");
        
        int count = 0;
        for (Element link : links) {
            try {
                String text = link.text().trim();
                if (text.length() < 5 || text.length() > 100) continue;
                
                boolean match = false;
                for (String kw : keywords) {
                    if (text.toLowerCase().contains(kw.toLowerCase())) {
                        match = true;
                        break;
                    }
                }
                if (!match) continue;
                
                Competition c = new Competition();
                c.setTitle(text);
                c.setSourceUrl(link.attr("abs:href"));
                c.setLevel(3);
                c.setLevelName("国家级");
                c.setOrganizer("未知主办方");
                c.setCategoryId(1);
                
                list.add(c);
                count++;
                if (count >= 30) break; // 通用策略最多取30条
            } catch (Exception e) {
                log.warn("[通用] 解析单条失败：{}", e.getMessage());
            }
        }
        
        log.info("[通用] 找到 {} 个条目", list.size());
        
        log.info("[通用] 实际解析到 {} 条有效数据", list.size());
        if (list.isEmpty()) {
            return list; // 返回空，不添加假数据
        }
        
        return list;
    }

    /** 提取日期信息 */
    private void extractDateInfo(Element el, Competition c) {
        // 尝试从元素文本中提取日期
        String text = el.text();
        
        // 匹配各种日期格式
        Pattern[] patterns = {
            Pattern.compile("(20\\d{2})[年/-](\\d{1,2})[月/-](\\d{1,2})"),
            Pattern.compile("(20\\d{2})(\\d{2})(\\d{2})"),
            Pattern.compile("(\\d{1,2})[月](\\d{1,2})[日]")
        };
        
        for (Pattern pattern : patterns) {
            Matcher m = pattern.matcher(text);
            if (m.find()) {
                try {
                    String dateStr = m.group(0);
                    // 简单设置描述信息
                    if (c.getDescription() == null) {
                        c.setDescription("相关时间: " + dateStr);
                    }
                    break;
                } catch (Exception e) {
                    // ignore
                }
            }
        }
    }

    /** 数据清洗和标准化 */
    private List<Competition> cleanAndStandardize(List<Competition> list, CrawlerTask task) {
        List<Competition> cleaned = new ArrayList<>();
        
        for (Competition c : list) {
            try {
                // 清洗标题
                if (c.getTitle() != null) {
                    String title = c.getTitle()
                        .replaceAll("\\s+", " ")
                        .trim();
                    c.setTitle(title);
                }
                
                // 清洗URL
                if (c.getSourceUrl() != null) {
                    String srcUrl = c.getSourceUrl().trim();
                    if (!srcUrl.startsWith("http")) {
                        srcUrl = "https://" + srcUrl;
                    }
                    c.setSourceUrl(srcUrl);
                }
                
                // 标准化级别
                if (c.getLevel() == null) {
                    c.setLevel(3);
                }
                if (c.getLevelName() == null) {
                    c.setLevelName(getLevelName(c.getLevel()));
                }
                
                // 标准化分类
                if (c.getCategoryId() == null) {
                    c.setCategoryId(1);
                }
                
                // 设置默认值
                if (c.getOrganizer() == null || c.getOrganizer().isBlank()) {
                    c.setOrganizer(task.getSiteName() != null ? task.getSiteName() : "未知主办方");
                }
                
                // 设置状态
                c.setStatus(1);
                // 标记为真实爬取数据
                c.setIsCrawled(1);
                
                cleaned.add(c);
            } catch (Exception e) {
                log.warn("[清洗] 数据清洗失败：{}", e.getMessage());
            }
        }
        
        log.info("[爬虫] 数据清洗完成，原始 {} 条，清洗后 {} 条", list.size(), cleaned.size());
        return cleaned;
    }

    private String getLevelName(Integer level) {
        if (level == null) return "国家级";
        return switch (level) {
            case 1 -> "校级";
            case 2 -> "省级";
            case 3 -> "国家级";
            case 4 -> "国际级";
            default -> "国家级";
        };
    }

    /* =============================================
       默认数据生成（当爬取失败时使用）
    ============================================= */

    private List<Competition> createDefaultCompetitions(CrawlerTask task) {
        String site = task.getSiteName() == null ? "" : task.getSiteName().toLowerCase();
        String url = task.getTargetUrl();
        
        if (site.contains("蓝桥") || url.contains("lanqiao")) {
            return createLanqiaoDefaults(url);
        } else if (site.contains("数学") || url.contains("mcm")) {
            return createMcmDefaults(url);
        } else if (site.contains("互联网") || url.contains("ncss")) {
            return createInternetPlusDefaults(url);
        } else if (site.contains("ccf")) {
            return createCcfDefaults(url);
        } else if (site.contains("机器人") || url.contains("robo")) {
            return createRobotDefaults(url);
        } else if (site.contains("赛氪") || url.contains("saikr")) {
            return createGenericDefaults(url, "赛氪网");
        } else if (site.contains("我爱竞赛") || url.contains("52jingsai")) {
            return createGenericDefaults(url, "我爱竞赛网");
        } else {
            return createGenericDefaults(url, task.getName());
        }
    }

    private List<Competition> createLanqiaoDefaults(String baseUrl) {
        List<Competition> list = new ArrayList<>();
        
        Competition c1 = new Competition();
        c1.setTitle("第十六届蓝桥杯全国软件和信息技术专业人才大赛");
        c1.setSourceUrl("https://dasai.lanqiao.cn/");
        c1.setOrganizer("工业和信息化部人才交流中心");
        c1.setLevel(3);
        c1.setLevelName("国家级");
        c1.setCategoryId(2);
        c1.setDescription("蓝桥杯大赛是全国高校IT类专业规模最大的赛事，包括C/C++程序设计、Java软件开发、Python程序设计、Web应用开发等多个赛道。");
        c1.setCover("https://dasai.lanqiao.cn/static/images/logo.png");
        list.add(c1);
        
        Competition c2 = new Competition();
        c2.setTitle("蓝桥杯青少年创意编程大赛");
        c2.setSourceUrl("https://dasai.lanqiao.cn/qingshaonian/");
        c2.setOrganizer("工业和信息化部人才交流中心");
        c2.setLevel(3);
        c2.setLevelName("国家级");
        c2.setCategoryId(2);
        c2.setDescription("面向青少年的创意编程竞赛，培养青少年计算思维和编程能力。");
        list.add(c2);
        
        return list;
    }

    private List<Competition> createMcmDefaults(String baseUrl) {
        List<Competition> list = new ArrayList<>();
        
        Competition c1 = new Competition();
        c1.setTitle("2026年全国大学生数学建模竞赛");
        c1.setSourceUrl("http://www.mcm.edu.cn/");
        c1.setOrganizer("中国大学生数学建模竞赛组委会");
        c1.setLevel(3);
        c1.setLevelName("国家级");
        c1.setCategoryId(1);
        c1.setDescription("全国大学生数学建模竞赛是面向全国高校本科生的数学建模竞赛，每年9月举行。");
        list.add(c1);
        
        Competition c2 = new Competition();
        c2.setTitle("美国大学生数学建模竞赛(MCM/ICM)");
        c2.setSourceUrl("https://www.comap.com/undergraduate/contests/");
        c2.setOrganizer("COMAP");
        c2.setLevel(4);
        c2.setLevelName("国际级");
        c2.setCategoryId(1);
        c2.setDescription("美国大学生数学建模竞赛是唯一的国际性数学建模竞赛，每年1月举行。");
        list.add(c2);
        
        return list;
    }

    private List<Competition> createInternetPlusDefaults(String baseUrl) {
        List<Competition> list = new ArrayList<>();
        
        Competition c1 = new Competition();
        c1.setTitle("第十一届中国国际\"互联网+\"大学生创新创业大赛");
        c1.setSourceUrl("https://cy.ncss.cn/");
        c1.setOrganizer("教育部");
        c1.setLevel(3);
        c1.setLevelName("国家级");
        c1.setCategoryId(3);
        c1.setDescription("互联网+大赛是我国深化创新创业教育改革的重要载体，已成为覆盖全国所有高校、面向全体大学生、影响最大的高校双创盛会。");
        list.add(c1);
        
        return list;
    }

    private List<Competition> createCcfDefaults(String baseUrl) {
        List<Competition> list = new ArrayList<>();
        
        Competition c1 = new Competition();
        c1.setTitle("中国高校计算机大赛-人工智能创意赛");
        c1.setSourceUrl("https://www.ccf.org.cn/");
        c1.setOrganizer("中国计算机学会");
        c1.setLevel(3);
        c1.setLevelName("国家级");
        c1.setCategoryId(2);
        c1.setDescription("面向全国高校学生的人工智能创新应用竞赛。");
        list.add(c1);
        
        Competition c2 = new Competition();
        c2.setTitle("CCF CCSP竞赛");
        c2.setSourceUrl("https://www.ccf.org.cn/ccsp/");
        c2.setOrganizer("中国计算机学会");
        c2.setLevel(3);
        c2.setLevelName("国家级");
        c2.setCategoryId(2);
        c2.setDescription("CCF大学生计算机系统与程序设计竞赛，考察算法和程序设计能力。");
        list.add(c2);
        
        return list;
    }

    private List<Competition> createRobotDefaults(String baseUrl) {
        List<Competition> list = new ArrayList<>();
        
        Competition c1 = new Competition();
        c1.setTitle("2026中国机器人大赛");
        c1.setSourceUrl("http://www.robotmatch.cn/");
        c1.setOrganizer("中国自动化学会");
        c1.setLevel(3);
        c1.setLevelName("国家级");
        c1.setCategoryId(5);
        c1.setDescription("中国机器人大赛是国内机器人领域最高水平的竞赛，包括RoboCup、水中机器人、救援机器人等多个项目。");
        list.add(c1);
        
        Competition c2 = new Competition();
        c2.setTitle("RoboMaster机甲大师赛");
        c2.setSourceUrl("https://www.robomaster.com/");
        c2.setOrganizer("大疆创新");
        c2.setLevel(3);
        c2.setLevelName("国家级");
        c2.setCategoryId(5);
        c2.setDescription("全国大学生机器人大赛，是全球首个射击对抗类机器人比赛。");
        list.add(c2);
        
        return list;
    }

    private List<Competition> createGenericDefaults(String baseUrl, String sourceName) {
        List<Competition> list = new ArrayList<>();
        
        Competition c = new Competition();
        c.setTitle(sourceName + " - 竞赛信息");
        c.setSourceUrl(baseUrl);
        c.setOrganizer(sourceName);
        c.setLevel(3);
        c.setLevelName("国家级");
        c.setCategoryId(1);
        c.setDescription("从 " + sourceName + " 爬取的竞赛信息，请访问原网站获取最新详情。");
        list.add(c);
        
        return list;
    }

    /** 检查是否包含竞赛关键词 */
    private boolean containsCompetitionKeyword(String text) {
        if (text == null || text.isBlank()) return false;
        String[] keywords = {"竞赛", "大赛", "比赛", "杯", "挑战", "Contest", "Competition", "Challenge", "Cup"};
        for (String kw : keywords) {
            if (text.toLowerCase().contains(kw.toLowerCase())) {
                return true;
            }
        }
        return false;
    }

    private String absUrl(Element el, String base) {
        if (el == null) return base;
        String href = el.attr("abs:href");
        return href.isBlank() ? base : href;
    }

    private void setProgress(Integer taskId, int percent) {
        progressMap.put(taskId, percent);
        // Redis 可用时同步写入，不可用时仅内存存储
        if (redisTemplate != null) {
            try {
                redisTemplate.opsForValue().set(
                        "crawler:progress:" + taskId,
                        String.valueOf(percent),
                        30, TimeUnit.MINUTES);
            } catch (Exception e) {
                log.warn("[爬虫] 写入Redis进度失败，使用内存进度");
            }
        }
    }

    @Override
    public void startTask(Integer id) {
        CrawlerTask t = taskMapper.selectById(id);
        if (t != null) { t.setStatus(1); taskMapper.updateById(t); }
    }

    @Override
    public void stopTask(Integer id) {
        CrawlerTask t = taskMapper.selectById(id);
        if (t != null) { t.setStatus(0); taskMapper.updateById(t); }
    }

    @Override
    public List<CrawlerTask> listTasks() { return taskMapper.selectList(null); }

    @Override
    public void addTask(CrawlerTask task) { 
        task.setStatus(0);
        task.setCrawlCount(0);
        task.setCreateTime(LocalDateTime.now());
        task.setUpdateTime(LocalDateTime.now());
        taskMapper.insert(task); 
    }

    @Override
    public void deleteTask(Integer id)   { taskMapper.deleteById(id); }

    @Override
    public Map<String, Object> getProgress(Integer id) {
        int percent = progressMap.getOrDefault(id, -1);
        if (percent == -1 && redisTemplate != null) {
            try {
                String val = redisTemplate.opsForValue().get("crawler:progress:" + id);
                percent = val != null ? Integer.parseInt(val) : 0;
            } catch (Exception e) {
                percent = 0;
            }
        }
        if (percent == -1) percent = 0;  // 内存和Redis都没有时返回0
        return Map.of("taskId", id, "progress", percent);
    }

    @Override public List<Competition> getTaskCompetitions(Integer taskId) {
        CrawlerTask task = taskMapper.selectById(taskId);
        if (task == null || task.getTargetUrl() == null) {
            return new ArrayList<>();
        }
        // 根据目标URL匹配source_url字段查询该爬虫任务爬取的竞赛
        return competitionMapper.selectList(
            new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<Competition>()
                .like(Competition::getSourceUrl, task.getTargetUrl())
                .orderByDesc(Competition::getCreateTime)
        );
    }
}
