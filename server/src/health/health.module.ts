import { Module, Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
    constructor(private prisma: PrismaService) { }

    @Get()
    @ApiOperation({ summary: 'Check system health' })
    async check() {
        const dbHealthy = await this.prisma.healthCheck();
        return {
            status: dbHealthy ? 'ok' : 'error',
            timestamp: new Date().toISOString(),
            services: {
                database: dbHealthy ? 'up' : 'down',
            },
        };
    }
}

@Module({
    controllers: [HealthController],
})
export class HealthModule { }
