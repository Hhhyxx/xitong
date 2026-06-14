-- =====================================================
-- 论坛种子数据 - 初始演示帖子
-- 确保不同用户登录后看到相同的论坛内容
-- =====================================================

-- 插入演示帖子（仅在表为空时插入）
INSERT INTO forum_post (id, user_id, user_nickname, title, content, category, view_count, reply_count, like_count, is_top, status, create_time)
SELECT * FROM (
    SELECT 1 AS id, 3 AS user_id, '追梦少年' AS user_nickname,
           '【经验分享】我是如何准备蓝桥杯省赛的' AS title,
           '大家好！最近很多同学在问蓝桥杯怎么准备，我分享一下我的经验。\n\n首先，数据结构是重中之重：\n1. 数组、链表、栈、队列这些基础要非常熟练\n2. 二叉树的各种遍历、堆、并查集\n3. 图的最短路径、最小生成树\n\n其次，算法方面：\n1. 贪心算法\n2. 动态规划（背包问题、LCS等）\n3. 搜索（DFS/BFS）\n\n推荐刷题平台：\n- LeetCode（按标签刷）\n- 蓝桥杯官网题库\n- 洛谷（适合新手入门）\n\n坚持每天刷2-3题，3个月就能有明显提升！加油💪' AS content,
           'experience' AS category, 258 AS view_count, 5 AS reply_count, 23 AS like_count, 1 AS is_top, 1 AS status,
           '2026-04-20 10:30:00' AS create_time
    UNION ALL
    SELECT 2, 4, '李四同学',
           '【问题求助】数学建模竞赛需要哪些工具？',
           '我是大二数学专业的，想参加今年的数学建模竞赛，但不知道要准备哪些工具软件。\n\n目前我知道的有：\n- MATLAB（学校有授权）\n- Python（会一些基础）\n\n请问还需要学什么？LaTeX必须要学吗？SPSS和Lingo哪个更好用？\n\n求各位大佬指点迷津！🙏',
           'question', 186, 8, 15, 0, 1,
           '2026-04-22 14:15:00'
    UNION ALL
    SELECT 3, 3, '追梦少年',
           '【赛事讨论】2026互联网+大赛新变化解读',
           '刚看了教育部最新的通知，2026年的互联网+大赛（现在叫"中国国际大学生创新大赛"）有几个重要变化：\n\n1. 赛道调整：新增"人工智能+"赛道，聚焦AI应用创新\n2. 评审标准：更加注重项目的实际落地和社会价值\n3. 报名时间：比往年提前了一个月，大家注意不要错过\n4. 校企合作：新增了企业命题赛道，华为、腾讯等都有出题\n\n建议大家尽早组队，选题要贴合国家战略需求，比如乡村振兴、碳中和、数字经济等方向。\n\n有一起组队的吗？可以留言交流~',
           'competition', 312, 12, 45, 0, 1,
           '2026-04-25 09:00:00'
    UNION ALL
    SELECT 4, 4, '李四同学',
           '【综合讨论】大家觉得参加竞赛最大的收获是什么？',
           '我参加了两次数学建模竞赛，虽然都没有拿到很好的名次，但感觉收获特别大。\n\n最大的收获不是证书，而是：\n1. 学会了团队协作（三天三夜同吃同住的经历太难忘）\n2. 快速学习的能力（三天学完一门新知识）\n3. 抗压能力（截止时间前通宵赶论文）\n4. 认识了志同道合的朋友\n\n大家觉得呢？欢迎分享你的竞赛故事~',
           'general', 145, 6, 20, 0, 1,
           '2026-04-28 16:45:00'
    UNION ALL
    SELECT 5, 3, '追梦少年',
           '【经验分享】电子设计大赛从零到国奖的进阶之路',
           '去年参加了全国大学生电子设计竞赛，侥幸拿了国二，分享一下完整的时间线和准备策略。\n\n第一阶段（赛前3个月）：基础积累\n- 模电数电基础要扎实\n- 至少熟练掌握一种单片机（STM32推荐）\n- 学会画PCB（立创EDA就行）\n\n第二阶段（赛前1个月）：实战练习\n- 做往年的赛题，限时4天3夜\n- 重点练电源、放大、信号处理类题目\n\n第三阶段（比赛期间）：\n- 第一天确定方案\n- 第二三天焊接调试\n- 第四天写报告\n\n关键是要有备用的元器件箱！血的教训！',
           'experience', 203, 4, 31, 0, 1,
           '2026-05-01 11:00:00'
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM forum_post WHERE id IN (1,2,3,4,5));

-- 插入演示回复
INSERT INTO forum_reply (id, post_id, user_id, user_nickname, content, like_count, status, create_time)
SELECT * FROM (
    SELECT 1 AS id, 1 AS post_id, 4 AS user_id, '李四同学' AS user_nickname,
           '太感谢了！非常详细的经验分享。想请问一下，蓝桥杯的省赛难度大概是什么水平？和LeetCode的中等题比起来怎么样？' AS content,
           5 AS like_count, 1 AS status, '2026-04-20 11:00:00' AS create_time
    UNION ALL
    SELECT 2, 1, 3, '追梦少年',
           '省赛大概相当于LeetCode中等偏难的水平，但题目更偏向实际应用场景，不是纯算法题。' AS content,
           3, 1, '2026-04-20 11:30:00'
    UNION ALL
    SELECT 3, 2, 3, '追梦少年',
           'Python完全够用了！推荐用Python+NumPy+Matplotlib组合，简单高效。LaTeX不强制但推荐学，用Overleaf在线编辑很方便。' AS content,
           8, 1, '2026-04-22 15:00:00'
    UNION ALL
    SELECT 4, 2, 4, '李四同学',
           '好的，谢谢！那我先学Python的数据处理库，LaTeX晚点再学。' AS content,
           2, 1, '2026-04-22 16:20:00'
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM forum_reply WHERE id IN (1,2,3,4));

SELECT 'Forum seed data inserted successfully' AS result;
