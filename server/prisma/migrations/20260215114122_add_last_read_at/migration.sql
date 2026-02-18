-- AlterTable
ALTER TABLE "channel_members" ADD COLUMN     "last_read_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "channel_members_last_read_at_idx" ON "channel_members"("last_read_at");
