-- CreateTable
CREATE TABLE "channel_reports" (
    "id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "reported_by" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "assigned_to" TEXT,
    "resolution" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "channel_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "channel_reports_channel_id_idx" ON "channel_reports"("channel_id");

-- CreateIndex
CREATE INDEX "channel_reports_reported_by_idx" ON "channel_reports"("reported_by");

-- CreateIndex
CREATE INDEX "channel_reports_status_idx" ON "channel_reports"("status");

-- CreateIndex
CREATE INDEX "channel_reports_assigned_to_idx" ON "channel_reports"("assigned_to");

-- AddForeignKey
ALTER TABLE "channel_reports" ADD CONSTRAINT "channel_reports_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_reports" ADD CONSTRAINT "channel_reports_reported_by_fkey" FOREIGN KEY ("reported_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_reports" ADD CONSTRAINT "channel_reports_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
