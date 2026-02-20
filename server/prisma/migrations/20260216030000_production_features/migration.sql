-- Production Features Migration
-- Adds soft deletes, notifications, full-text search, reactions, read receipts, typing indicators, email queue, and edit history

-- ============================================================
-- 1. Add deletedAt column to users, channels, classes, courses tables for soft deletes
-- ============================================================

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);
ALTER TABLE "channels" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);
ALTER TABLE "classes" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);

-- Create indexes for soft delete queries
CREATE INDEX IF NOT EXISTS "users_deleted_at_idx" ON "users"("deleted_at");
CREATE INDEX IF NOT EXISTS "channels_deleted_at_idx" ON "channels"("deleted_at");
CREATE INDEX IF NOT EXISTS "classes_deleted_at_idx" ON "classes"("deleted_at");
CREATE INDEX IF NOT EXISTS "courses_deleted_at_idx" ON "courses"("deleted_at");

-- ============================================================
-- 2. Add emailNotificationsEnabled (boolean, default true) to users table
-- ============================================================

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_notifications_enabled" BOOLEAN NOT NULL DEFAULT true;

-- Create index for email notification queries
CREATE INDEX IF NOT EXISTS "users_email_notifications_enabled_idx" ON "users"("email_notifications_enabled");

-- ============================================================
-- 3. Add notificationPreferences (json) to users table
-- ============================================================

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "notification_preferences" JSONB;

-- ============================================================
-- 4. Add searchVector (tsvector) to messages table for full-text search
-- ============================================================

ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "search_vector" TSVECTOR;

-- Create GIN index for full-text search
CREATE INDEX IF NOT EXISTS "messages_search_vector_idx" ON "messages" USING GIN("search_vector");

-- Create function to update search vector automatically
CREATE OR REPLACE FUNCTION messages_search_vector_update() RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('english', COALESCE(NEW.content, ''));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update search vector on insert/update
DROP TRIGGER IF EXISTS messages_search_vector_trigger ON "messages";
CREATE TRIGGER messages_search_vector_trigger
    BEFORE INSERT OR UPDATE OF content ON "messages"
    FOR EACH ROW
    EXECUTE FUNCTION messages_search_vector_update();

-- Update existing messages with search vector
UPDATE "messages" SET "search_vector" = to_tsvector('english', COALESCE(content, ''));

-- ============================================================
-- 5. Add reactions table for message reactions
-- ============================================================

