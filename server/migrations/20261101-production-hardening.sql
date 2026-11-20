-- Production hardening migration (2026-11-01)
-- Review and run against a staging copy before production.
-- MySQL 8.0 / TiDB compatible.

START TRANSACTION;

-- Consent evidence for Terms of Service and Privacy Policy acceptance.
ALTER TABLE `users`
  ADD COLUMN IF NOT EXISTS `termsAcceptedAt` DATETIME NULL,
  ADD COLUMN IF NOT EXISTS `privacyAcceptedAt` DATETIME NULL;

-- Daily AI usage counters used for per-user and global spend caps.
CREATE TABLE IF NOT EXISTS `ai_usage_daily` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `userId` INT NOT NULL,
  `usageDate` DATE NOT NULL,
  `requestCount` INT NOT NULL DEFAULT 0,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ai_usage_daily_user_day_unique` (`userId`, `usageDate`),
  KEY `ai_usage_daily_usage_date` (`usageDate`),
  CONSTRAINT `ai_usage_daily_user_fk`
    FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Hot-path index for per-sender message exports and audits.
CREATE INDEX IF NOT EXISTS `idx_messages_sender_created` ON `messages` (`senderUserId`, `createdAt`);

COMMIT;
