/*
  Warnings:

  - Made the column `icon` on table `notification` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `notification` MODIFY `icon` VARCHAR(191) NOT NULL;
