-- Add grade_level column to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "grade_level" TEXT;

-- Add comment explaining the column
COMMENT ON COLUMN "users"."grade_level" IS 'Grade level for students (1-12)';
