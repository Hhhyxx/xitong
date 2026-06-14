# 爬虫模块设计文档

## 1. 技术选型

| 组件 | 选择 | 说明 |
|------|------|------|
| 爬取库 | **Jsoup 1.17** | Java 原生 HTML 解析，无需浏览器驱动，轻量高效 |
| 调度框架 | **Spring @Scheduled** | 内置 Cron 表达式调度，无需额外引入 Quartz |
| 异步执行 | **Spring @Async** | 爬虫任务异步执行，不阻塞主线程 |
| 进度存储 | **Redis** | 实时进度存储，TTL 30 分钟，前端轮询展示 |
| 去重策略 | **数据库 URL 唯一索引** | 爬取前检查 source_url 避免重复入库 |

---

## 2. 架构设计

```
CrawlerController
       │  REST API（管理员触发 / 查询进度）
       ▼
CrawlerService
       │
       ├── listTasks()         查询任务列表
       ├── runTask(id)         立即执行（@Async 异步）
       ├── startTask / stopTask  状态管理
       └── getProgress(id)     Redis 实时进度
       │
       ▼
CrawlerServiceImpl.doCrawl(task)
       │
       ├── parseLanqiao(doc)    蓝桥杯专用解析
       ├── parseMcm(doc)        数学建模专用解析
       ├── parseInternetPlus()  互联网+专用解析
       └── parseGeneric(doc)    通用解析（fallback）
       │
       ▼
CompetitionMapper.insert(competition)  ← 去重后批量写库
```

---

## 3. 数据库：爬虫任务表

```sql
CREATE TABLE crawler_task (
    id         INT         PRIMARY KEY AUTO_INCREMENT,
    name       VARCHAR(100) NOT NULL COMMENT '任务名称',
    target_url VARCHAR(500) NOT NULL COMMENT '目标 URL',
    site_name  VARCHAR(100)          COMMENT '网站名称（用于选择解析策略）',
    cron_expr  VARCHAR(50)           COMMENT 'Spring Cron 表达式',
    status     TINYINT DEFAULT 0     COMMENT '0停止 1运行 2完成 3失败',
    crawl_count INT     DEFAULT 0    COMMENT '累计爬取数量',
    last_run   DATETIME              COMMENT '最后运行时间',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 4. 爬取字段映射

爬取目标字段（只取以下 5 项，其余由管理员补充）：

| 目标字段 | Jsoup 选择器示例 | competition 表字段 |
|----------|------------------|--------------------|
| **封面图** | `img.cover`, `img[src]` | `cover` |
| **竞赛标题** | `.title`, `h2`, `h3` | `title` |
| **时间** | `.date`, `.time`, `time` | `comp_time` |
| **主办方** | `.organizer`, `.host` | `organizer` |
| **原始链接** | `a[href]` | `source_url` |

---

## 5. 支持的目标网站及解析策略

| 网站 | URL 关键词 | 解析策略 | 主要选择器 |
|------|-----------|----------|-----------|
| 蓝桥杯 | lanqiao.cn | `parseLanqiao` | `.comp-item`, `h2`, `img` |
| 数学建模 | mcm.edu.cn | `parseMcm` | `.news-item`, `a`, `.date` |
| 互联网+ | cy.ncss.cn | `parseInternetPlus` | `.comp-list-item`, `.name`, `img` |
| CCF | ccf.org.cn | `parseGeneric` | 通用链接关键词过滤 |
| 其他 | — | `parseGeneric` | 含"竞赛/大赛/competition"关键词链接 |

---

## 6. 调度与执行流程

```
定时任务（每天 06:00）
  └─ 查询所有 status=1(running) 任务
       └─ 异步执行 runTaskAsync(taskId)
              │
              ├─ 更新 status=1，last_run=now
              ├─ Jsoup.connect(url).get() → Document
              ├─ 调用对应 parseXxx() 策略
              ├─ 每解析一条 → Redis 更新进度
              ├─ 循环 INSERT（去重判断）
              ├─ 成功 → status=2，crawl_count+N
              └─ 失败 → status=3，记录异常日志
```

---

## 7. 去重机制

```java
// 在 CompetitionMapper 中
@Select("SELECT COUNT(*) FROM competition WHERE source_url = #{url}")
int countBySourceUrl(@Param("url") String url);

// 使用前检查
if (competitionMapper.countBySourceUrl(c.getSourceUrl()) == 0) {
    competitionMapper.insert(c);
}
```

---

## 8. 进度存储（Redis）

```
Key   : crawler:progress:{taskId}
Value : "72"（百分比 0-100）
TTL   : 30 分钟

前端轮询 API：GET /api/crawler/tasks/{id}/progress
返回：{ "taskId": 1, "progress": 72 }
```

---

## 9. 异步线程池配置

```java
@Configuration
@EnableAsync
public class AsyncConfig {
    @Bean("crawlerExecutor")
    public Executor crawlerExecutor() {
        ThreadPoolTaskExecutor ex = new ThreadPoolTaskExecutor();
        ex.setCorePoolSize(3);
        ex.setMaxPoolSize(5);
        ex.setQueueCapacity(10);
        ex.setThreadNamePrefix("crawler-");
        ex.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        ex.initialize();
        return ex;
    }
}
```

---

## 10. 扩展：反爬应对策略

| 问题 | 应对策略 |
|------|----------|
| IP 封锁 | 配置代理池（ProxySelector），轮换 IP |
| 请求频率限制 | 每条请求间 `Thread.sleep(500~2000ms)` 随机延迟 |
| User-Agent 检测 | 从 UA 池随机选取，模拟真实浏览器 |
| JS 渲染页面 | 使用 Playwright/Selenium（仅对必要网站） |
| Cookie/Session | 保持 Jsoup Connection 复用，自动携带 Cookie |

---

## 11. 竞赛数据来源列表

| 竞赛名称 | 来源网站 | 周期 |
|----------|----------|------|
| 全国大学生数学建模竞赛 | mcm.edu.cn | 每年9月 |
| 蓝桥杯 | lanqiao.cn | 每年4月 |
| 互联网+大赛 | cy.ncss.cn | 每年9月 |
| 中国机器人大赛 | robo.com.cn | 每年7月 |
| CCF 系列赛 | ccf.org.cn | 全年 |
| 大学生电子设计竞赛 | nuedc.com.cn | 每年8月 |
| 全国大学生节能减排赛 | nueec.org.cn | 每年6月 |
