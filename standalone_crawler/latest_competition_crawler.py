# -*- coding: utf-8 -*-
"""
Standalone latest competition crawler.

This script is intentionally independent from the Spring Boot competition system.
It fetches recent competition-related links, writes optional MySQL rows into
latest_crawled_competition, and generates table visualization files.
"""

from __future__ import annotations

import argparse
import csv
import html
import json
import os
import re
import sys
import time
from dataclasses import asdict, dataclass
from datetime import date, datetime
from html.parser import HTMLParser
from pathlib import Path
from typing import Iterable
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen


BASE_DIR = Path(__file__).resolve().parent
OUTPUT_DIR = BASE_DIR / "output"

KEYWORDS = [
    "竞赛", "大赛", "比赛", "报名", "参赛", "通知", "征集", "赛项",
    "competition", "contest", "challenge",
]

SKIP_TITLES = {
    "报名参赛", "登录", "注册", "首页", "更多", "查看详情", "了解更多",
    "个人中心", "用户中心", "联系我们", "网站地图", "English",
}

SKIP_URL_PARTS = [
    "/login", "/register", "/userhome", "/user/", "/account", "javascript:",
]

DEFAULT_SOURCES = [
    {
        "name": "蓝桥杯大赛",
        "url": "https://dasai.lanqiao.cn/",
        "category": "程序设计/软件",
    },
    {
        "name": "全国大学生数学建模竞赛",
        "url": "http://www.mcm.edu.cn/",
        "category": "数学建模",
    },
    {
        "name": "中国国际大学生创新大赛",
        "url": "https://cy.ncss.cn/",
        "category": "创新创业",
    },
    {
        "name": "全国大学生电子设计竞赛",
        "url": "https://www.nuedc-training.com.cn/",
        "category": "电子设计",
    },
    {
        "name": "CCF",
        "url": "https://www.ccf.org.cn/",
        "category": "计算机",
    },
]


@dataclass
class CompetitionItem:
    title: str
    source_site: str
    source_url: str
    publish_date: str | None = None
    event_year: int | None = None
    enroll_start: str | None = None
    enroll_end: str | None = None
    organizer: str | None = None
    category: str | None = None
    summary: str | None = None
    status: str = "new"
    keyword_hit: str | None = None
    raw_date_text: str | None = None
    crawled_at: str = ""


class LinkExtractor(HTMLParser):
    def __init__(self, base_url: str):
        super().__init__(convert_charrefs=True)
        self.base_url = base_url
        self.links: list[dict[str, str]] = []
        self._href: str | None = None
        self._text_parts: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag.lower() != "a":
            return
        attr = dict(attrs)
        href = attr.get("href")
        if href:
            self._href = urljoin(self.base_url, href)
            self._text_parts = []

    def handle_data(self, data: str) -> None:
        if self._href:
            self._text_parts.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() != "a" or not self._href:
            return
        text = normalize_space("".join(self._text_parts))
        if text:
            self.links.append({"title": text, "url": self._href})
        self._href = None
        self._text_parts = []


def normalize_space(value: str) -> str:
    return re.sub(r"\s+", " ", value or "").strip()


def fetch_text(url: str, timeout: int = 15) -> str:
    request = Request(
        url,
        headers={
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/125.0 Safari/537.36"
            ),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
        },
    )
    with urlopen(request, timeout=timeout) as response:
        raw = response.read()
        charset = response.headers.get_content_charset() or guess_charset(raw)
        return raw.decode(charset, errors="ignore")


def guess_charset(raw: bytes) -> str:
    sample = raw[:2048].decode("ascii", errors="ignore").lower()
    match = re.search(r"charset=['\"]?([a-z0-9_-]+)", sample)
    if match:
        return match.group(1)
    return "utf-8"


def extract_text(html_text: str) -> str:
    cleaned = re.sub(r"(?is)<script.*?</script>|<style.*?</style>", " ", html_text)
    cleaned = re.sub(r"(?s)<[^>]+>", " ", cleaned)
    return normalize_space(html.unescape(cleaned))


