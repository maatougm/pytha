-- AlterTable
ALTER TABLE "channels" ADD COLUMN     "approval_status" TEXT NOT NULL DEFAULT 'approved',
ADD COLUMN     "approved_at" TIMESTAMP(3),
ADD COLUMN     "approved_by" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "max_members" INTEGER,
ADD COLUMN     "rejection_reason" TEXT,
ADD COLUMN     "requested_by" TEXT;

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "content_type" TEXT NOT NULL DEFAULT 'text';

-- CreateTable
CREATE TABLE "channel_mutes" (
    "id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "muted_by" TEXT NOT NULL,
    "muted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "reason" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "channel_mutes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_attachments" (
    "id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "file_path" TEXT NOT NULL,
    "url" TEXT,
    "duration" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "channel_mutes_channel_id_idx" ON "channel_mutes"("channel_id");

-- CreateIndex
CREATE INDEX "channel_mutes_user_id_idx" ON "channel_mutes"("user_id");

-- CreateIndex
CREATE INDEX "channel_mutes_is_active_idx" ON "channel_mutes"("is_active");

-- CreateIndex
CREATE INDEX "message_attachments_message_id_idx" ON "message_attachments"("message_id");

-- CreateIndex
CREATE INDEX "message_attachments_file_type_idx" ON "message_attachments"("file_type");

-- CreateIndex
CREATE INDEX "channels_approval_status_idx" ON "channels"("approval_status");

-- CreateIndex
CREATE INDEX "messages_content_type_idx" ON "messages"("content_type");

-- AddForeignKey
ALTER TABLE "channel_mutes" ADD CONSTRAINT "channel_mutes_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_mutes" ADD CONSTRAINT "channel_mutes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_mutes" ADD CONSTRAINT "channel_mutes_muted_by_fkey" FOREIGN KEY ("muted_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_attachments" ADD CONSTRAINT "message_attachments_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
