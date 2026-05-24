ALTER TABLE `TrainingSchedule` ADD COLUMN `dayOfWeek` INTEGER NULL;
ALTER TABLE `TrainingSchedule` MODIFY `date` DATETIME(3) NULL;

CREATE INDEX `TrainingSchedule_dayOfWeek_idx` ON `TrainingSchedule`(`dayOfWeek`);
CREATE UNIQUE INDEX `TrainingSchedule_studentId_dayOfWeek_startTime_key` ON `TrainingSchedule`(`studentId`, `dayOfWeek`, `startTime`);