def find_keyword(title: str) -> str | None:
    title_lower = title.lower()
    for keyword in KEYWORDS:
        if keyword.lower() in title_lower:
            return keyword
    return None


def parse_date(value: str) -> str | None:
    patterns = [
        r"(20\d{2})[-年/.](\d{1,2})[-月/.](\d{1,2})",
        r"(\d{1,2})[-月/.](\d{1,2})",
    ]
    for pattern in patterns:
        match = re.search(pattern, value)
        if not match:
            continue
        if len(match.groups()) == 3:
            year, month, day = match.groups()
        else:
            year = str(date.today().year)
            month, day = match.groups()
        try:
            return date(int(year), int(month), int(day)).isoformat()
        except ValueError:
            continue
    return None


def parse_year(value: str) -> int | None:
    years = [int(item) for item in re.findall(r"20\d{2}", value or "")]
    if not years:
        return None
    current = date.today().year
    reasonable = [year for year in years if current - 3 <= year <= current + 2]
    return max(reasonable) if reasonable else max(years)


def extract_date_text(value: str) -> str | None:
    match = re.search(r"(20\d{2}[-年/.]\d{1,2}[-月/.]\d{1,2}|20\d{2}年|\d{1,2}[-月/.]\d{1,2})", value)
    return match.group(1) if match else None


def is_same_domain(url: str, source_url: str) -> bool:
    source_host = urlparse(source_url).netloc.lower()
    target_host = urlparse(url).netloc.lower()
    return target_host.endswith(source_host) or source_host.endswith(target_host)


def crawl_source(source: dict[str, str], limit: int, timeout: int) -> list[CompetitionItem]:
    print(f"[crawl] {source['name']} {source['url']}")
    html_text = fetch_text(source["url"], timeout=timeout)
    parser = LinkExtractor(source["url"])
    parser.feed(html_text)

    items: list[CompetitionItem] = []
    seen: set[str] = set()
    for link in parser.links:
        title = normalize_space(link["title"])
        url = link["url"].split("#", 1)[0]
        if not title or url in seen or len(title) < 4:
            continue
        if title in SKIP_TITLES or any(part in url.lower() for part in SKIP_URL_PARTS):
            continue
        if not is_same_domain(url, source["url"]):
            continue
        keyword = find_keyword(title)
        if not keyword:
            continue
        event_year = parse_year(title)
        current_year = date.today().year
        if event_year and event_year < current_year - 1:
            continue
        seen.add(url)
        item = CompetitionItem(
            title=title[:500],
            source_site=source["name"],
            source_url=url,
            publish_date=parse_date(title),
            event_year=event_year,
            organizer=source["name"],
            category=source.get("category"),
            summary=title[:300],
            status="new",
            keyword_hit=keyword,
            raw_date_text=extract_date_text(title),
            crawled_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        )
        items.append(item)
        if len(items) >= limit:
            break
    return items


def dedupe(items: Iterable[CompetitionItem]) -> list[CompetitionItem]:
    seen: set[str] = set()
    result: list[CompetitionItem] = []
    for item in items:
        key = item.source_url or f"{item.source_site}:{item.title}"
        if key in seen:
            continue
        seen.add(key)
        result.append(item)
    result.sort(key=lambda x: (x.event_year or 0, x.publish_date or "", x.crawled_at), reverse=True)
    return result


def write_csv(items: list[CompetitionItem], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=list(asdict(items[0]).keys()) if items else list(CompetitionItem("", "", "").__dict__.keys()))
        writer.writeheader()
        for item in items:
            writer.writerow(asdict(item))


def write_json(items: list[CompetitionItem], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps([asdict(item) for item in items], ensure_ascii=False, indent=2), encoding="utf-8")


