import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    Counter,
    Histogram,
    Gauge,
    collectDefaultMetrics,
    register,
} from 'prom-client';

/**
 * Custom metrics for School Hub application
 */
@Injectable()
export class MetricsService implements OnModuleInit {
    private readonly logger = new Logger(MetricsService.name);

    // HTTP Request Duration
    public readonly httpRequestDuration: Histogram<string>;

    // Message Metrics
    public readonly messagesSentCounter: Counter<string>;
    public readonly messagesReceivedCounter: Counter<string>;
    public readonly messageEditCounter: Counter<string>;
    public readonly messageDeleteCounter: Counter<string>;

    // User Metrics
    public readonly activeUsersGauge: Gauge<string>;
    public readonly userLoginCounter: Counter<string>;
    public readonly userRegistrationCounter: Counter<string>;

    // WebSocket Metrics
    public readonly wsConnectionsGauge: Gauge<string>;
    public readonly wsEventsCounter: Counter<string>;

    // File Upload Metrics
    public readonly fileUploadCounter: Counter<string>;
    public readonly fileUploadSizeHistogram: Histogram<string>;
    public readonly fileUploadErrorsCounter: Counter<string>;

    // Channel Metrics
    public readonly channelMessagesCounter: Counter<string>;
    public readonly channelActiveGauge: Gauge<string>;

    // System Metrics
    public readonly errorCounter: Counter<string>;
    public readonly rateLimitCounter: Counter<string>;

    // Active user tracking
    private activeUsers: Map<string, number> = new Map();
    private wsConnections: Map<string, number> = new Map();

    constructor(private configService: ConfigService) {
        // Initialize metrics
        this.httpRequestDuration = new Histogram({
            name: 'http_request_duration_seconds',
            help: 'HTTP request duration in seconds',
            labelNames: ['method', 'route', 'status_code'],
            buckets: [0.001, 0.005, 0.015, 0.05, 0.1, 0.5, 1, 2, 5],
        });

        this.messagesSentCounter = new Counter({
            name: 'school_messages_sent_total',
            help: 'Total number of messages sent',
            labelNames: ['channel_type', 'sender_role'],
        });

        this.messagesReceivedCounter = new Counter({
            name: 'school_messages_received_total',
            help: 'Total number of messages received',
            labelNames: ['channel_type'],
        });

        this.messageEditCounter = new Counter({
            name: 'school_message_edits_total',
            help: 'Total number of message edits',
        });

        this.messageDeleteCounter = new Counter({
            name: 'school_message_deletes_total',
            help: 'Total number of message deletions',
        });

        this.activeUsersGauge = new Gauge({
            name: 'school_active_users',
            help: 'Number of currently active users',
            labelNames: ['role'],
        });

        this.userLoginCounter = new Counter({
            name: 'school_user_logins_total',
            help: 'Total number of user logins',
            labelNames: ['role'],
        });

        this.userRegistrationCounter = new Counter({
            name: 'school_user_registrations_total',
            help: 'Total number of user registrations',
            labelNames: ['role'],
        });

        this.wsConnectionsGauge = new Gauge({
            name: 'school_websocket_connections',
            help: 'Number of active WebSocket connections',
        });

        this.wsEventsCounter = new Counter({
            name: 'school_websocket_events_total',
            help: 'Total number of WebSocket events',
            labelNames: ['event_type'],
        });

        this.fileUploadCounter = new Counter({
            name: 'school_file_uploads_total',
            help: 'Total number of file uploads',
            labelNames: ['category', 'status'],
        });

        this.fileUploadSizeHistogram = new Histogram({
            name: 'school_file_upload_size_bytes',
            help: 'File upload size in bytes',
            labelNames: ['category'],
            buckets: [1024, 10240, 102400, 1048576, 10485760, 52428800, 104857600],
        });

        this.fileUploadErrorsCounter = new Counter({
            name: 'school_file_upload_errors_total',
            help: 'Total number of file upload errors',
            labelNames: ['category', 'error_type'],
        });

        this.channelMessagesCounter = new Counter({
            name: 'school_channel_messages_total',
            help: 'Total messages per channel',
            labelNames: ['channel_id', 'channel_type'],
        });

        this.channelActiveGauge = new Gauge({
            name: 'school_active_channels',
            help: 'Number of currently active channels',
            labelNames: ['channel_type'],
        });

        this.errorCounter = new Counter({
            name: 'school_errors_total',
            help: 'Total number of errors',
            labelNames: ['type', 'endpoint'],
        });

        this.rateLimitCounter = new Counter({
            name: 'school_rate_limit_hits_total',
            help: 'Total number of rate limit hits',
            labelNames: ['endpoint', 'user_role'],
        });

        // Register all custom metrics
        register.registerMetric(this.httpRequestDuration);
        register.registerMetric(this.messagesSentCounter);
        register.registerMetric(this.messagesReceivedCounter);
        register.registerMetric(this.messageEditCounter);
        register.registerMetric(this.messageDeleteCounter);
        register.registerMetric(this.activeUsersGauge);
        register.registerMetric(this.userLoginCounter);
        register.registerMetric(this.userRegistrationCounter);
        register.registerMetric(this.wsConnectionsGauge);
        register.registerMetric(this.wsEventsCounter);
        register.registerMetric(this.fileUploadCounter);
        register.registerMetric(this.fileUploadSizeHistogram);
        register.registerMetric(this.fileUploadErrorsCounter);
        register.registerMetric(this.channelMessagesCounter);
        register.registerMetric(this.channelActiveGauge);
        register.registerMetric(this.errorCounter);
        register.registerMetric(this.rateLimitCounter);
    }

