/*
  Warnings:

  - A unique constraint covering the columns `[class_id,date,period]` on the table `attendance_sessions` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "attendance_sessions_class_id_date_key";

-- AlterTable
ALTER TABLE "attendance_sessions" ADD COLUMN     "period" INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE UNIQUE INDEX "attendance_sessions_class_id_date_period_key" ON "attendance_sessions"("class_id", "date", "period");
