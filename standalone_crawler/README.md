# 独立竞赛数据爬虫

本目录只用于独立爬虫任务，不依赖、不修改竞赛系统后端和前端代码。

## 文件说明

- `latest_competition_crawler.py`：爬取最新竞赛相关链接，输出 CSV、JSON 和 HTML 表格可视化。
- `schema_latest_crawled_competition.sql`：新建 MySQL 表 `latest_crawled_competition`。
- `output/`：脚本运行后生成，包含 `latest_competitions.html`、`latest_competitions.csv`、`latest_competitions.json`。

## 建表

```bash
mysql -h 127.0.0.1 -P 3306 -u root -p competition_system < schema_latest_crawled_competition.sql
```

## 运行

仅生成可视化文件，不写 MySQL：

```bash
python latest_competition_crawler.py --no-mysql
```

写入 MySQL：

```bash
python latest_competition_crawler.py --mysql-host 127.0.0.1 --mysql-port 3306 --mysql-user root --mysql-password 123456 --mysql-database competition_system
```

也可以通过环境变量传入数据库连接：

```bash
set MYSQL_HOST=127.0.0.1
set MYSQL_PORT=3306
set MYSQL_USER=root
set MYSQL_PASSWORD=123456
set MYSQL_DATABASE=competition_system
python latest_competition_crawler.py
```

## 数据来源

默认尝试从蓝桥杯、全国大学生数学建模竞赛、中国国际大学生创新大赛、全国大学生电子设计竞赛、CCF 等公开页面抓取竞赛相关链接。部分站点如果需要登录、强依赖 JavaScript 或临时限制访问，脚本会跳过该来源并继续处理其他来源。
