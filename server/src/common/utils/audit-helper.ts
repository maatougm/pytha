import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export enum AuditActions {
    CREATE_CHANNEL = 'create_channel',
    SEND_MESSAGE = 'send_message',
    EDIT_MESSAGE = 'edit_message',
    DELETE_MESSAGE = 'delete_message',
    ARCHIVE_CHANNEL = 'archive_channel',
    UNARCHIVE_CHANNEL = 'unarchive_channel',
    MUTE_USER = 'mute_user',
    UNMUTE_USER = 'unmute_user',
    BAN_USER = 'ban_user',
    UNBAN_USER = 'unban_user',
    ADD_REACTION = 'add_reaction',
    REMOVE_REACTION = 'remove_reaction',
    USER_DELETE = 'user_delete',
    USER_REACTIVATE = 'user_reactivate',
    COURSE_ACTIVATE = 'course_activate',
    COURSE_DEACTIVATE = 'course_deactivate',
    REPORT_UPDATE = 'report_update',
    PROMOTE_STUDENTS = 'promote_students',
}

interface AuditLogData {
    action: AuditActions;
    actorId: string;
    channelId?: string;
    messageId?: string;
    targetId?: string;
    metadata?: any;
}

const logger = new Logger('AuditHelper');

export async function createAuditLog(prisma: PrismaService, data: AuditLogData) {
    try {
        await prisma.auditLog.create({
            data: {
                action: data.action,
                actorId: data.actorId,
                channelId: data.channelId,
                messageId: data.messageId,
                targetId: data.targetId,
                metadata: data.metadata || undefined,
            },
        });
    } catch (error) {
        // Fire-and-forget: log error but don't crash request
        logger.error(`Failed to create audit log: ${error.message}`, {
            action: data.action,
            actorId: data.actorId,
            error: error.message,
        });
    }
}
