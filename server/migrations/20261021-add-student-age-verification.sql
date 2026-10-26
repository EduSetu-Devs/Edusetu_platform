ALTER TABLE `student_profiles`
  ADD COLUMN `ageVerificationStatus` ENUM('unverified', 'pending', 'verified', 'rejected') NOT NULL DEFAULT 'unverified',
  ADD COLUMN `ageVerifiedAt` DATETIME NULL,
  ADD COLUMN `ageVerifiedByUserId` INT NULL,
  ADD CONSTRAINT `fk_student_profiles_age_verified_by_user`
    FOREIGN KEY (`ageVerifiedByUserId`) REFERENCES `users` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE;
