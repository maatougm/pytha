import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ChannelMembershipGuard implements CanActivate {
    private readonly logger = new Logger(ChannelMembershipGuard.name);

    constructor(private readonly prisma: PrismaService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const wsContext = context.switchToWs();
        const client = wsContext.getClient();
        const data = wsContext.getData();
        const userId = client.user?.sub;

        if (!userId) {
            this.logger.warn('Channel membership check failed: no user ID');
            return false;
        }

        // Extract channelId from data (works for different event payloads)
        const channelId = data.channelId || data.message?.channelId;

        if (!channelId) {
            // No channelId required, allow
            return true;
        }

        try {
            const membership = await this.prisma.channelMember.findUnique({
                where: {
                    channelId_userId: {
                        channelId,
                        userId,
                    },
                },
            });

            if (!membership || membership.isBanned) {
                this.logger.warn(`User ${userId} is not a member of channel ${channelId}`);
                
                // Send error to client
                if (client.emit) {
                    client.emit('error:channel-membership', {
                        channelId,
                        message: 'You are not a member of this channel',
                    });
                }
                
                return false;
            }

            return true;
        } catch (error) {
            this.logger.error('Error checking channel membership:', error.message);
            return false;
        }
    }
}