CREATE TABLE IF NOT EXISTS "reactions" (
    "id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "reaction" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reactions_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraints
ALTER TABLE "reactions" DROP CONSTRAINT IF EXISTS "reactions_message_id_fkey";
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_message_id_fkey" 
    FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "reactions" DROP CONSTRAINT IF EXISTS "reactions_user_id_fkey";
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_user_id_fkey" 
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create indexes for reactions table
CREATE INDEX IF NOT EXISTS "reactions_message_id_idx" ON "reactions"("message_id");
CREATE INDEX IF NOT EXISTS "reactions_user_id_idx" ON "reactions"("user_id");
CREATE INDEX IF NOT EXISTS "reactions_message_user_idx" ON "reactions"("message_id", "user_id");
CREATE INDEX IF NOT EXISTS "reactions_created_at_idx" ON "reactions"("created_at");

-- Create unique constraint to prevent duplicate reactions from same user
CREATE UNIQUE INDEX IF NOT EXISTS "reactions_message_user_reaction_idx" 
    ON "reactions"("message_id", "user_id", "reaction");

-- ============================================================
-- 6. Add message_reads table for read receipts
-- ============================================================

CREATE TABLE IF NOT EXISTS "message_reads" (
    "id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "read_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_reads_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraints
ALTER TABLE "message_reads" DROP CONSTRAINT IF EXISTS "message_reads_message_id_fkey";
ALTER TABLE "message_reads" ADD CONSTRAINT "message_reads_message_id_fkey" 
    FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "message_reads" DROP CONSTRAINT IF EXISTS "message_reads_user_id_fkey";
ALTER TABLE "message_reads" ADD CONSTRAINT "message_reads_user_id_fkey" 
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create indexes for message_reads table
CREATE INDEX IF NOT EXISTS "message_reads_message_id_idx" ON "message_reads"("message_id");
CREATE INDEX IF NOT EXISTS "message_reads_user_id_idx" ON "message_reads"("user_id");
CREATE INDEX IF NOT EXISTS "message_reads_read_at_idx" ON "message_reads"("read_at");

-- Create unique constraint to prevent duplicate read records
CREATE UNIQUE INDEX IF NOT EXISTS "message_reads_message_user_idx" 
    ON "message_reads"("message_id", "user_id");

-- ============================================================
-- 7. Add typing_indicators table
-- ============================================================

CREATE TABLE IF NOT EXISTS "typing_indicators" (
    "id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "typing_indicators_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraints
ALTER TABLE "typing_indicators" DROP CONSTRAINT IF EXISTS "typing_indicators_channel_id_fkey";
ALTER TABLE "typing_indicators" ADD CONSTRAINT "typing_indicators_channel_id_fkey" 
    FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "typing_indicators" DROP CONSTRAINT IF EXISTS "typing_indicators_user_id_fkey";
ALTER TABLE "typing_indicators" ADD CONSTRAINT "typing_indicators_user_id_fkey" 
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create indexes for typing_indicators table
CREATE INDEX IF NOT EXISTS "typing_indicators_channel_id_idx" ON "typing_indicators"("channel_id");
CREATE INDEX IF NOT EXISTS "typing_indicators_user_id_idx" ON "typing_indicators"("user_id");
CREATE INDEX IF NOT EXISTS "typing_indicators_expires_at_idx" ON "typing_indicators"("expires_at");
CREATE INDEX IF NOT EXISTS "typing_indicators_channel_expires_idx" ON "typing_indicators"("channel_id", "expires_at");

-- Create unique constraint for one typing indicator per user per channel
CREATE UNIQUE INDEX IF NOT EXISTS "typing_indicators_channel_user_idx" 
    ON "typing_indicators"("channel_id", "user_id");

-- ============================================================
-- 8. Add email_queue table for email notifications
-- ============================================================

CREATE TABLE IF NOT EXISTS "email_queue" (
    "id" TEXT NOT NULL,
    "to_email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_queue_pkey" PRIMARY KEY ("id")
);

-- Create indexes for email_queue table
CREATE INDEX IF NOT EXISTS "email_queue_status_idx" ON "email_queue"("status");
CREATE INDEX IF NOT EXISTS "email_queue_created_at_idx" ON "email_queue"("created_at");
CREATE INDEX IF NOT EXISTS "email_queue_status_created_idx" ON "email_queue"("status", "created_at");
CREATE INDEX IF NOT EXISTS "email_queue_attempts_idx" ON "email_queue"("attempts");
CREATE INDEX IF NOT EXISTS "email_queue_to_email_idx" ON "email_queue"("to_email");

-- ============================================================
-- 9. Add edit_history table for message edit tracking
-- ============================================================

CREATE TABLE IF NOT EXISTS "edit_history" (
    "id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "previous_content" TEXT NOT NULL,
    "edited_by" TEXT NOT NULL,
    "edited_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "edit_history_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraints
ALTER TABLE "edit_history" DROP CONSTRAINT IF EXISTS "edit_history_message_id_fkey";
ALTER TABLE "edit_history" ADD CONSTRAINT "edit_history_message_id_fkey" 
    FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "edit_history" DROP CONSTRAINT IF EXISTS "edit_history_edited_by_fkey";
ALTER TABLE "edit_history" ADD CONSTRAINT "edit_history_edited_by_fkey" 
    FOREIGN KEY ("edited_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create indexes for edit_history table
CREATE INDEX IF NOT EXISTS "edit_history_message_id_idx" ON "edit_history"("message_id");
CREATE INDEX IF NOT EXISTS "edit_history_edited_by_idx" ON "edit_history"("edited_by");
CREATE INDEX IF NOT EXISTS "edit_history_edited_at_idx" ON "edit_history"("edited_at");
CREATE INDEX IF NOT EXISTS "edit_history_message_edited_idx" ON "edit_history"("message_id", "edited_at");
