-- =====================================================
-- Competition system DB patch (idempotent)
-- Usage: mysql -u root -p competition_system < migrate-db.sql
-- Works: MySQL 5.7+, MySQL 8.x, MariaDB 10.x+ (no ADD COLUMN IF NOT EXISTS)
-- Comments on ALTER use ASCII to avoid client charset issues.
-- =====================================================

SET NAMES utf8mb4;

DELIMITER $$

DROP PROCEDURE IF EXISTS competition_system_migration$$

CREATE PROCEDURE competition_system_migration()
BEGIN
  -- ---- competition ----
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'competition' AND COLUMN_NAME = 'source_url') THEN
    ALTER TABLE competition ADD COLUMN source_url VARCHAR(500) DEFAULT NULL COMMENT 'crawler source URL';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'competition' AND COLUMN_NAME = 'is_crawled') THEN
    ALTER TABLE competition ADD COLUMN is_crawled TINYINT DEFAULT 0 COMMENT 'is crawled row';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'competition' AND COLUMN_NAME = 'source_site') THEN
    ALTER TABLE competition ADD COLUMN source_site VARCHAR(100) DEFAULT NULL COMMENT 'source site name';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'competition' AND COLUMN_NAME = 'tags') THEN
    ALTER TABLE competition ADD COLUMN tags VARCHAR(500) DEFAULT NULL COMMENT 'tags';
  END IF;

  -- ---- award_record ----
  IF EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'award_record' AND COLUMN_NAME = 'award_level') THEN
    ALTER TABLE award_record MODIFY COLUMN award_level VARCHAR(50) DEFAULT NULL COMMENT 'award level text';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'award_record' AND COLUMN_NAME = 'award_time') THEN
    ALTER TABLE award_record ADD COLUMN award_time DATE DEFAULT NULL COMMENT 'award date' AFTER award_level;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'award_record' AND COLUMN_NAME = 'certificate') THEN
    ALTER TABLE award_record ADD COLUMN certificate VARCHAR(500) DEFAULT NULL COMMENT 'certificate URL' AFTER award_time;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'award_record' AND COLUMN_NAME = 'photo_url') THEN
    ALTER TABLE award_record ADD COLUMN photo_url VARCHAR(500) DEFAULT NULL COMMENT 'photo URL' AFTER certificate;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'award_record' AND COLUMN_NAME = 'source') THEN
    ALTER TABLE award_record ADD COLUMN source VARCHAR(20) DEFAULT 'self' COMMENT 'self or admin' AFTER photo_url;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'award_record' AND COLUMN_NAME = 'status') THEN
    ALTER TABLE award_record ADD COLUMN status TINYINT DEFAULT 0 COMMENT '0 pending 1 public' AFTER source;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'award_record' AND COLUMN_NAME = 'photo_url') THEN
    ALTER TABLE award_record MODIFY COLUMN photo_url LONGTEXT COMMENT 'cert photo URL or base64';
  END IF;

  -- ---- forum_post ----
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'forum_post' AND COLUMN_NAME = 'like_count') THEN
    ALTER TABLE forum_post ADD COLUMN like_count INT DEFAULT 0 COMMENT 'like count' AFTER reply_count;
  END IF;

  -- ---- competition_enrollment ----
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'competition_enrollment' AND COLUMN_NAME = 'student_id') THEN
    ALTER TABLE competition_enrollment ADD COLUMN student_id VARCHAR(30) DEFAULT NULL COMMENT 'student id snapshot' AFTER team_members;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'competition_enrollment' AND COLUMN_NAME = 'real_name') THEN
    ALTER TABLE competition_enrollment ADD COLUMN real_name VARCHAR(50) DEFAULT NULL COMMENT 'real name snapshot' AFTER student_id;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'competition_enrollment' AND COLUMN_NAME = 'college') THEN
    ALTER TABLE competition_enrollment ADD COLUMN college VARCHAR(100) DEFAULT NULL COMMENT 'college snapshot' AFTER real_name;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'competition_enrollment' AND COLUMN_NAME = 'major') THEN
    ALTER TABLE competition_enrollment ADD COLUMN major VARCHAR(100) DEFAULT NULL COMMENT 'major snapshot' AFTER college;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'competition_enrollment' AND COLUMN_NAME = 'phone') THEN
    ALTER TABLE competition_enrollment ADD COLUMN phone VARCHAR(20) DEFAULT NULL COMMENT 'phone' AFTER major;
  END IF;
END$$

DELIMITER ;

CALL competition_system_migration();

DROP PROCEDURE IF EXISTS competition_system_migration;

-- ---- data fixes (safe to re-run) ----
UPDATE award_record SET status = 1 WHERE source = 'admin' AND (status IS NULL OR status = 0);
UPDATE award_record SET status = 1 WHERE id IN (1,2,3,4,5);

UPDATE competition SET status = 1 WHERE status IS NULL;
UPDATE competition SET deleted = 0 WHERE deleted IS NULL;
UPDATE competition SET view_count = 0 WHERE view_count IS NULL;
UPDATE competition SET favorite_count = 0 WHERE favorite_count IS NULL;
UPDATE competition SET enroll_count = 0 WHERE enroll_count IS NULL;
UPDATE competition SET is_crawled = 0 WHERE is_crawled IS NULL;

UPDATE competition SET start_time='2026-07-01 00:00:00', end_time='2026-09-05 23:59:59' WHERE id=1 AND end_time IS NULL;
UPDATE competition SET start_time='2026-01-15 00:00:00', end_time='2026-06-15 23:59:59' WHERE id=2 AND end_time IS NULL;
UPDATE competition SET start_time='2026-04-01 00:00:00', end_time='2026-09-30 23:59:59' WHERE id=3 AND end_time IS NULL;
UPDATE competition SET start_time='2026-04-01 00:00:00', end_time='2026-07-20 23:59:59' WHERE id=4 AND end_time IS NULL;
UPDATE competition SET start_time='2026-04-01 00:00:00', end_time='2026-06-30 23:59:59' WHERE id=5 AND end_time IS NULL;
UPDATE competition SET start_time='2026-04-01 00:00:00', end_time='2026-05-16 23:59:59' WHERE id=6 AND end_time IS NULL;
UPDATE competition SET start_time='2026-06-01 00:00:00', end_time='2026-10-01 23:59:59' WHERE id=7 AND end_time IS NULL;
UPDATE competition SET start_time='2026-09-01 00:00:00', end_time='2026-11-30 23:59:59' WHERE id=8 AND end_time IS NULL;

CREATE TABLE IF NOT EXISTS external_crawled_competition (
    id            BIGINT       NOT NULL AUTO_INCREMENT COMMENT 'pk',
    title         VARCHAR(500) NOT NULL COMMENT 'title',
    source_url    VARCHAR(500) NOT NULL COMMENT 'url',
    enroll_start  DATETIME     DEFAULT NULL COMMENT 'enroll start',
    enroll_end    DATETIME     DEFAULT NULL COMMENT 'enroll end',
    source_site   VARCHAR(100) DEFAULT NULL COMMENT 'source site',
    crawled_at    DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT 'crawled at',
    PRIMARY KEY (id),
    UNIQUE KEY uk_source_url (source_url(191))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='external crawl feed';

SELECT 'Migration completed.' AS result;
