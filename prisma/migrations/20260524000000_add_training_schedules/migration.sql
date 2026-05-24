CREATE TABLE `TrainingSchedule` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `coachId` VARCHAR(191) NULL,
    `sessionId` VARCHAR(191) NULL,
    `date` DATETIME(3) NOT NULL,
    `startTime` VARCHAR(191) NOT NULL,
    `endTime` VARCHAR(191) NOT NULL,
    `note` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `TrainingSchedule_date_idx`(`date`),
    INDEX `TrainingSchedule_coachId_idx`(`coachId`),
    INDEX `TrainingSchedule_sessionId_idx`(`sessionId`),
    UNIQUE INDEX `TrainingSchedule_studentId_date_startTime_key`(`studentId`, `date`, `startTime`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `TrainingSchedule` ADD CONSTRAINT `TrainingSchedule_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `TrainingSchedule` ADD CONSTRAINT `TrainingSchedule_coachId_fkey` FOREIGN KEY (`coachId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `TrainingSchedule` ADD CONSTRAINT `TrainingSchedule_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `AttendanceSession`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
