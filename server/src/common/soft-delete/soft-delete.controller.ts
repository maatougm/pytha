import {
    Controller,
    Delete,
    Post,
    Get,
    Param,
    Query,
    UseGuards,
    Request,
    Body,
    DefaultValuePipe,
    ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SoftDeleteService, SoftDeleteType } from './soft-delete.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

class SoftDeleteDto {
    reason?: string;
}

@ApiTags('Admin - Soft Delete')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class SoftDeleteController {
    constructor(private softDeleteService: SoftDeleteService) {}

    // ─── SOFT DELETE ENDPOINTS ───────────────────────────────────────────

    @Delete('soft-delete/:type/:id')
    @ApiOperation({ summary: 'Soft delete an item (user, channel, message, course, class, file)' })
    async softDelete(
        @Param('type') type: SoftDeleteType,
        @Param('id') id: string,
        @Body() dto: SoftDeleteDto,
        @Request() req,
    ) {
        const options = {
            reason: dto.reason,
            deletedBy: req.user.sub,
        };

        switch (type) {
            case 'user':
                return this.softDeleteService.softDeleteUser(id, options);
            case 'channel':
                return this.softDeleteService.softDeleteChannel(id, options);
            case 'message':
                return this.softDeleteService.softDeleteMessage(id, options);
            case 'course':
                return this.softDeleteService.softDeleteCourse(id, options);
            case 'class':
                return this.softDeleteService.softDeleteClass(id, options);
            case 'file':
                return this.softDeleteService.softDeleteFile(id, options);
            default:
                return { error: `Unknown type: ${type}` };
        }
    }

    // ─── RESTORE ENDPOINTS ───────────────────────────────────────────────

    @Post('restore/:type/:id')
    @ApiOperation({ summary: 'Restore a soft-deleted item' })
    async restore(
        @Param('type') type: SoftDeleteType,
        @Param('id') id: string,
        @Request() req,
    ) {
        const restoredBy = req.user.sub;

        switch (type) {
            case 'user':
                return this.softDeleteService.restoreUser(id, restoredBy);
            case 'channel':
                return this.softDeleteService.restoreChannel(id, restoredBy);
            case 'message':
                return this.softDeleteService.restoreMessage(id, restoredBy);
            case 'course':
                return this.softDeleteService.restoreCourse(id, restoredBy);
            case 'class':
                return this.softDeleteService.restoreClass(id, restoredBy);
            case 'file':
                return this.softDeleteService.restoreFile(id, restoredBy);
            default:
                return { error: `Unknown type: ${type}` };
        }
    }

    // ─── PERMANENT DELETE ENDPOINTS ──────────────────────────────────────

    @Delete('permanent-delete/:type/:id')
    @ApiOperation({ summary: 'Permanently delete an item (only after grace period)' })
    async permanentDelete(
        @Param('type') type: SoftDeleteType,
        @Param('id') id: string,
        @Request() req,
    ) {
        return this.softDeleteService.permanentDelete(type, id, req.user.sub);
    }

    // ─── LIST DELETED ITEMS ──────────────────────────────────────────────

    @Get('deleted-items')
    @ApiOperation({ summary: 'List all soft-deleted items' })
    @ApiQuery({ name: 'type', required: false, enum: ['user', 'channel', 'message', 'course', 'class', 'file'] })
    async getDeletedItems(
        @Query('type') type?: SoftDeleteType,
    ) {
        return this.softDeleteService.getDeletedItems(type);
    }

    // ─── CLEANUP ENDPOINTS ───────────────────────────────────────────────

    @Post('cleanup-deleted-items')
    @ApiOperation({ summary: 'Trigger cleanup of items soft-deleted > 30 days ago' })
    async triggerCleanup(@Request() req) {
        const results = await this.softDeleteService.cleanupOldDeletedItems();
        
        // Create audit log
        await this.softDeleteService['prisma'].auditLog.create({
            data: {
                action: 'cleanup_deleted_items',
                actorId: req.user.sub,
                metadata: {
                    results,
                    triggeredManually: true,
                },
            },
        });

        return {
            message: 'Cleanup completed successfully',
            results,
        };
    }
}
