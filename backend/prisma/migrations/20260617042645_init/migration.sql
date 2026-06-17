/*
  Warnings:

  - You are about to drop the `usergroup` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX `GroupPermission_moduleId_fkey` ON `grouppermission`;

-- DropIndex
DROP INDEX `Module_parentId_fkey` ON `module`;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `groupId` INTEGER NULL;

-- DropTable
DROP TABLE `usergroup`;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `Group`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Module` ADD CONSTRAINT `Module_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `Module`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GroupPermission` ADD CONSTRAINT `GroupPermission_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `Group`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GroupPermission` ADD CONSTRAINT `GroupPermission_moduleId_fkey` FOREIGN KEY (`moduleId`) REFERENCES `Module`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
