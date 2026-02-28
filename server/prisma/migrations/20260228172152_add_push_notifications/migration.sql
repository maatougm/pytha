-- AlterTable
ALTER TABLE "users" ADD COLUMN     "push_notifications_enabled" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "fee_invoices" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "items" JSONB NOT NULL DEFAULT '[]',
    "total_amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "due_date" DATE NOT NULL,
    "paid_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fee_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "invoice_id" TEXT,
    "student_id" TEXT NOT NULL,
    "payer_id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "payment_method" TEXT,
    "stripe_payment_intent_id" TEXT,
    "stripe_charge_id" TEXT,
    "receipt_url" TEXT,
    "paid_at" TIMESTAMP(3),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "push_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "device_type" TEXT NOT NULL,
    "device_name" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "push_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conferences" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "parent_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "proposed_dates" JSONB NOT NULL,
    "confirmed_date" TIMESTAMP(3),
    "duration_minutes" INTEGER NOT NULL DEFAULT 30,
    "status" TEXT NOT NULL DEFAULT 'requested',
    "notes" TEXT,
    "meeting_link" TEXT,
    "cancelled_by" TEXT,
    "cancelled_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_cards" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "academic_year_id" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "course_grades" JSONB NOT NULL,
    "gpa" DECIMAL(3,2),
    "behavior_summary" JSONB,
    "teacher_comments" TEXT,
    "attendance_summary" JSONB,
    "parent_acknowledged_at" TIMESTAMP(3),
    "acknowledged_by" TEXT,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "behavior_records" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "incident_date" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "behavior_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_events" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "is_all_day" BOOLEAN NOT NULL DEFAULT false,
    "type" TEXT NOT NULL,
    "related_id" TEXT,
    "related_type" TEXT,
    "user_id" TEXT,
    "class_id" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "location" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_public_keys" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "public_key" TEXT NOT NULL,
    "key_version" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_public_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_queue" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_queue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fee_invoices_student_id_idx" ON "fee_invoices"("student_id");

-- CreateIndex
CREATE INDEX "fee_invoices_status_idx" ON "fee_invoices"("status");

-- CreateIndex
CREATE INDEX "fee_invoices_due_date_idx" ON "fee_invoices"("due_date");

-- CreateIndex
CREATE INDEX "payments_student_id_idx" ON "payments"("student_id");

-- CreateIndex
CREATE INDEX "payments_payer_id_idx" ON "payments"("payer_id");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "payments_stripe_payment_intent_id_idx" ON "payments"("stripe_payment_intent_id");

-- CreateIndex
CREATE UNIQUE INDEX "push_tokens_token_key" ON "push_tokens"("token");

-- CreateIndex
CREATE INDEX "push_tokens_user_id_idx" ON "push_tokens"("user_id");

-- CreateIndex
CREATE INDEX "push_tokens_is_active_idx" ON "push_tokens"("is_active");

-- CreateIndex
CREATE INDEX "conferences_student_id_idx" ON "conferences"("student_id");

-- CreateIndex
CREATE INDEX "conferences_parent_id_idx" ON "conferences"("parent_id");

-- CreateIndex
CREATE INDEX "conferences_teacher_id_idx" ON "conferences"("teacher_id");

-- CreateIndex
CREATE INDEX "conferences_status_idx" ON "conferences"("status");

-- CreateIndex
CREATE INDEX "conferences_confirmed_date_idx" ON "conferences"("confirmed_date");

-- CreateIndex
CREATE INDEX "report_cards_student_id_idx" ON "report_cards"("student_id");

-- CreateIndex
CREATE INDEX "report_cards_academic_year_id_idx" ON "report_cards"("academic_year_id");

-- CreateIndex
CREATE INDEX "report_cards_term_idx" ON "report_cards"("term");

-- CreateIndex
CREATE UNIQUE INDEX "report_cards_student_id_academic_year_id_term_key" ON "report_cards"("student_id", "academic_year_id", "term");

-- CreateIndex
CREATE INDEX "behavior_records_student_id_idx" ON "behavior_records"("student_id");

-- CreateIndex
CREATE INDEX "behavior_records_teacher_id_idx" ON "behavior_records"("teacher_id");

-- CreateIndex
CREATE INDEX "behavior_records_type_idx" ON "behavior_records"("type");

-- CreateIndex
CREATE INDEX "behavior_records_category_idx" ON "behavior_records"("category");

-- CreateIndex
CREATE INDEX "behavior_records_incident_date_idx" ON "behavior_records"("incident_date");

-- CreateIndex
CREATE INDEX "calendar_events_user_id_idx" ON "calendar_events"("user_id");

-- CreateIndex
CREATE INDEX "calendar_events_class_id_idx" ON "calendar_events"("class_id");

-- CreateIndex
CREATE INDEX "calendar_events_start_date_end_date_idx" ON "calendar_events"("start_date", "end_date");

-- CreateIndex
CREATE INDEX "calendar_events_type_idx" ON "calendar_events"("type");

-- CreateIndex
CREATE INDEX "calendar_events_related_id_related_type_idx" ON "calendar_events"("related_id", "related_type");

-- CreateIndex
CREATE INDEX "user_public_keys_user_id_idx" ON "user_public_keys"("user_id");

-- CreateIndex
CREATE INDEX "user_public_keys_is_active_idx" ON "user_public_keys"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "user_public_keys_user_id_key_version_key" ON "user_public_keys"("user_id", "key_version");

-- CreateIndex
CREATE INDEX "sync_queue_user_id_idx" ON "sync_queue"("user_id");

-- CreateIndex
CREATE INDEX "sync_queue_device_id_idx" ON "sync_queue"("device_id");

-- CreateIndex
CREATE INDEX "sync_queue_status_idx" ON "sync_queue"("status");

-- CreateIndex
CREATE INDEX "sync_queue_entity_type_entity_id_idx" ON "sync_queue"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_idx" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_expires_at_idx" ON "refresh_tokens"("expires_at");

-- AddForeignKey
ALTER TABLE "fee_invoices" ADD CONSTRAINT "fee_invoices_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "fee_invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_payer_id_fkey" FOREIGN KEY ("payer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "push_tokens" ADD CONSTRAINT "push_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conferences" ADD CONSTRAINT "conferences_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conferences" ADD CONSTRAINT "conferences_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conferences" ADD CONSTRAINT "conferences_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conferences" ADD CONSTRAINT "conferences_cancelled_by_fkey" FOREIGN KEY ("cancelled_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_cards" ADD CONSTRAINT "report_cards_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_cards" ADD CONSTRAINT "report_cards_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_cards" ADD CONSTRAINT "report_cards_acknowledged_by_fkey" FOREIGN KEY ("acknowledged_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "behavior_records" ADD CONSTRAINT "behavior_records_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "behavior_records" ADD CONSTRAINT "behavior_records_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_public_keys" ADD CONSTRAINT "user_public_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_queue" ADD CONSTRAINT "sync_queue_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
