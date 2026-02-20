-- Create GIN index on messages.search_vector for efficient full-text search
-- First, drop the existing index if it's not a GIN index
DROP INDEX IF EXISTS "messages_search_vector_idx";

-- Create GIN index for full-text search
CREATE INDEX "messages_search_vector_idx" ON "messages" USING GIN ("search_vector");

-- Add comment explaining the index purpose
COMMENT ON INDEX "messages_search_vector_idx" IS 'GIN index for PostgreSQL full-text search on message content';