    onModuleInit() {
        // Enable default Node.js metrics
        collectDefaultMetrics({
            prefix: 'school_',
        });

        this.logger.log('Metrics service initialized');
    }

    /**
     * Record HTTP request duration
     */
    recordHttpRequest(method: string, route: string, statusCode: number, duration: number): void {
        this.httpRequestDuration
            .labels(method, route, statusCode.toString())
            .observe(duration);
    }

    /**
     * Record a message sent
     */
    recordMessageSent(channelType: string, senderRole: string): void {
        this.messagesSentCounter.labels(channelType, senderRole).inc();
    }

    /**
     * Record a message received
     */
    recordMessageReceived(channelType: string): void {
        this.messagesReceivedCounter.labels(channelType).inc();
    }

    /**
     * Record message edit
     */
    recordMessageEdit(): void {
        this.messageEditCounter.inc();
    }

    /**
     * Record message deletion
     */
    recordMessageDelete(): void {
        this.messageDeleteCounter.inc();
    }

    /**
     * Record user login
     */
    recordUserLogin(role: string): void {
        this.userLoginCounter.labels(role).inc();
        this.trackActiveUser(role);
    }

    /**
     * Record user registration
     */
    recordUserRegistration(role: string): void {
        this.userRegistrationCounter.labels(role).inc();
    }

    /**
     * Track active user
     */
    trackActiveUser(role: string): void {
        const count = this.activeUsers.get(role) || 0;
        this.activeUsers.set(role, count + 1);
        this.activeUsersGauge.labels(role).set(count + 1);
    }

    /**
     * Remove active user
     */
    removeActiveUser(role: string): void {
        const count = this.activeUsers.get(role) || 0;
        const newCount = Math.max(0, count - 1);
        this.activeUsers.set(role, newCount);
        this.activeUsersGauge.labels(role).set(newCount);
    }

    /**
     * Set total active users (from WebSocket or session tracking)
     */
    setActiveUsers(count: number, role: string = 'all'): void {
        this.activeUsersGauge.labels(role).set(count);
    }

    /**
     * Record WebSocket connection
     */
    recordWsConnection(userId?: string): void {
        this.wsConnectionsGauge.inc();
        if (userId) {
            const count = this.wsConnections.get(userId) || 0;
            this.wsConnections.set(userId, count + 1);
        }
    }

    /**
     * Record WebSocket disconnection
     */
    recordWsDisconnection(userId?: string): void {
        this.wsConnectionsGauge.dec();
        if (userId) {
            const count = this.wsConnections.get(userId) || 0;
            if (count > 0) {
                this.wsConnections.set(userId, count - 1);
            }
        }
    }

    /**
     * Record WebSocket event
     */
    recordWsEvent(eventType: string): void {
        this.wsEventsCounter.labels(eventType).inc();
    }

    /**
     * Record file upload
     */
    recordFileUpload(category: string, size: number, success: boolean = true): void {
        const status = success ? 'success' : 'failed';
        this.fileUploadCounter.labels(category, status).inc();
        if (success) {
            this.fileUploadSizeHistogram.labels(category).observe(size);
        }
    }

    /**
     * Record file upload error
     */
    recordFileUploadError(category: string, errorType: string): void {
        this.fileUploadErrorsCounter.labels(category, errorType).inc();
        this.fileUploadCounter.labels(category, 'error').inc();
    }

    /**
     * Record channel message
     */
    recordChannelMessage(channelId: string, channelType: string): void {
        this.channelMessagesCounter.labels(channelId, channelType).inc();
    }

    /**
     * Set active channels count
     */
    setActiveChannels(count: number, channelType: string = 'all'): void {
        this.channelActiveGauge.labels(channelType).set(count);
    }

    /**
     * Record error
     */
    recordError(type: string, endpoint: string = 'unknown'): void {
        this.errorCounter.labels(type, endpoint).inc();
    }

    /**
     * Record rate limit hit
     */
    recordRateLimit(endpoint: string, userRole: string): void {
        this.rateLimitCounter.labels(endpoint, userRole).inc();
    }

    /**
     * Get current metrics as Prometheus format string
     */
    async getMetrics(): Promise<string> {
        return register.metrics();
    }

    /**
     * Get all registered metrics content type
     */
    getContentType(): string {
        return register.contentType;
    }

    /**
     * Reset all metrics (useful for testing)
     */
    resetAll(): void {
        register.resetMetrics();
    }
}
