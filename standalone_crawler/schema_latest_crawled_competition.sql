-- Independent crawler table. This table is not used by the competition system backend.
-- It stores newly crawled competition information for standalone analysis and visualization.

CREATE TABLE IF NOT EXISTS latest_crawled_competition (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT 'primary key',
    title VARCHAR(500) NOT NULL COMMENT 'competition title',
    source_site VARCHAR(100) NOT NULL COMMENT 'source site name',
    source_url VARCHAR(1000) NOT NULL COMMENT 'source page URL',
    publish_date DATE DEFAULT NULL COMMENT 'detected publish date',
    event_year INT DEFAULT NULL COMMENT 'detected competition year',
    enroll_start DATE DEFAULT NULL COMMENT 'detected enrollment start date',
    enroll_end DATE DEFAULT NULL COMMENT 'detected enrollment end date',
    organizer VARCHAR(200) DEFAULT NULL COMMENT 'detected organizer',
    category VARCHAR(100) DEFAULT NULL COMMENT 'competition category',
    summary TEXT DEFAULT NULL COMMENT 'brief text extracted from source page',
    status VARCHAR(50) DEFAULT 'new' COMMENT 'crawl status label',
    keyword_hit VARCHAR(100) DEFAULT NULL COMMENT 'matched keyword',
    raw_date_text VARCHAR(200) DEFAULT NULL COMMENT 'raw date text extracted from page',
    crawled_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'first crawl time',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'last update time',
    PRIMARY KEY (id),
    UNIQUE KEY uk_latest_crawled_source_url (source_url(255)),
    KEY idx_latest_crawled_source_site (source_site),
    KEY idx_latest_crawled_publish_date (publish_date),
    KEY idx_latest_crawled_event_year (event_year),
    KEY idx_latest_crawled_enroll_end (enroll_end),
    KEY idx_latest_crawled_crawled_at (crawled_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='standalone latest crawled competition data';
