-- DropIndex
DROP INDEX "edit_history_message_edited_idx";

-- DropIndex
DROP INDEX "messages_search_vector_idx";

-- DropIndex
DROP INDEX "reactions_message_user_idx";

-- DropIndex
DROP INDEX "typing_indicators_channel_expires_idx";

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "deleted_by" TEXT;

-- CreateTable
CREATE TABLE "mentions" (
    "id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "mentioned_user_id" TEXT NOT NULL,
    "mention_text" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read_at" TIMESTAMP(3),

    CONSTRAINT "mentions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_years" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academic_years_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mentions_message_id_idx" ON "mentions"("message_id");

-- CreateIndex
CREATE INDEX "mentions_mentioned_user_id_idx" ON "mentions"("mentioned_user_id");

-- CreateIndex
CREATE INDEX "mentions_is_read_idx" ON "mentions"("is_read");

-- CreateIndex
CREATE INDEX "mentions_mentioned_user_id_is_read_idx" ON "mentions"("mentioned_user_id", "is_read");

-- CreateIndex
CREATE INDEX "mentions_created_at_idx" ON "mentions"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "mentions_message_id_mentioned_user_id_key" ON "mentions"("message_id", "mentioned_user_id");

-- CreateIndex
CREATE INDEX "academic_years_is_current_idx" ON "academic_years"("is_current");

-- CreateIndex
CREATE INDEX "messages_search_vector_idx" ON "messages"("search_vector");

-- AddForeignKey
ALTER TABLE "mentions" ADD CONSTRAINT "mentions_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentions" ADD CONSTRAINT "mentions_mentioned_user_id_fkey" FOREIGN KEY ("mentioned_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "email_queue_status_created_idx" RENAME TO "email_queue_status_created_at_idx";

-- RenameIndex
ALTER INDEX "message_reads_message_user_idx" RENAME TO "message_reads_message_id_user_id_key";

-- RenameIndex
ALTER INDEX "reactions_message_user_reaction_idx" RENAME TO "reactions_message_id_user_id_reaction_key";

-- RenameIndex
ALTER INDEX "typing_indicators_channel_user_idx" RENAME TO "typing_indicators_channel_id_user_id_key";
