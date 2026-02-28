import { Injectable, Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import { PrismaService } from '../../prisma/prisma.service';
import { WsJoinChannelDto } from '../dto/ws-message.dto';

interface AuthenticatedSocket extends Socket {
    user?: {
        sub: string;
        email: string;
        roles: string[];
    };
}

@Injectable()
export class ChannelHandler {
    private readonly logger = new Logger(ChannelHandler.name);

    constructor(
        private readonly prisma: PrismaService,
    ) { }

    /**
     * Handle joining a channel room
     */
    async handleJoinChannel(
        client: AuthenticatedSocket,
        data: WsJoinChannelDto,
    ): Promise<{ success: boolean; error?: string }> {
        if (!client.user) {
            return { success: false, error: 'Not authenticated' };
        }

        // Verify the user is actually a member of this channel
        const membership = await this.prisma.channelMember.findUnique({
            where: {
                channelId_userId: {
                    channelId: data.channelId,
                    userId: client.user.sub,
                },
            },
        });

        if (!membership || membership.isBanned) {
            return { success: false, error: 'Not a member of this channel' };
        }

        client.join(`channel:${data.channelId}`);
        return { success: true };
    }

    /**
     * Handle leaving a channel room
     */
    async handleLeaveChannel(
        client: AuthenticatedSocket,
        data: { channelId: string },
    ): Promise<{ success: boolean; error?: string }> {
        if (!client.user) {
            return { success: false, error: 'Not authenticated' };
        }

        client.leave(`channel:${data.channelId}`);
        return { success: true };
    }
}
