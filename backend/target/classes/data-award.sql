-- =====================================================
-- 获奖记录种子数据
-- 确保论坛点击用户名时能看到对应的获奖信息
-- =====================================================

INSERT INTO award_record (id, user_id, comp_name, award_level, award_time, certificate, photo_url, source, status, description, create_time)
SELECT * FROM (
    SELECT 1 AS id, 3 AS user_id, '第十四届蓝桥杯程序设计大赛' AS comp_name,
           '二等奖' AS award_level, '2025-05-20' AS award_time,
           '' AS certificate, '' AS photo_url, 'self' AS source, 1 AS status,
           '省赛二等奖' AS description, '2026-04-15 10:00:00' AS create_time
    UNION ALL
    SELECT 2, 3, '第九届全国大学生数学建模竞赛',
           '一等奖', '2025-09-15',
           '', '', 'self', 1,
           '国家级一等奖', '2026-04-15 10:05:00'
    UNION ALL
    SELECT 3, 4, '校级软件开发大赛',
           '特等奖', '2025-12-01',
           '', '', 'self', 1,
           '校园科技节特等奖', '2026-04-15 10:10:00'
    UNION ALL
    SELECT 4, 3, '全国大学生电子设计竞赛',
           '二等奖', '2025-08-20',
           '', '', 'self', 1,
           '省级二等奖', '2026-04-20 14:00:00'
    UNION ALL
    SELECT 5, 4, '全国大学生数学竞赛',
           '三等奖', '2025-11-10',
           '', '', 'self', 1,
           '数学专业组三等奖', '2026-04-20 14:30:00'
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM award_record WHERE id IN (1,2,3,4,5));

SELECT 'Award seed data inserted successfully' AS result;
