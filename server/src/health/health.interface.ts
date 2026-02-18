export interface HealthCheck {
    status: 'ok' | 'warning' | 'error';
    responseTime?: number;
    message?: string;
    used?: number;
}

export interface HealthCheckResponse {
    status: 'ok' | 'degraded' | 'error';
    timestamp: string;
    uptime: number;
    version: string;
    instance?: string;
    checks: {
        database?: HealthCheck;
        memory?: HealthCheck;
        redis?: HealthCheck;
    };
}