def write_html(items: list[CompetitionItem], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    source_counts: dict[str, int] = {}
    for item in items:
        source_counts[item.source_site] = source_counts.get(item.source_site, 0) + 1
    max_count = max(source_counts.values(), default=1)
    rows = "\n".join(
        f"<tr><td>{idx}</td><td>{html.escape(item.title)}</td>"
        f"<td>{html.escape(item.source_site)}</td><td>{html.escape(item.category or '')}</td>"
        f"<td>{item.event_year or ''}</td><td>{html.escape(item.publish_date or '')}</td><td>{html.escape(item.keyword_hit or '')}</td>"
        f"<td><a href=\"{html.escape(item.source_url)}\" target=\"_blank\">查看</a></td></tr>"
        for idx, item in enumerate(items, 1)
    )
    bars = "\n".join(
        f"<div class=\"bar-row\"><span>{html.escape(site)}</span>"
        f"<div class=\"bar\"><i style=\"width:{count / max_count * 100:.1f}%\"></i></div>"
        f"<b>{count}</b></div>"
        for site, count in sorted(source_counts.items(), key=lambda x: x[1], reverse=True)
    )
    content = f"""<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>最新竞赛爬取数据可视化</title>
  <style>
    body {{ font-family: "Microsoft YaHei", Arial, sans-serif; margin: 28px; color: #111; background: #f7f8fa; }}
    h1 {{ margin: 0 0 8px; font-size: 26px; }}
    .meta {{ color: #555; margin-bottom: 18px; }}
    .cards {{ display: grid; grid-template-columns: repeat(3, minmax(160px, 1fr)); gap: 12px; margin: 18px 0; }}
    .card {{ background: #fff; border: 1px solid #d9dee7; border-radius: 6px; padding: 14px; }}
    .card b {{ display: block; font-size: 28px; margin-top: 6px; }}
    .panel {{ background: #fff; border: 1px solid #d9dee7; border-radius: 6px; padding: 16px; margin: 16px 0; }}
    .bar-row {{ display: grid; grid-template-columns: 180px 1fr 48px; gap: 10px; align-items: center; margin: 8px 0; }}
    .bar {{ height: 14px; background: #edf1f5; border-radius: 999px; overflow: hidden; }}
    .bar i {{ display: block; height: 100%; background: #3c78d8; }}
    table {{ width: 100%; border-collapse: collapse; background: #fff; }}
    th, td {{ border: 1px solid #d9dee7; padding: 9px 10px; text-align: left; vertical-align: top; }}
    th {{ background: #eaf2ff; font-weight: 700; }}
    tr:nth-child(even) {{ background: #fbfcfe; }}
    a {{ color: #165dbb; text-decoration: none; }}
  </style>
</head>
<body>
  <h1>最新竞赛爬取数据可视化</h1>
  <div class="meta">生成时间：{datetime.now().strftime("%Y-%m-%d %H:%M:%S")}；数据来源：独立爬虫脚本输出。</div>
  <div class="cards">
    <div class="card">爬取记录数<b>{len(items)}</b></div>
    <div class="card">来源站点数<b>{len(source_counts)}</b></div>
    <div class="card">含日期记录<b>{sum(1 for item in items if item.publish_date)}</b></div>
  </div>
  <div class="panel">
    <h2>来源分布</h2>
    {bars or "<p>暂无数据</p>"}
  </div>
  <div class="panel">
    <h2>竞赛数据表</h2>
    <table>
      <thead><tr><th>#</th><th>标题</th><th>来源</th><th>分类</th><th>年份</th><th>日期</th><th>命中词</th><th>链接</th></tr></thead>
      <tbody>{rows or "<tr><td colspan='8'>暂无数据</td></tr>"}</tbody>
    </table>
  </div>
</body>
</html>
"""
    path.write_text(content, encoding="utf-8")


def save_mysql(items: list[CompetitionItem], args: argparse.Namespace) -> int:
    try:
        import pymysql  # type: ignore
    except ImportError:
        print("[mysql] pymysql is not installed, skip database write.")
        return 0
    if not items:
        return 0
    conn = pymysql.connect(
        host=args.mysql_host,
        port=args.mysql_port,
        user=args.mysql_user,
        password=args.mysql_password,
        database=args.mysql_database,
        charset="utf8mb4",
        autocommit=True,
    )
    sql = """
    INSERT INTO latest_crawled_competition
      (title, source_site, source_url, publish_date, event_year, enroll_start, enroll_end,
       organizer, category, summary, status, keyword_hit, raw_date_text, crawled_at)
    VALUES
      (%(title)s, %(source_site)s, %(source_url)s, %(publish_date)s, %(event_year)s, %(enroll_start)s,
       %(enroll_end)s, %(organizer)s, %(category)s, %(summary)s, %(status)s,
       %(keyword_hit)s, %(raw_date_text)s, %(crawled_at)s)
    ON DUPLICATE KEY UPDATE
      title = VALUES(title),
      publish_date = VALUES(publish_date),
      event_year = VALUES(event_year),
      enroll_start = VALUES(enroll_start),
      enroll_end = VALUES(enroll_end),
      organizer = VALUES(organizer),
      category = VALUES(category),
      summary = VALUES(summary),
      status = VALUES(status),
      keyword_hit = VALUES(keyword_hit),
      raw_date_text = VALUES(raw_date_text),
      updated_at = CURRENT_TIMESTAMP
    """
    with conn:
        with conn.cursor() as cursor:
            return cursor.executemany(sql, [asdict(item) for item in items])


def load_sources(path: str | None) -> list[dict[str, str]]:
    if not path:
        return DEFAULT_SOURCES
    data = json.loads(Path(path).read_text(encoding="utf-8"))
    if not isinstance(data, list):
        raise ValueError("sources file must be a JSON list")
    return data


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Crawl latest competition data and generate table visualization.")
    parser.add_argument("--sources", help="Optional JSON source list.")
    parser.add_argument("--limit-per-source", type=int, default=12)
    parser.add_argument("--timeout", type=int, default=15)
    parser.add_argument("--sleep", type=float, default=1.0)
    parser.add_argument("--no-mysql", action="store_true", help="Skip MySQL writing.")
    parser.add_argument("--mysql-host", default=os.getenv("MYSQL_HOST", "127.0.0.1"))
    parser.add_argument("--mysql-port", type=int, default=int(os.getenv("MYSQL_PORT", "3306")))
    parser.add_argument("--mysql-user", default=os.getenv("MYSQL_USER", "root"))
    parser.add_argument("--mysql-password", default=os.getenv("MYSQL_PASSWORD", "123456"))
    parser.add_argument("--mysql-database", default=os.getenv("MYSQL_DATABASE", "competition_system"))
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    all_items: list[CompetitionItem] = []
    for source in load_sources(args.sources):
        try:
            all_items.extend(crawl_source(source, args.limit_per_source, args.timeout))
        except Exception as exc:
            print(f"[warn] failed to crawl {source.get('name')}: {exc}", file=sys.stderr)
        time.sleep(max(args.sleep, 0))
    items = dedupe(all_items)
    OUTPUT_DIR.mkdir(exist_ok=True)
    write_csv(items, OUTPUT_DIR / "latest_competitions.csv")
    write_json(items, OUTPUT_DIR / "latest_competitions.json")
    write_html(items, OUTPUT_DIR / "latest_competitions.html")
    print(f"[output] {OUTPUT_DIR / 'latest_competitions.html'}")
    print(f"[output] {OUTPUT_DIR / 'latest_competitions.csv'}")
    print(f"[output] {OUTPUT_DIR / 'latest_competitions.json'}")
    if not args.no_mysql:
        try:
            affected = save_mysql(items, args)
            print(f"[mysql] upsert affected rows: {affected}")
        except Exception as exc:
            print(f"[warn] MySQL write skipped or failed: {exc}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
