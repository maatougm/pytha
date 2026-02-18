import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SoftDeleteService } from './soft-delete.service';

@Injectable()
export class SoftDeleteCleanupService {
    private readonly logger = new Logger(SoftDeleteCleanupService.name);
    private isRunning = false;

    constructor(private softDeleteService: SoftDeleteService) {}

    /**
     * Run cleanup job weekly on Sundays at 2 AM
     * Permanently deletes items that have been soft-deleted for more than 30 days
     */
    @Cron(CronExpression.EVERY_WEEK, {
        name: 'soft-delete-cleanup',
        timeZone: 'UTC',
    })
    async handleWeeklyCleanup() {
        // Prevent concurrent runs
        if (this.isRunning) {
            this.logger.warn('Cleanup job is already running, skipping...');
            return;
        }

        this.isRunning = true;
        this.logger.log('Starting weekly soft delete cleanup job...');

        try {
            const startTime = Date.now();
            const results = await this.softDeleteService.cleanupOldDeletedItems();
            const duration = Date.now() - startTime;

            this.logger.log(
                `Weekly cleanup completed in ${duration}ms. ` +
                `Deleted: ${results.total} items ` +
                `(users: ${results.users}, channels: ${results.channels}, ` +
                `messages: ${results.messages}, courses: ${results.courses}, ` +
                `classes: ${results.classes}, files: ${results.files})`
            );
        } catch (error) {
            this.logger.error('Weekly cleanup job failed:', error.message);
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Run cleanup job immediately (for manual triggering)
     */
    async runCleanupNow(): Promise<{
        success: boolean;
        results?: any;
        error?: string;
    }> {
        if (this.isRunning) {
            return { success: false, error: 'Cleanup job is already running' };
        }

        this.isRunning = true;
        this.logger.log('Starting manual soft delete cleanup...');

        try {
            const results = await this.softDeleteService.cleanupOldDeletedItems();
            return { success: true, results };
        } catch (error) {
            this.logger.error('Manual cleanup job failed:', error.message);
            return { success: false, error: error.message };
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Check if cleanup is currently running
     */
    isCleanupRunning(): boolean {
        return this.isRunning;
    }
}
