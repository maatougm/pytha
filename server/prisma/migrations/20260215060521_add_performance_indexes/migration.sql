-- AlterTable
ALTER TABLE "files" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "is_deleted" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "audit_log_action_idx" ON "audit_log"("action");

-- CreateIndex
CREATE INDEX "audit_log_created_at_idx" ON "audit_log"("created_at");

-- CreateIndex
CREATE INDEX "channels_is_archived_idx" ON "channels"("is_archived");

-- CreateIndex
CREATE INDEX "channels_created_at_idx" ON "channels"("created_at");

-- CreateIndex
CREATE INDEX "files_is_deleted_idx" ON "files"("is_deleted");

-- CreateIndex
CREATE INDEX "files_created_at_idx" ON "files"("created_at");

-- CreateIndex
CREATE INDEX "messages_is_deleted_idx" ON "messages"("is_deleted");

-- CreateIndex
CREATE INDEX "messages_channel_id_is_deleted_created_at_idx" ON "messages"("channel_id", "is_deleted", "created_at" DESC);

-- CreateIndex
CREATE INDEX "messages_created_at_idx" ON "messages"("created_at");
