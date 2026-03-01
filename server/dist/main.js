/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const core_1 = __webpack_require__(1);
const common_1 = __webpack_require__(2);
const swagger_1 = __webpack_require__(3);
const app_module_1 = __webpack_require__(4);
const sanitize_pipe_1 = __webpack_require__(151);
const metrics_interceptor_1 = __webpack_require__(152);
const metrics_service_1 = __webpack_require__(30);
const helmet_1 = __importDefault(__webpack_require__(154));
const compression_1 = __importDefault(__webpack_require__(155));
const dotenv = __importStar(__webpack_require__(156));
const cookie_parser_1 = __importDefault(__webpack_require__(157));
const path_1 = __webpack_require__(98);
const fs_1 = __webpack_require__(100);
dotenv.config({ path: '../.env' });
async function bootstrap() {
    const logger = new common_1.Logger('Bootstrap');
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const downloadsDir = (0, path_1.join)(__dirname, '..', 'downloads');
    if (!(0, fs_1.existsSync)(downloadsDir)) {
        (0, fs_1.mkdirSync)(downloadsDir, { recursive: true });
    }
    if (process.env.NODE_ENV === 'production') {
        app.use((req, res, next) => {
            if (!req.secure && req.headers['x-forwarded-proto'] !== 'https') {
                return res.redirect(301, `https://${req.headers.host}${req.url}`);
            }
            next();
        });
    }
    app.useStaticAssets((0, path_1.join)(__dirname, '..', 'downloads'), {
        prefix: '/downloads/',
        setHeaders: (res) => {
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('Content-Security-Policy', "default-src 'none'");
        },
    });
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", "data:", "blob:"],
                connectSrc: ["'self'", process.env.CLIENT_URL || 'http://localhost:5173'],
            },
        },
        hsts: process.env.NODE_ENV === 'production'
            ? { maxAge: 31536000, includeSubDomains: true, preload: true }
            : false,
        crossOriginEmbedderPolicy: false,
    }));
    app.use((0, compression_1.default)());
    app.use((0, cookie_parser_1.default)());
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
        'http://localhost:5173',
        'http://localhost:4173',
    ];
    const isDevelopment = process.env.NODE_ENV !== 'production';
    app.enableCors({
        origin: (origin, callback) => {
            if (!origin) {
                callback(null, true);
                return;
            }
            if (allowedOrigins.includes(origin)) {
                callback(null, true);
                return;
            }
            if (isDevelopment) {
                callback(null, true);
                return;
            }
            logger.warn(`Blocked CORS request from: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    });
    app.useGlobalPipes(new sanitize_pipe_1.SanitizePipe({
        transformOptions: { enableImplicitConversion: true },
    }), new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
    }));
    app.setGlobalPrefix('api');
    if (process.env.NODE_ENV !== 'production') {
        const config = new swagger_1.DocumentBuilder()
            .setTitle('School Messaging System API')
            .setDescription('API documentation for the School Messaging System')
            .setVersion('1.0.0')
            .addBearerAuth()
            .build();
        const document = swagger_1.SwaggerModule.createDocument(app, config);
        swagger_1.SwaggerModule.setup('api/docs', app, document);
    }
    const metricsService = app.get(metrics_service_1.MetricsService);
    app.useGlobalInterceptors(new metrics_interceptor_1.MetricsInterceptor(metricsService));
    app.enableShutdownHooks();
    const port = process.env.PORT || 3000;
    await app.listen(port);
    logger.log(`🚀 Server running on http://localhost:${port}`);
    logger.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}
bootstrap();


/***/ }),
/* 1 */
/***/ ((module) => {

module.exports = require("@nestjs/core");

/***/ }),
/* 2 */
/***/ ((module) => {

module.exports = require("@nestjs/common");

/***/ }),
/* 3 */
/***/ ((module) => {

module.exports = require("@nestjs/swagger");

/***/ }),
/* 4 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AppModule = void 0;
const common_1 = __webpack_require__(2);
const core_1 = __webpack_require__(1);
const config_1 = __webpack_require__(5);
const throttler_1 = __webpack_require__(6);
const nest_winston_1 = __webpack_require__(7);
const schedule_1 = __webpack_require__(8);
const prisma_module_1 = __webpack_require__(9);
const auth_module_1 = __webpack_require__(12);
const users_module_1 = __webpack_require__(36);
const messaging_module_1 = __webpack_require__(40);
const moderation_module_1 = __webpack_require__(80);
const courses_module_1 = __webpack_require__(83);
const grading_module_1 = __webpack_require__(87);
const attendance_module_1 = __webpack_require__(91);
const files_module_1 = __webpack_require__(95);
const health_module_1 = __webpack_require__(111);
const admin_module_1 = __webpack_require__(112);
const analytics_module_1 = __webpack_require__(120);
const notifications_module_1 = __webpack_require__(72);
const mentions_module_1 = __webpack_require__(77);
const redis_module_1 = __webpack_require__(41);
const soft_delete_module_1 = __webpack_require__(125);
const update_module_1 = __webpack_require__(129);
const metrics_module_1 = __webpack_require__(131);
const payments_module_1 = __webpack_require__(134);
const parent_module_1 = __webpack_require__(138);
const conferences_module_1 = __webpack_require__(141);
const report_cards_module_1 = __webpack_require__(145);
const winston_config_1 = __webpack_require__(149);
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            nest_winston_1.WinstonModule.forRoot(winston_config_1.winstonConfig),
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: ['.env', '../.env'],
                validate: (config) => {
                    if (!config.JWT_SECRET) {
                        throw new Error('JWT_SECRET environment variable is required');
                    }
                    if (!config.DATABASE_URL) {
                        throw new Error('DATABASE_URL environment variable is required');
                    }
                    return config;
                },
            }),
            schedule_1.ScheduleModule.forRoot(),
            throttler_1.ThrottlerModule.forRoot([{
                    ttl: 60000,
                    limit: 100,
                }]),
            redis_module_1.RedisModule,
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            messaging_module_1.MessagingModule,
            moderation_module_1.ModerationModule,
            courses_module_1.CoursesModule,
            grading_module_1.GradingModule,
            attendance_module_1.AttendanceModule,
            files_module_1.FilesModule,
            health_module_1.HealthModule,
            admin_module_1.AdminModule,
            analytics_module_1.AnalyticsModule,
            notifications_module_1.NotificationsModule,
            mentions_module_1.MentionsModule,
            soft_delete_module_1.SoftDeleteModule,
            update_module_1.UpdateModule,
            metrics_module_1.MetricsModule,
            payments_module_1.PaymentsModule,
            parent_module_1.ParentModule,
            conferences_module_1.ConferencesModule,
            report_cards_module_1.ReportCardsModule,
        ],
        providers: [
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_1.ThrottlerGuard,
            },
        ],
    })
], AppModule);


/***/ }),
/* 5 */
/***/ ((module) => {

module.exports = require("@nestjs/config");

/***/ }),
/* 6 */
/***/ ((module) => {

module.exports = require("@nestjs/throttler");

/***/ }),
/* 7 */
/***/ ((module) => {

module.exports = require("nest-winston");

/***/ }),
/* 8 */
/***/ ((module) => {

module.exports = require("@nestjs/schedule");

/***/ }),
/* 9 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PrismaModule = void 0;
const common_1 = __webpack_require__(2);
const prisma_service_1 = __webpack_require__(10);
let PrismaModule = class PrismaModule {
};
exports.PrismaModule = PrismaModule;
exports.PrismaModule = PrismaModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        providers: [prisma_service_1.PrismaService],
        exports: [prisma_service_1.PrismaService],
    })
], PrismaModule);


/***/ }),
/* 10 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PrismaService_1;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PrismaService = void 0;
const common_1 = __webpack_require__(2);
const client_1 = __webpack_require__(11);
let PrismaService = PrismaService_1 = class PrismaService extends client_1.PrismaClient {
    constructor() {
        const databaseUrl = process.env.DATABASE_URL;
        super({
            datasources: {
                db: {
                    url: databaseUrl,
                },
            },
            log: process.env.NODE_ENV === 'development'
                ? ['query', 'info', 'warn', 'error']
                : ['error', 'warn'],
        });
        this.logger = new common_1.Logger(PrismaService_1.name);
    }
    async onModuleInit() {
        await this.$connect();
        this.logger.log('✅ Database connected');
        if (process.env.NODE_ENV !== 'production') {
            this.logger.log('Database URL configured (redacted)');
        }
    }
    async onModuleDestroy() {
        await this.$disconnect();
        this.logger.log('Database disconnected');
    }
    async executeRaw(query, ...parameters) {
        const dangerousPatterns = [
            /;\s*(drop|delete|truncate|alter|create|insert|update|grant|revoke)\s+/i,
            /(--|\/\*|\*\/)/,
            /;\s*$/m,
        ];
        for (const pattern of dangerousPatterns) {
            if (pattern.test(query)) {
                this.logger.warn(`Blocked potentially dangerous query: ${query.substring(0, 100)}...`);
                throw new common_1.BadRequestException('Invalid query pattern detected');
            }
        }
        try {
            const sql = client_1.Prisma.sql([query], ...parameters);
            return await this.$queryRaw(sql);
        }
        catch (error) {
            this.logger.error(`Raw query failed: ${error.message}`);
            throw error;
        }
    }
    async executeSafeSelect(table, where, allowedTables = []) {
        if (!allowedTables.includes(table)) {
            throw new common_1.BadRequestException(`Table '${table}' is not in the allowlist`);
        }
        const conditions = Object.entries(where).map(([key, value]) => {
            return client_1.Prisma.sql `${client_1.Prisma.raw(`"${key}"`)} = ${value}`;
        });
        const whereClause = conditions.length > 0
            ? client_1.Prisma.sql `WHERE ${client_1.Prisma.join(conditions, ' AND ')}`
            : client_1.Prisma.sql ``;
        const sql = client_1.Prisma.sql `SELECT * FROM ${client_1.Prisma.raw(`"${table}"`)} ${whereClause}`;
        return await this.$queryRaw(sql);
    }
    async healthCheck() {
        try {
            await this.$queryRaw `SELECT 1`;
            return true;
        }
        catch {
            return false;
        }
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = PrismaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], PrismaService);


/***/ }),
/* 11 */
/***/ ((module) => {

module.exports = require("@prisma/client");

/***/ }),
/* 12 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AuthModule = void 0;
const common_1 = __webpack_require__(2);
const jwt_1 = __webpack_require__(13);
const config_1 = __webpack_require__(5);
const passport_1 = __webpack_require__(14);
const auth_controller_1 = __webpack_require__(15);
const auth_service_1 = __webpack_require__(17);
const jwt_strategy_1 = __webpack_require__(34);
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            passport_1.PassportModule.register({ defaultStrategy: 'jwt' }),
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => {
                    const secret = configService.get('JWT_SECRET');
                    if (!secret) {
                        throw new Error('JWT_SECRET environment variable is required');
                    }
                    return {
                        secret,
                        signOptions: { expiresIn: configService.get('JWT_EXPIRATION', '15m') },
                    };
                },
                inject: [config_1.ConfigService],
            }),
        ],
        controllers: [auth_controller_1.AuthController],
        providers: [auth_service_1.AuthService, jwt_strategy_1.JwtStrategy],
        exports: [auth_service_1.AuthService, jwt_1.JwtModule],
    })
], AuthModule);


/***/ }),
/* 13 */
/***/ ((module) => {

module.exports = require("@nestjs/jwt");

/***/ }),
/* 14 */
/***/ ((module) => {

module.exports = require("@nestjs/passport");

/***/ }),
/* 15 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AuthController = void 0;
const common_1 = __webpack_require__(2);
const swagger_1 = __webpack_require__(3);
const express_1 = __webpack_require__(16);
const throttler_1 = __webpack_require__(6);
const auth_service_1 = __webpack_require__(17);
const auth_dto_1 = __webpack_require__(22);
const jwt_auth_guard_1 = __webpack_require__(29);
const metrics_service_1 = __webpack_require__(30);
const roles_guard_1 = __webpack_require__(32);
const roles_decorator_1 = __webpack_require__(33);
const PRIVILEGED_ROLES = ['admin'];
const REFRESH_COOKIE = 'sms_refresh_token';
const cookieOptions = (maxAgeMs) => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: maxAgeMs,
    path: '/',
});
let AuthController = class AuthController {
    constructor(authService, metricsService) {
        this.authService = authService;
        this.metricsService = metricsService;
    }
    async register(dto, res) {
        if (PRIVILEGED_ROLES.includes(dto.role?.toLowerCase())) {
            throw new common_1.ForbiddenException('Admin accounts cannot be self-registered. Contact an existing administrator.');
        }
        const result = await this.authService.register(dto);
        res.cookie(REFRESH_COOKIE, result.refreshToken, cookieOptions(7 * 24 * 60 * 60 * 1000));
        this.metricsService.recordUserRegistration(result.user.roles?.[0]?.role?.name || 'user');
        return { user: result.user, accessToken: result.accessToken };
    }
    async adminCreateUser(dto) {
        return this.authService.register(dto);
    }
    async login(dto, res) {
        const result = await this.authService.login(dto);
        res.cookie(REFRESH_COOKIE, result.refreshToken, cookieOptions(7 * 24 * 60 * 60 * 1000));
        this.metricsService.recordUserLogin(result.user.roles?.[0]?.role?.name || 'user');
        return { user: result.user, accessToken: result.accessToken };
    }
    async refresh(req, dto, res) {
        const token = req.cookies?.[REFRESH_COOKIE] || dto?.refreshToken;
        if (!token) {
            throw new common_1.ForbiddenException('Refresh token is required');
        }
        const result = await this.authService.refresh(token);
        res.cookie(REFRESH_COOKIE, result.refreshToken, cookieOptions(7 * 24 * 60 * 60 * 1000));
        return { user: result.user, accessToken: result.accessToken };
    }
    async logout(req, bodyRefreshToken, res) {
        const refreshToken = req.cookies?.[REFRESH_COOKIE] || bodyRefreshToken;
        const accessTokenJti = req.user?.jti;
        res?.clearCookie(REFRESH_COOKIE, { path: '/' });
        return this.authService.logout(req.user.sub, refreshToken, accessTokenJti);
    }
    async getProfile(req) {
        return this.authService.getProfile(req.user.sub);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('register'),
    (0, throttler_1.Throttle)({ default: { limit: 3, ttl: 3600000 } }),
    (0, swagger_1.ApiOperation)({ summary: 'Register a new user (non-admin roles only)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'User registered successfully' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Admin accounts must be created by an existing admin' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Email already registered' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_c = typeof auth_dto_1.RegisterDto !== "undefined" && auth_dto_1.RegisterDto) === "function" ? _c : Object, typeof (_d = typeof express_1.Response !== "undefined" && express_1.Response) === "function" ? _d : Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('admin/create-user'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: create a user with any role' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'User created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Admin access required' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_e = typeof auth_dto_1.RegisterDto !== "undefined" && auth_dto_1.RegisterDto) === "function" ? _e : Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "adminCreateUser", null);
__decorate([
    (0, common_1.Post)('login'),
    (0, throttler_1.Throttle)({ default: { limit: 5, ttl: 60000 } }),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Login with email and password' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Login successful' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Invalid credentials' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_f = typeof auth_dto_1.LoginDto !== "undefined" && auth_dto_1.LoginDto) === "function" ? _f : Object, typeof (_g = typeof express_1.Response !== "undefined" && express_1.Response) === "function" ? _g : Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('refresh'),
    (0, throttler_1.Throttle)({ default: { limit: 10, ttl: 60000 } }),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Refresh access token' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Token refreshed successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Invalid or expired refresh token' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeof (_h = typeof auth_dto_1.RefreshDto !== "undefined" && auth_dto_1.RefreshDto) === "function" ? _h : Object, typeof (_j = typeof express_1.Response !== "undefined" && express_1.Response) === "function" ? _j : Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refresh", null);
__decorate([
    (0, common_1.Post)('logout'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Logout and invalidate tokens' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Logout successful' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)('refreshToken')),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, typeof (_k = typeof express_1.Response !== "undefined" && express_1.Response) === "function" ? _k : Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('profile'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get current user profile' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Profile retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getProfile", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('Authentication'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [typeof (_a = typeof auth_service_1.AuthService !== "undefined" && auth_service_1.AuthService) === "function" ? _a : Object, typeof (_b = typeof metrics_service_1.MetricsService !== "undefined" && metrics_service_1.MetricsService) === "function" ? _b : Object])
], AuthController);


/***/ }),
/* 16 */
/***/ ((module) => {

module.exports = require("express");

/***/ }),
/* 17 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuthService_1;
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AuthService = void 0;
const common_1 = __webpack_require__(2);
const jwt_1 = __webpack_require__(13);
const config_1 = __webpack_require__(5);
const prisma_service_1 = __webpack_require__(10);
const user_sanitizer_1 = __webpack_require__(18);
const bcrypt = __importStar(__webpack_require__(19));
const uuid_1 = __webpack_require__(20);
const ioredis_1 = __webpack_require__(21);
let AuthService = AuthService_1 = class AuthService {
    constructor(prisma, jwtService, configService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.configService = configService;
        this.logger = new common_1.Logger(AuthService_1.name);
        const redisUrl = this.configService.get('REDIS_URL');
        if (!redisUrl) {
            throw new Error('REDIS_URL environment variable is required');
        }
        this.redis = new ioredis_1.Redis(redisUrl);
        this.redis.on('error', (err) => {
            this.logger.error('AuthService Redis error:', err.message);
        });
    }
    async register(dto) {
        const existing = await this.prisma.user.findUnique({
            where: { email: dto.email.toLowerCase() },
        });
        if (existing) {
            throw new common_1.ConflictException('Email already registered');
        }
        const passwordHash = await bcrypt.hash(dto.password, 14);
        const role = await this.prisma.role.findUnique({
            where: { name: dto.role.toLowerCase() },
        });
        if (!role) {
            throw new common_1.ConflictException(`Role '${dto.role}' does not exist`);
        }
        const user = await this.prisma.user.create({
            data: {
                email: dto.email.toLowerCase(),
                passwordHash,
                firstName: dto.firstName,
                lastName: dto.lastName,
                phone: dto.phone,
                userRoles: {
                    create: { roleId: role.id },
                },
            },
            include: {
                userRoles: { include: { role: true } },
            },
        });
        this.logger.log(`User registered: ${user.email} (${dto.role})`);
        const tokens = await this.generateTokens(user.id, user.email, [dto.role], user.passwordVersion);
        return {
            user: (0, user_sanitizer_1.sanitizeUser)(user),
            ...tokens,
        };
    }
    async login(dto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email.toLowerCase() },
            include: {
                userRoles: { include: { role: true } },
            },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (user.deletedAt) {
            throw new common_1.UnauthorizedException('Account has been deleted. Please contact an administrator to restore your account.');
        }
        if (user.status !== 'active') {
            throw new common_1.UnauthorizedException('Account is suspended or archived');
        }
        const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        await this.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });
        const roles = user.userRoles.map((ur) => ur.role.name);
        const tokens = await this.generateTokens(user.id, user.email, roles, user.passwordVersion);
        this.logger.log(`User logged in: ${user.email}`);
        return {
            user: (0, user_sanitizer_1.sanitizeUser)(user),
            ...tokens,
        };
    }
    async refresh(refreshToken) {
        const stored = await this.prisma.refreshToken.findUnique({
            where: { token: refreshToken },
            include: {
                user: { include: { userRoles: { include: { role: true } } } },
            },
        });
        if (!stored || stored.expiresAt < new Date()) {
            throw new common_1.UnauthorizedException('Invalid or expired refresh token');
        }
        if (stored.user.deletedAt) {
            throw new common_1.UnauthorizedException('Account has been deleted');
        }
        const roles = stored.user.userRoles.map((ur) => ur.role.name);
        const tokens = await this.prisma.$transaction(async (tx) => {
            const newTokens = await this.generateTokens(stored.user.id, stored.user.email, roles, stored.user.passwordVersion);
            await tx.refreshToken.delete({ where: { id: stored.id } });
            return newTokens;
        });
        this.logger.log(`Token refreshed for user: ${stored.user.email}`);
        return {
            user: (0, user_sanitizer_1.sanitizeUser)(stored.user),
            ...tokens,
        };
    }
    async getProfile(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { userRoles: { include: { role: true } } },
        });
        if (!user)
            throw new common_1.UnauthorizedException('User not found');
        return (0, user_sanitizer_1.sanitizeUser)(user);
    }
    async logout(userId, refreshToken, accessTokenJti) {
        if (refreshToken) {
            await this.prisma.refreshToken.deleteMany({
                where: { token: refreshToken, userId },
            });
        }
        else {
            await this.prisma.refreshToken.deleteMany({
                where: { userId },
            });
        }
        if (accessTokenJti) {
            const expiresIn = this.configService.get('JWT_EXPIRATION', '15m');
            const ttlSeconds = Math.ceil(this.parseExpiration(expiresIn) / 1000);
            await this.redis.set(`token:denylist:${accessTokenJti}`, '1', 'EX', ttlSeconds);
        }
        this.logger.log(`User logged out: ${userId}`);
        return { loggedOut: true };
    }
    validateJwtSecrets() {
        const secret = this.configService.get('JWT_SECRET');
        const refreshSecret = this.configService.get('JWT_REFRESH_SECRET');
        if (!secret || secret.length < 32) {
            throw new common_1.UnauthorizedException('JWT_SECRET must be at least 32 characters');
        }
        if (!refreshSecret || refreshSecret.length < 32) {
            throw new common_1.UnauthorizedException('JWT_REFRESH_SECRET must be at least 32 characters');
        }
        if (secret === refreshSecret) {
            throw new common_1.UnauthorizedException('JWT_SECRET and JWT_REFRESH_SECRET must be different');
        }
    }
    async generateTokens(userId, email, roles, pwdVersion) {
        this.validateJwtSecrets();
        const jti = (0, uuid_1.v4)();
        const payload = { sub: userId, email, roles, jti, pwdVersion, iat: Math.floor(Date.now() / 1000) };
        const secret = this.configService.get('JWT_SECRET');
        const refreshSecret = this.configService.get('JWT_REFRESH_SECRET');
        const expiresIn = this.configService.get('JWT_EXPIRATION', '15m');
        const refreshExpiresIn = this.configService.get('JWT_REFRESH_EXPIRATION', '7d');
        if (!secret || secret.length < 32) {
            throw new common_1.UnauthorizedException('JWT_SECRET must be configured and at least 32 characters long');
        }
        const accessToken = this.jwtService.sign(payload, {
            secret,
            expiresIn,
        });
        const refreshToken = (0, uuid_1.v4)();
        const expiresAt = new Date();
        expiresAt.setTime(expiresAt.getTime() + this.parseExpiration(refreshExpiresIn));
        await this.prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId,
                expiresAt,
            },
        });
        return { accessToken, refreshToken };
    }
    parseExpiration(expiration) {
        const match = expiration.match(/^(\d+)([smhdw])$/);
        if (!match) {
            this.logger.warn(`Unrecognized expiration format '${expiration}', defaulting to 7 days`);
            return 7 * 24 * 60 * 60 * 1000;
        }
        const value = parseInt(match[1], 10);
        const unit = match[2];
        const multipliers = {
            s: 1000,
            m: 60 * 1000,
            h: 60 * 60 * 1000,
            d: 24 * 60 * 60 * 1000,
            w: 7 * 24 * 60 * 60 * 1000,
        };
        return value * multipliers[unit];
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object, typeof (_b = typeof jwt_1.JwtService !== "undefined" && jwt_1.JwtService) === "function" ? _b : Object, typeof (_c = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _c : Object])
], AuthService);


/***/ }),
/* 18 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.sanitizeUser = sanitizeUser;
exports.sanitizeUsers = sanitizeUsers;
function sanitizeUser(user) {
    if (!user)
        return null;
    const { passwordHash, userRoles, ...rest } = user;
    return {
        ...rest,
        roles: userRoles?.map((ur) => ur.role.name) || [],
    };
}
function sanitizeUsers(users) {
    return users.map(user => sanitizeUser(user));
}


/***/ }),
/* 19 */
/***/ ((module) => {

module.exports = require("bcrypt");

/***/ }),
/* 20 */
/***/ ((module) => {

module.exports = require("uuid");

/***/ }),
/* 21 */
/***/ ((module) => {

module.exports = require("ioredis");

/***/ }),
/* 22 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ChangePasswordDto = exports.ResetPasswordDto = exports.ForgotPasswordDto = exports.RefreshDto = exports.LoginDto = exports.RegisterDto = exports.UserRole = void 0;
const class_validator_1 = __webpack_require__(23);
const sanitize_decorator_1 = __webpack_require__(24);
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "admin";
    UserRole["TEACHER"] = "teacher";
    UserRole["PARENT"] = "parent";
    UserRole["STUDENT"] = "student";
})(UserRole || (exports.UserRole = UserRole = {}));
class RegisterDto {
}
exports.RegisterDto = RegisterDto;
__decorate([
    (0, class_validator_1.IsEmail)({}, { message: 'Please provide a valid email address' }),
    (0, class_validator_1.MaxLength)(255, { message: 'Email cannot exceed 255 characters' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Email is required' }),
    (0, sanitize_decorator_1.SanitizePlainText)(),
    __metadata("design:type", String)
], RegisterDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'Password must be a string' }),
    (0, class_validator_1.MinLength)(8, { message: 'Password must be at least 8 characters long' }),
    (0, class_validator_1.MaxLength)(128, { message: 'Password cannot exceed 128 characters' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Password is required' }),
    (0, class_validator_1.Matches)(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
        message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    }),
    __metadata("design:type", String)
], RegisterDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'First name must be a string' }),
    (0, class_validator_1.MinLength)(1, { message: 'First name is required' }),
    (0, class_validator_1.MaxLength)(100, { message: 'First name cannot exceed 100 characters' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'First name is required' }),
    (0, sanitize_decorator_1.SanitizePlainText)(),
    __metadata("design:type", String)
], RegisterDto.prototype, "firstName", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'Last name must be a string' }),
    (0, class_validator_1.MinLength)(1, { message: 'Last name is required' }),
    (0, class_validator_1.MaxLength)(100, { message: 'Last name cannot exceed 100 characters' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Last name is required' }),
    (0, sanitize_decorator_1.SanitizePlainText)(),
    __metadata("design:type", String)
], RegisterDto.prototype, "lastName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Phone number must be a string' }),
    (0, class_validator_1.MaxLength)(20, { message: 'Phone number cannot exceed 20 characters' }),
    (0, class_validator_1.Matches)(/^[\d\s\+\-\(\)\.]*$/, { message: 'Phone number contains invalid characters' }),
    (0, sanitize_decorator_1.SanitizePlainText)(),
    __metadata("design:type", String)
], RegisterDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'Role must be a string' }),
    (0, class_validator_1.IsEnum)(UserRole, { message: 'Role must be one of: admin, teacher, parent, student' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Role is required' }),
    (0, sanitize_decorator_1.SanitizePlainText)(),
    __metadata("design:type", String)
], RegisterDto.prototype, "role", void 0);
class LoginDto {
}
exports.LoginDto = LoginDto;
__decorate([
    (0, class_validator_1.IsEmail)({}, { message: 'Please provide a valid email address' }),
    (0, class_validator_1.MaxLength)(255, { message: 'Email cannot exceed 255 characters' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Email is required' }),
    (0, sanitize_decorator_1.SanitizePlainText)(),
    __metadata("design:type", String)
], LoginDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'Password must be a string' }),
    (0, class_validator_1.MinLength)(1, { message: 'Password is required' }),
    (0, class_validator_1.MaxLength)(128, { message: 'Password cannot exceed 128 characters' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Password is required' }),
    __metadata("design:type", String)
], LoginDto.prototype, "password", void 0);
class RefreshDto {
}
exports.RefreshDto = RefreshDto;
__decorate([
    (0, class_validator_1.IsString)({ message: 'Refresh token must be a string' }),
    (0, class_validator_1.MaxLength)(512, { message: 'Refresh token format is invalid' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Refresh token is required' }),
    __metadata("design:type", String)
], RefreshDto.prototype, "refreshToken", void 0);
class ForgotPasswordDto {
}
exports.ForgotPasswordDto = ForgotPasswordDto;
__decorate([
    (0, class_validator_1.IsEmail)({}, { message: 'Please provide a valid email address' }),
    (0, class_validator_1.MaxLength)(255, { message: 'Email cannot exceed 255 characters' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Email is required' }),
    (0, sanitize_decorator_1.SanitizePlainText)(),
    __metadata("design:type", String)
], ForgotPasswordDto.prototype, "email", void 0);
class ResetPasswordDto {
}
exports.ResetPasswordDto = ResetPasswordDto;
__decorate([
    (0, class_validator_1.IsString)({ message: 'Reset token must be a string' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Reset token is required' }),
    __metadata("design:type", String)
], ResetPasswordDto.prototype, "token", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'Password must be a string' }),
    (0, class_validator_1.MinLength)(8, { message: 'Password must be at least 8 characters long' }),
    (0, class_validator_1.MaxLength)(128, { message: 'Password cannot exceed 128 characters' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Password is required' }),
    (0, class_validator_1.Matches)(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
        message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    }),
    __metadata("design:type", String)
], ResetPasswordDto.prototype, "password", void 0);
class ChangePasswordDto {
}
exports.ChangePasswordDto = ChangePasswordDto;
__decorate([
    (0, class_validator_1.IsString)({ message: 'Current password must be a string' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Current password is required' }),
    __metadata("design:type", String)
], ChangePasswordDto.prototype, "currentPassword", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'New password must be a string' }),
    (0, class_validator_1.MinLength)(8, { message: 'New password must be at least 8 characters long' }),
    (0, class_validator_1.MaxLength)(128, { message: 'New password cannot exceed 128 characters' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'New password is required' }),
    (0, class_validator_1.Matches)(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
        message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    }),
    __metadata("design:type", String)
], ChangePasswordDto.prototype, "newPassword", void 0);


/***/ }),
/* 23 */
/***/ ((module) => {

module.exports = require("class-validator");

/***/ }),
/* 24 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SANITIZE_METADATA_KEY = void 0;
exports.Sanitize = Sanitize;
exports.SanitizePlainText = SanitizePlainText;
exports.SanitizeHtml = SanitizeHtml;
exports.Sanitizable = Sanitizable;
exports.getSanitizeOptions = getSanitizeOptions;
__webpack_require__(25);
const class_transformer_1 = __webpack_require__(26);
const DOMPurify = __webpack_require__(27);
const jsdom_1 = __webpack_require__(28);
const window = new jsdom_1.JSDOM('').window;
const purify = DOMPurify(window);
const defaultConfig = {
    ALLOWED_TAGS: [
        'b', 'i', 'em', 'strong', 'u', 'a', 'p', 'br', 'ul', 'ol', 'li',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'div', 'blockquote',
        'code', 'pre', 'hr'
    ],
    ALLOWED_ATTR: [
        'href', 'title', 'target', 'class', 'id', 'rel'
    ],
    ALLOW_DATA_ATTR: false,
    SANITIZE_DOM: true,
    FORBID_ATTR: ['style', 'onclick', 'onerror', 'onload', 'onmouseover', 'onmouseenter', 'onmouseleave'],
    TRANSFORM_TAGS: {
        'a': (tagName, attribs) => {
            const href = attribs.href || '';
            const isValidHref = /^https?:\/\//i.test(href) ||
                /^\/\//i.test(href) ||
                /^\//i.test(href) ||
                /^#/i.test(href) ||
                /^mailto:/i.test(href);
            if (!isValidHref) {
                return {
                    tagName: 'span',
                    attribs: { class: 'invalid-link' },
                };
            }
            return {
                tagName: 'a',
                attribs: {
                    ...attribs,
                    target: '_blank',
                    rel: 'noopener noreferrer nofollow',
                },
            };
        },
    },
};
const plainTextConfig = {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
};
const stripHtmlConfig = {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
};
function sanitizeValue(value, allowFormatting = true) {
    if (typeof value !== 'string') {
        return value;
    }
    const config = allowFormatting ? defaultConfig : plainTextConfig;
    const sanitized = purify.sanitize(value, config);
    return sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
}
function Sanitize(allowFormatting = true) {
    return (0, class_transformer_1.Transform)(({ value }) => {
        if (typeof value !== 'string') {
            return value;
        }
        const sanitized = sanitizeValue(value, allowFormatting);
        if (!allowFormatting && typeof sanitized === 'string') {
            return sanitized
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&#x27;/g, "'")
                .replace(/&#x2F;/g, '/');
        }
        return sanitized;
    }, {
        toClassOnly: true,
    });
}
function SanitizePlainText() {
    return (0, class_transformer_1.Transform)(({ value }) => {
        if (typeof value !== 'string') {
            return value;
        }
        const sanitized = purify.sanitize(value, stripHtmlConfig);
        return sanitized
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#x27;/g, "'")
            .replace(/&#x2F;/g, '/');
    }, {
        toClassOnly: true,
    });
}
function SanitizeHtml() {
    return (0, class_transformer_1.Transform)(({ value }) => {
        if (typeof value !== 'string') {
            return value;
        }
        return sanitizeValue(value, true);
    }, {
        toClassOnly: true,
    });
}
exports.SANITIZE_METADATA_KEY = Symbol('sanitize');
function Sanitizable(options = { allowFormatting: true }) {
    return function (target) {
        Reflect.defineMetadata(exports.SANITIZE_METADATA_KEY, options, target);
        return target;
    };
}
function getSanitizeOptions(target) {
    return Reflect.getMetadata(exports.SANITIZE_METADATA_KEY, target);
}


/***/ }),
/* 25 */
/***/ ((module) => {

module.exports = require("reflect-metadata");

/***/ }),
/* 26 */
/***/ ((module) => {

module.exports = require("class-transformer");

/***/ }),
/* 27 */
/***/ ((module) => {

module.exports = require("dompurify");

/***/ }),
/* 28 */
/***/ ((module) => {

module.exports = require("jsdom");

/***/ }),
/* 29 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.JwtAuthGuard = void 0;
const common_1 = __webpack_require__(2);
const passport_1 = __webpack_require__(14);
let JwtAuthGuard = class JwtAuthGuard extends (0, passport_1.AuthGuard)('jwt') {
};
exports.JwtAuthGuard = JwtAuthGuard;
exports.JwtAuthGuard = JwtAuthGuard = __decorate([
    (0, common_1.Injectable)()
], JwtAuthGuard);


/***/ }),
/* 30 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MetricsService_1;
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MetricsService = void 0;
const common_1 = __webpack_require__(2);
const config_1 = __webpack_require__(5);
const prom_client_1 = __webpack_require__(31);
let MetricsService = MetricsService_1 = class MetricsService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(MetricsService_1.name);
        this.activeUsers = new Map();
        this.wsConnections = new Map();
        this.httpRequestDuration = new prom_client_1.Histogram({
            name: 'http_request_duration_seconds',
            help: 'HTTP request duration in seconds',
            labelNames: ['method', 'route', 'status_code'],
            buckets: [0.001, 0.005, 0.015, 0.05, 0.1, 0.5, 1, 2, 5],
        });
        this.messagesSentCounter = new prom_client_1.Counter({
            name: 'school_messages_sent_total',
            help: 'Total number of messages sent',
            labelNames: ['channel_type', 'sender_role'],
        });
        this.messagesReceivedCounter = new prom_client_1.Counter({
            name: 'school_messages_received_total',
            help: 'Total number of messages received',
            labelNames: ['channel_type'],
        });
        this.messageEditCounter = new prom_client_1.Counter({
            name: 'school_message_edits_total',
            help: 'Total number of message edits',
        });
        this.messageDeleteCounter = new prom_client_1.Counter({
            name: 'school_message_deletes_total',
            help: 'Total number of message deletions',
        });
        this.activeUsersGauge = new prom_client_1.Gauge({
            name: 'school_active_users',
            help: 'Number of currently active users',
            labelNames: ['role'],
        });
        this.userLoginCounter = new prom_client_1.Counter({
            name: 'school_user_logins_total',
            help: 'Total number of user logins',
            labelNames: ['role'],
        });
        this.userRegistrationCounter = new prom_client_1.Counter({
            name: 'school_user_registrations_total',
            help: 'Total number of user registrations',
            labelNames: ['role'],
        });
        this.wsConnectionsGauge = new prom_client_1.Gauge({
            name: 'school_websocket_connections',
            help: 'Number of active WebSocket connections',
        });
        this.wsEventsCounter = new prom_client_1.Counter({
            name: 'school_websocket_events_total',
            help: 'Total number of WebSocket events',
            labelNames: ['event_type'],
        });
        this.fileUploadCounter = new prom_client_1.Counter({
            name: 'school_file_uploads_total',
            help: 'Total number of file uploads',
            labelNames: ['category', 'status'],
        });
        this.fileUploadSizeHistogram = new prom_client_1.Histogram({
            name: 'school_file_upload_size_bytes',
            help: 'File upload size in bytes',
            labelNames: ['category'],
            buckets: [1024, 10240, 102400, 1048576, 10485760, 52428800, 104857600],
        });
        this.fileUploadErrorsCounter = new prom_client_1.Counter({
            name: 'school_file_upload_errors_total',
            help: 'Total number of file upload errors',
            labelNames: ['category', 'error_type'],
        });
        this.channelMessagesCounter = new prom_client_1.Counter({
            name: 'school_channel_messages_total',
            help: 'Total messages per channel',
            labelNames: ['channel_id', 'channel_type'],
        });
        this.channelActiveGauge = new prom_client_1.Gauge({
            name: 'school_active_channels',
            help: 'Number of currently active channels',
            labelNames: ['channel_type'],
        });
        this.errorCounter = new prom_client_1.Counter({
            name: 'school_errors_total',
            help: 'Total number of errors',
            labelNames: ['type', 'endpoint'],
        });
        this.rateLimitCounter = new prom_client_1.Counter({
            name: 'school_rate_limit_hits_total',
            help: 'Total number of rate limit hits',
            labelNames: ['endpoint', 'user_role'],
        });
        prom_client_1.register.registerMetric(this.httpRequestDuration);
        prom_client_1.register.registerMetric(this.messagesSentCounter);
        prom_client_1.register.registerMetric(this.messagesReceivedCounter);
        prom_client_1.register.registerMetric(this.messageEditCounter);
        prom_client_1.register.registerMetric(this.messageDeleteCounter);
        prom_client_1.register.registerMetric(this.activeUsersGauge);
        prom_client_1.register.registerMetric(this.userLoginCounter);
        prom_client_1.register.registerMetric(this.userRegistrationCounter);
        prom_client_1.register.registerMetric(this.wsConnectionsGauge);
        prom_client_1.register.registerMetric(this.wsEventsCounter);
        prom_client_1.register.registerMetric(this.fileUploadCounter);
        prom_client_1.register.registerMetric(this.fileUploadSizeHistogram);
        prom_client_1.register.registerMetric(this.fileUploadErrorsCounter);
        prom_client_1.register.registerMetric(this.channelMessagesCounter);
        prom_client_1.register.registerMetric(this.channelActiveGauge);
        prom_client_1.register.registerMetric(this.errorCounter);
        prom_client_1.register.registerMetric(this.rateLimitCounter);
    }
    onModuleInit() {
        (0, prom_client_1.collectDefaultMetrics)({
            prefix: 'school_',
        });
        this.logger.log('Metrics service initialized');
    }
    recordHttpRequest(method, route, statusCode, duration) {
        this.httpRequestDuration
            .labels(method, route, statusCode.toString())
            .observe(duration);
    }
    recordMessageSent(channelType, senderRole) {
        this.messagesSentCounter.labels(channelType, senderRole).inc();
    }
    recordMessageReceived(channelType) {
        this.messagesReceivedCounter.labels(channelType).inc();
    }
    recordMessageEdit() {
        this.messageEditCounter.inc();
    }
    recordMessageDelete() {
        this.messageDeleteCounter.inc();
    }
    recordUserLogin(role) {
        this.userLoginCounter.labels(role).inc();
        this.trackActiveUser(role);
    }
    recordUserRegistration(role) {
        this.userRegistrationCounter.labels(role).inc();
    }
    trackActiveUser(role) {
        const count = this.activeUsers.get(role) || 0;
        this.activeUsers.set(role, count + 1);
        this.activeUsersGauge.labels(role).set(count + 1);
    }
    removeActiveUser(role) {
        const count = this.activeUsers.get(role) || 0;
        const newCount = Math.max(0, count - 1);
        this.activeUsers.set(role, newCount);
        this.activeUsersGauge.labels(role).set(newCount);
    }
    setActiveUsers(count, role = 'all') {
        this.activeUsersGauge.labels(role).set(count);
    }
    recordWsConnection(userId) {
        this.wsConnectionsGauge.inc();
        if (userId) {
            const count = this.wsConnections.get(userId) || 0;
            this.wsConnections.set(userId, count + 1);
        }
    }
    recordWsDisconnection(userId) {
        this.wsConnectionsGauge.dec();
        if (userId) {
            const count = this.wsConnections.get(userId) || 0;
            if (count > 0) {
                this.wsConnections.set(userId, count - 1);
            }
        }
    }
    recordWsEvent(eventType) {
        this.wsEventsCounter.labels(eventType).inc();
    }
    recordFileUpload(category, size, success = true) {
        const status = success ? 'success' : 'failed';
        this.fileUploadCounter.labels(category, status).inc();
        if (success) {
            this.fileUploadSizeHistogram.labels(category).observe(size);
        }
    }
    recordFileUploadError(category, errorType) {
        this.fileUploadErrorsCounter.labels(category, errorType).inc();
        this.fileUploadCounter.labels(category, 'error').inc();
    }
    recordChannelMessage(channelId, channelType) {
        this.channelMessagesCounter.labels(channelId, channelType).inc();
    }
    setActiveChannels(count, channelType = 'all') {
        this.channelActiveGauge.labels(channelType).set(count);
    }
    recordError(type, endpoint = 'unknown') {
        this.errorCounter.labels(type, endpoint).inc();
    }
    recordRateLimit(endpoint, userRole) {
        this.rateLimitCounter.labels(endpoint, userRole).inc();
    }
    async getMetrics() {
        return prom_client_1.register.metrics();
    }
    getContentType() {
        return prom_client_1.register.contentType;
    }
    resetAll() {
        prom_client_1.register.resetMetrics();
    }
};
exports.MetricsService = MetricsService;
exports.MetricsService = MetricsService = MetricsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object])
], MetricsService);


/***/ }),
/* 31 */
/***/ ((module) => {

module.exports = require("prom-client");

/***/ }),
/* 32 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RolesGuard = exports.ROLES_KEY = void 0;
const common_1 = __webpack_require__(2);
const core_1 = __webpack_require__(1);
exports.ROLES_KEY = 'roles';
let RolesGuard = class RolesGuard {
    constructor(reflector) {
        this.reflector = reflector;
    }
    canActivate(context) {
        const requiredRoles = this.reflector.getAllAndOverride(exports.ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!requiredRoles) {
            return true;
        }
        const { user } = context.switchToHttp().getRequest();
        if (!user || !user.roles) {
            throw new common_1.ForbiddenException('Access denied');
        }
        const hasRole = requiredRoles.some((role) => user.roles.includes(role));
        if (!hasRole) {
            throw new common_1.ForbiddenException('Insufficient permissions');
        }
        return true;
    }
};
exports.RolesGuard = RolesGuard;
exports.RolesGuard = RolesGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof core_1.Reflector !== "undefined" && core_1.Reflector) === "function" ? _a : Object])
], RolesGuard);


/***/ }),
/* 33 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Roles = void 0;
const common_1 = __webpack_require__(2);
const roles_guard_1 = __webpack_require__(32);
const Roles = (...roles) => (0, common_1.SetMetadata)(roles_guard_1.ROLES_KEY, roles);
exports.Roles = Roles;


/***/ }),
/* 34 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.JwtStrategy = void 0;
const common_1 = __webpack_require__(2);
const passport_1 = __webpack_require__(14);
const passport_jwt_1 = __webpack_require__(35);
const config_1 = __webpack_require__(5);
const ioredis_1 = __webpack_require__(21);
let JwtStrategy = class JwtStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy) {
    constructor(configService) {
        const secret = configService.get('JWT_SECRET');
        if (!secret) {
            throw new Error('JWT_SECRET environment variable is required');
        }
        super({
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: secret,
            passReqToCallback: false,
        });
        this.configService = configService;
        const redisUrl = configService.get('REDIS_URL');
        if (!redisUrl) {
            throw new Error('REDIS_URL environment variable is required');
        }
        this.redis = new ioredis_1.Redis(redisUrl);
        this.redis.on('error', (err) => {
            console.error('[JwtStrategy] Redis error:', err.message);
        });
    }
    async validate(payload) {
        if (payload.jti) {
            try {
                const revoked = await this.redis.get(`token:denylist:${payload.jti}`);
                if (revoked) {
                    throw new common_1.UnauthorizedException('Token has been revoked');
                }
            }
            catch (err) {
                if (err instanceof common_1.UnauthorizedException)
                    throw err;
                throw new common_1.UnauthorizedException('Authentication service temporarily unavailable');
            }
        }
        return {
            sub: payload.sub,
            email: payload.email,
            roles: payload.roles,
            jti: payload.jti,
        };
    }
};
exports.JwtStrategy = JwtStrategy;
exports.JwtStrategy = JwtStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object])
], JwtStrategy);


/***/ }),
/* 35 */
/***/ ((module) => {

module.exports = require("passport-jwt");

/***/ }),
/* 36 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UsersModule = void 0;
const common_1 = __webpack_require__(2);
const users_controller_1 = __webpack_require__(37);
const users_service_1 = __webpack_require__(38);
let UsersModule = class UsersModule {
};
exports.UsersModule = UsersModule;
exports.UsersModule = UsersModule = __decorate([
    (0, common_1.Module)({
        controllers: [users_controller_1.UsersController],
        providers: [users_service_1.UsersService],
        exports: [users_service_1.UsersService],
    })
], UsersModule);


/***/ }),
/* 37 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UsersController = void 0;
const common_1 = __webpack_require__(2);
const swagger_1 = __webpack_require__(3);
const users_service_1 = __webpack_require__(38);
const jwt_auth_guard_1 = __webpack_require__(29);
const roles_guard_1 = __webpack_require__(32);
const roles_decorator_1 = __webpack_require__(33);
const notification_preferences_dto_1 = __webpack_require__(39);
let UsersController = class UsersController {
    constructor(usersService) {
        this.usersService = usersService;
    }
    async findAll(page, limit) {
        return this.usersService.findAll(page, limit);
    }
    async findByRole(roleName, page, limit) {
        return this.usersService.findByRole(roleName, page, limit);
    }
    async findById(id, req) {
        if (!this.isValidUUID(id)) {
            throw new common_1.BadRequestException('Invalid user ID format');
        }
        const requesterId = req.user.sub;
        const requesterRoles = req.user.roles || [];
        const isAdminOrTeacher = requesterRoles.includes('admin') || requesterRoles.includes('teacher');
        if (requesterId === id || isAdminOrTeacher) {
            return this.usersService.findById(id);
        }
        const hasRelationship = await this.usersService.hasRelationship(requesterId, id);
        if (!hasRelationship) {
            throw new common_1.ForbiddenException('You do not have permission to view this user');
        }
        return this.usersService.findPublicProfile(id);
    }
    isValidUUID(str) {
        const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidV4Regex.test(str);
    }
    async getChildren(id, req) {
        const requesterId = req.user.sub;
        const requesterRoles = req.user.roles || [];
        const isAdminOrTeacher = requesterRoles.includes('admin') || requesterRoles.includes('teacher');
        if (requesterId !== id && !isAdminOrTeacher) {
            throw new common_1.ForbiddenException('You do not have permission to view this user\'s children');
        }
        return this.usersService.getParentChildren(id);
    }
    async getMyNotificationPreferences(req) {
        return this.usersService.getNotificationPreferences(req.user.sub);
    }
    async updateMyNotificationPreferences(req, dto) {
        return this.usersService.updateNotificationPreferences(req.user.sub, dto);
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'teacher'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all users with pagination' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number, description: 'Page number' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number, description: 'Items per page (max 100)' }),
    __param(0, (0, common_1.Query)('page', new common_1.DefaultValuePipe(1), common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(50), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('role/:roleName'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'teacher'),
    (0, swagger_1.ApiOperation)({ summary: 'Get users by role' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number, description: 'Page number' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number, description: 'Items per page (max 100)' }),
    __param(0, (0, common_1.Param)('roleName')),
    __param(1, (0, common_1.Query)('page', new common_1.DefaultValuePipe(1), common_1.ParseIntPipe)),
    __param(2, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(50), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "findByRole", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "findById", null);
__decorate([
    (0, common_1.Get)(':id/children'),
    (0, swagger_1.ApiOperation)({ summary: 'Get children for a parent user' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getChildren", null);
__decorate([
    (0, common_1.Get)('me/notifications'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current user notification preferences' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getMyNotificationPreferences", null);
__decorate([
    (0, common_1.Put)('me/notifications'),
    (0, swagger_1.ApiOperation)({ summary: 'Update current user notification preferences' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeof (_b = typeof notification_preferences_dto_1.NotificationPreferencesDto !== "undefined" && notification_preferences_dto_1.NotificationPreferencesDto) === "function" ? _b : Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateMyNotificationPreferences", null);
exports.UsersController = UsersController = __decorate([
    (0, swagger_1.ApiTags)('Users'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('users'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [typeof (_a = typeof users_service_1.UsersService !== "undefined" && users_service_1.UsersService) === "function" ? _a : Object])
], UsersController);


/***/ }),
/* 38 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UsersService = void 0;
const common_1 = __webpack_require__(2);
const prisma_service_1 = __webpack_require__(10);
const user_sanitizer_1 = __webpack_require__(18);
const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;
const defaultPreferences = {
    new_message: true,
    mention: true,
    digest: true,
    digestFrequency: 'daily',
    account_activity: true,
    assignment_reminder: true,
    grade_posted: true,
};
let UsersService = class UsersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(page = 1, limit = DEFAULT_PAGE_SIZE, includeDeleted = false) {
        const pageSize = Math.min(Math.max(1, limit), MAX_PAGE_SIZE);
        const skip = (Math.max(1, page) - 1) * pageSize;
        const where = includeDeleted ? {} : { deletedAt: null };
        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                include: { userRoles: { include: { role: true } } },
                orderBy: { createdAt: 'desc' },
                skip,
                take: pageSize,
            }),
            this.prisma.user.count({ where }),
        ]);
        return {
            data: (0, user_sanitizer_1.sanitizeUsers)(users),
            meta: {
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            },
        };
    }
    async findById(id, includeDeleted = false) {
        const where = { id };
        if (!includeDeleted) {
            where.deletedAt = null;
        }
        const user = await this.prisma.user.findFirst({
            where,
            include: { userRoles: { include: { role: true } } },
        });
        if (!user)
            return null;
        return (0, user_sanitizer_1.sanitizeUser)(user);
    }
    async findPublicProfile(id) {
        const user = await this.prisma.user.findFirst({
            where: { id, deletedAt: null },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
                userRoles: { select: { role: { select: { name: true } } } },
            },
        });
        if (!user)
            return null;
        return {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            avatarUrl: user.avatarUrl,
            roles: user.userRoles.map((ur) => ur.role.name),
        };
    }
    async findByRole(roleName, page = 1, limit = DEFAULT_PAGE_SIZE) {
        const pageSize = Math.min(Math.max(1, limit), MAX_PAGE_SIZE);
        const skip = (Math.max(1, page) - 1) * pageSize;
        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where: {
                    userRoles: { some: { role: { name: roleName } } },
                    status: 'active',
                },
                include: { userRoles: { include: { role: true } } },
                orderBy: { lastName: 'asc' },
                skip,
                take: pageSize,
            }),
            this.prisma.user.count({
                where: {
                    userRoles: { some: { role: { name: roleName } } },
                    status: 'active',
                },
            }),
        ]);
        return {
            data: (0, user_sanitizer_1.sanitizeUsers)(users),
            meta: {
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            },
        };
    }
    async getParentChildren(parentId) {
        const relations = await this.prisma.parentStudent.findMany({
            where: { parentId },
            include: {
                student: {
                    include: { userRoles: { include: { role: true } } },
                },
            },
        });
        return relations.map((r) => (0, user_sanitizer_1.sanitizeUser)(r.student));
    }
    async findByEmail(email, includeDeleted = false) {
        const where = { email: email.toLowerCase() };
        if (!includeDeleted) {
            where.deletedAt = null;
        }
        const user = await this.prisma.user.findFirst({
            where,
            include: { userRoles: { include: { role: true } } },
        });
        if (!user)
            return null;
        return (0, user_sanitizer_1.sanitizeUser)(user);
    }
    async getNotificationPreferences(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                emailNotificationsEnabled: true,
                notificationPreferences: true,
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const storedPrefs = user.notificationPreferences || {};
        return {
            emailNotificationsEnabled: user.emailNotificationsEnabled,
            preferences: {
                new_message: storedPrefs.new_message ?? defaultPreferences.new_message,
                mention: storedPrefs.mention ?? defaultPreferences.mention,
                digest: storedPrefs.digest ?? defaultPreferences.digest,
                digestFrequency: storedPrefs.digestFrequency ?? defaultPreferences.digestFrequency,
                account_activity: storedPrefs.account_activity ?? defaultPreferences.account_activity,
                assignment_reminder: storedPrefs.assignment_reminder ?? defaultPreferences.assignment_reminder,
                grade_posted: storedPrefs.grade_posted ?? defaultPreferences.grade_posted,
            },
        };
    }
    async updateNotificationPreferences(userId, dto) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                emailNotificationsEnabled: true,
                notificationPreferences: true,
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const currentPrefs = user.notificationPreferences || {};
        const updatedPrefs = {
            ...currentPrefs,
            ...(dto.new_message !== undefined && { new_message: dto.new_message }),
            ...(dto.mention !== undefined && { mention: dto.mention }),
            ...(dto.digest !== undefined && { digest: dto.digest }),
            ...(dto.digestFrequency !== undefined && { digestFrequency: dto.digestFrequency }),
            ...(dto.account_activity !== undefined && { account_activity: dto.account_activity }),
            ...(dto.assignment_reminder !== undefined && { assignment_reminder: dto.assignment_reminder }),
            ...(dto.grade_posted !== undefined && { grade_posted: dto.grade_posted }),
        };
        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: {
                ...(dto.emailNotificationsEnabled !== undefined && {
                    emailNotificationsEnabled: dto.emailNotificationsEnabled,
                }),
                notificationPreferences: updatedPrefs,
            },
            select: {
                emailNotificationsEnabled: true,
                notificationPreferences: true,
            },
        });
        const storedPrefs = updated.notificationPreferences || {};
        return {
            emailNotificationsEnabled: updated.emailNotificationsEnabled,
            preferences: {
                new_message: storedPrefs.new_message ?? defaultPreferences.new_message,
                mention: storedPrefs.mention ?? defaultPreferences.mention,
                digest: storedPrefs.digest ?? defaultPreferences.digest,
                digestFrequency: storedPrefs.digestFrequency ?? defaultPreferences.digestFrequency,
                account_activity: storedPrefs.account_activity ?? defaultPreferences.account_activity,
                assignment_reminder: storedPrefs.assignment_reminder ?? defaultPreferences.assignment_reminder,
                grade_posted: storedPrefs.grade_posted ?? defaultPreferences.grade_posted,
            },
        };
    }
    async hasRelationship(userId, targetUserId) {
        if (userId === targetUserId)
            return true;
        const [user, targetUser] = await Promise.all([
            this.prisma.user.findUnique({
                where: { id: userId },
                include: { userRoles: { include: { role: true } } },
            }),
            this.prisma.user.findUnique({
                where: { id: targetUserId },
                include: { userRoles: { include: { role: true } } },
            }),
        ]);
        if (!user || !targetUser)
            return false;
        const userRoles = user.userRoles.map((ur) => ur.role.name);
        const targetRoles = targetUser.userRoles.map((ur) => ur.role.name);
        const isParentStudentRelation = await this.prisma.parentStudent.findFirst({
            where: {
                OR: [
                    { parentId: userId, studentId: targetUserId },
                    { parentId: targetUserId, studentId: userId },
                ],
            },
        });
        if (isParentStudentRelation)
            return true;
        const teacherStudentRelation = await this.prisma.classTeacher.findFirst({
            where: {
                teacherId: userId,
                class: {
                    enrollments: {
                        some: { studentId: targetUserId },
                    },
                },
            },
        });
        if (teacherStudentRelation)
            return true;
        const userEnrollments = await this.prisma.classEnrollment.findMany({
            where: { studentId: userId },
            select: { classId: true },
        });
        const targetEnrollments = await this.prisma.classEnrollment.findMany({
            where: { studentId: targetUserId },
            select: { classId: true },
        });
        const userClassIds = new Set(userEnrollments.map((e) => e.classId));
        const sharedEnrollment = targetEnrollments.some((e) => userClassIds.has(e.classId));
        if (sharedEnrollment)
            return true;
        const sharedChannel = await this.prisma.channelMember.findFirst({
            where: {
                userId: targetUserId,
                channel: {
                    members: {
                        some: { userId },
                    },
                },
            },
        });
        if (sharedChannel)
            return true;
        return false;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], UsersService);


/***/ }),
/* 39 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.NotificationPreferencesDto = void 0;
const class_validator_1 = __webpack_require__(23);
class NotificationPreferencesDto {
}
exports.NotificationPreferencesDto = NotificationPreferencesDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], NotificationPreferencesDto.prototype, "emailNotificationsEnabled", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], NotificationPreferencesDto.prototype, "new_message", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], NotificationPreferencesDto.prototype, "mention", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], NotificationPreferencesDto.prototype, "digest", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['daily', 'weekly', 'both', 'none']),
    __metadata("design:type", String)
], NotificationPreferencesDto.prototype, "digestFrequency", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], NotificationPreferencesDto.prototype, "account_activity", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], NotificationPreferencesDto.prototype, "assignment_reminder", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], NotificationPreferencesDto.prototype, "grade_posted", void 0);


/***/ }),
/* 40 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MessagingModule = void 0;
const common_1 = __webpack_require__(2);
const jwt_1 = __webpack_require__(13);
const config_1 = __webpack_require__(5);
const redis_module_1 = __webpack_require__(41);
const messaging_controller_1 = __webpack_require__(43);
const messaging_service_1 = __webpack_require__(44);
const messaging_gateway_1 = __webpack_require__(55);
const typing_service_1 = __webpack_require__(66);
const channel_management_controller_1 = __webpack_require__(69);
const channel_management_service_1 = __webpack_require__(70);
const messaging_enhanced_service_1 = __webpack_require__(71);
const notifications_module_1 = __webpack_require__(72);
const mentions_module_1 = __webpack_require__(77);
const handlers_1 = __webpack_require__(62);
let MessagingModule = class MessagingModule {
};
exports.MessagingModule = MessagingModule;
exports.MessagingModule = MessagingModule = __decorate([
    (0, common_1.Module)({
        imports: [
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => ({
                    secret: configService.get('JWT_SECRET'),
                }),
                inject: [config_1.ConfigService],
            }),
            redis_module_1.RedisModule,
            notifications_module_1.NotificationsModule,
            mentions_module_1.MentionsModule,
        ],
        controllers: [messaging_controller_1.MessagingController, channel_management_controller_1.ChannelManagementController],
        providers: [
            messaging_service_1.MessagingService,
            typing_service_1.TypingService,
            channel_management_service_1.ChannelManagementService,
            messaging_enhanced_service_1.MessagingEnhancedService,
            messaging_gateway_1.MessagingGateway,
            handlers_1.MessageHandler,
            handlers_1.ReactionHandler,
            handlers_1.TypingHandler,
            handlers_1.ChannelHandler,
        ],
        exports: [
            messaging_service_1.MessagingService,
            messaging_gateway_1.MessagingGateway,
            typing_service_1.TypingService,
            channel_management_service_1.ChannelManagementService,
            messaging_enhanced_service_1.MessagingEnhancedService,
            handlers_1.MessageHandler,
            handlers_1.ReactionHandler,
            handlers_1.TypingHandler,
            handlers_1.ChannelHandler,
        ],
    })
], MessagingModule);


/***/ }),
/* 41 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RedisModule = exports.REDIS_CLIENT = void 0;
const common_1 = __webpack_require__(2);
const config_1 = __webpack_require__(5);
const redis_1 = __webpack_require__(42);
exports.REDIS_CLIENT = 'REDIS_CLIENT';
let RedisModule = class RedisModule {
};
exports.RedisModule = RedisModule;
exports.RedisModule = RedisModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [config_1.ConfigModule],
        providers: [
            {
                provide: exports.REDIS_CLIENT,
                useFactory: async (configService) => {
                    const redisUrl = configService.get('REDIS_URL') || 'redis://localhost:6379';
                    const client = (0, redis_1.createClient)({
                        url: redisUrl,
                    });
                    await client.connect();
                    return client;
                },
                inject: [config_1.ConfigService],
            },
        ],
        exports: [exports.REDIS_CLIENT],
    })
], RedisModule);


/***/ }),
/* 42 */
/***/ ((module) => {

module.exports = require("redis");

/***/ }),
/* 43 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c, _d, _e, _f, _g, _h, _j;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MessagingController = void 0;
const common_1 = __webpack_require__(2);
const swagger_1 = __webpack_require__(3);
const messaging_service_1 = __webpack_require__(44);
const create_message_dto_1 = __webpack_require__(50);
const reaction_dto_1 = __webpack_require__(51);
const search_messages_dto_1 = __webpack_require__(52);
const report_channel_dto_1 = __webpack_require__(53);
const read_receipt_dto_1 = __webpack_require__(54);
const jwt_auth_guard_1 = __webpack_require__(29);
const roles_guard_1 = __webpack_require__(32);
const roles_decorator_1 = __webpack_require__(33);
let MessagingController = class MessagingController {
    constructor(messagingService) {
        this.messagingService = messagingService;
    }
    async createChannel(dto, req) {
        return this.messagingService.createChannel(dto, req.user.sub, req.user.roles);
    }
    async getUserChannels(req) {
        return this.messagingService.getUserChannels(req.user.sub);
    }
    async getMyChannels(req) {
        return this.messagingService.getUserChannelsWithUnread(req.user.sub);
    }
    async getChannel(id, req) {
        return this.messagingService.getChannel(id, req.user.sub);
    }
    async getChannelMembers(id, req) {
        return this.messagingService.getChannelMembers(id, req.user.sub);
    }
    async addMember(id, dto) {
        return this.messagingService.addMember(id, dto.userId, dto.role);
    }
    async removeMember(id, userId) {
        return this.messagingService.removeMember(id, userId);
    }
    async getMessages(id, req, cursor, limit) {
        return this.messagingService.getMessages(id, req.user.sub, cursor, limit ? parseInt(limit) : 50);
    }
    async markAsRead(id, req) {
        return this.messagingService.markChannelAsRead(id, req.user.sub);
    }
    async markMessageAsRead(messageId, req) {
        return this.messagingService.markMessageAsRead(messageId, req.user.sub);
    }
    async markMessagesAsRead(id, dto, req) {
        return this.messagingService.markMessagesAsRead(dto.messageIds, id, req.user.sub);
    }
    async getMessageReadReceipts(messageId, req) {
        return this.messagingService.getMessageReadReceipts(messageId, req.user.sub);
    }
    async getChannelReadStatus(id, req) {
        return this.messagingService.getChannelReadStatus(id, req.user.sub);
    }
    async getMessagesWithReadReceipts(id, req, cursor, limit) {
        return this.messagingService.getMessagesWithReadReceipts(id, req.user.sub, cursor, limit ? parseInt(limit) : 50);
    }
    async sendMessage(id, dto, req) {
        return this.messagingService.sendMessage(id, req.user.sub, dto);
    }
    async editMessage(messageId, content, req) {
        return this.messagingService.editMessage(messageId, req.user.sub, content);
    }
    async deleteMessage(messageId, req) {
        return this.messagingService.deleteMessage(messageId, req.user.sub, req.user.roles);
    }
    async addReaction(messageId, dto, req) {
        return this.messagingService.addReaction(messageId, req.user.sub, dto);
    }
    async removeReaction(messageId, reaction, req) {
        return this.messagingService.removeReaction(messageId, req.user.sub, reaction);
    }
    async getReactions(messageId, req) {
        return this.messagingService.getReactions(messageId, req.user.sub);
    }
    async getEditHistory(messageId, req) {
        return this.messagingService.getEditHistory(messageId, req.user.sub);
    }
    async searchMessages(id, dto, req) {
        return this.messagingService.searchMessages(id, req.user.sub, dto);
    }
    async reportChannel(id, dto, req) {
        return this.messagingService.reportChannel(id, req.user.sub, dto.reason);
    }
    async getChannelFullHistory(id, req) {
        return this.messagingService.getChannelFullHistory(id, req.user.sub);
    }
    async getAllReports(status, page, limit) {
        return this.messagingService.getAllReports(status, page ? parseInt(page) : 1, limit ? parseInt(limit) : 20);
    }
    async updateReportStatus(reportId, dto, req) {
        return this.messagingService.updateReportStatus(reportId, req.user.sub, dto);
    }
};
exports.MessagingController = MessagingController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof create_message_dto_1.CreateChannelDto !== "undefined" && create_message_dto_1.CreateChannelDto) === "function" ? _b : Object, Object]),
    __metadata("design:returntype", Promise)
], MessagingController.prototype, "createChannel", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MessagingController.prototype, "getUserChannels", null);
__decorate([
    (0, common_1.Get)('my'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MessagingController.prototype, "getMyChannels", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MessagingController.prototype, "getChannel", null);
__decorate([
    (0, common_1.Get)(':id/members'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MessagingController.prototype, "getChannelMembers", null);
__decorate([
    (0, common_1.Post)(':id/members'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_c = typeof create_message_dto_1.AddMemberDto !== "undefined" && create_message_dto_1.AddMemberDto) === "function" ? _c : Object]),
    __metadata("design:returntype", Promise)
], MessagingController.prototype, "addMember", null);
__decorate([
    (0, common_1.Delete)(':id/members/:userId'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MessagingController.prototype, "removeMember", null);
__decorate([
    (0, common_1.Get)(':id/messages'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Query)('cursor')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String, String]),
    __metadata("design:returntype", Promise)
], MessagingController.prototype, "getMessages", null);
__decorate([
    (0, common_1.Post)(':id/read'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MessagingController.prototype, "markAsRead", null);
__decorate([
    (0, common_1.Post)('messages/:messageId/read'),
    (0, swagger_1.ApiOperation)({ summary: 'Mark a specific message as read' }),
    __param(0, (0, common_1.Param)('messageId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MessagingController.prototype, "markMessageAsRead", null);
__decorate([
    (0, common_1.Post)(':id/messages/read'),
    (0, swagger_1.ApiOperation)({ summary: 'Mark multiple messages as read' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_d = typeof read_receipt_dto_1.MarkMessagesReadDto !== "undefined" && read_receipt_dto_1.MarkMessagesReadDto) === "function" ? _d : Object, Object]),
    __metadata("design:returntype", Promise)
], MessagingController.prototype, "markMessagesAsRead", null);
__decorate([
    (0, common_1.Get)('messages/:messageId/read-receipts'),
    (0, swagger_1.ApiOperation)({ summary: 'Get read receipts for a message' }),
    __param(0, (0, common_1.Param)('messageId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MessagingController.prototype, "getMessageReadReceipts", null);
__decorate([
    (0, common_1.Get)(':id/read-status'),
    (0, swagger_1.ApiOperation)({ summary: 'Get read status for messages in a channel' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MessagingController.prototype, "getChannelReadStatus", null);
__decorate([
    (0, common_1.Get)(':id/messages/with-receipts'),
    (0, swagger_1.ApiOperation)({ summary: 'Get messages with read receipts included' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Query)('cursor')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String, String]),
    __metadata("design:returntype", Promise)
], MessagingController.prototype, "getMessagesWithReadReceipts", null);
__decorate([
    (0, common_1.Post)(':id/messages'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_e = typeof create_message_dto_1.SendMessageDto !== "undefined" && create_message_dto_1.SendMessageDto) === "function" ? _e : Object, Object]),
    __metadata("design:returntype", Promise)
], MessagingController.prototype, "sendMessage", null);
__decorate([
    (0, common_1.Patch)('messages/:messageId'),
    __param(0, (0, common_1.Param)('messageId')),
    __param(1, (0, common_1.Body)('content')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], MessagingController.prototype, "editMessage", null);
__decorate([
    (0, common_1.Delete)('messages/:messageId'),
    __param(0, (0, common_1.Param)('messageId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MessagingController.prototype, "deleteMessage", null);
__decorate([
    (0, common_1.Post)('messages/:messageId/reactions'),
    __param(0, (0, common_1.Param)('messageId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_f = typeof reaction_dto_1.AddReactionDto !== "undefined" && reaction_dto_1.AddReactionDto) === "function" ? _f : Object, Object]),
    __metadata("design:returntype", Promise)
], MessagingController.prototype, "addReaction", null);
__decorate([
    (0, common_1.Delete)('messages/:messageId/reactions/:reaction'),
    __param(0, (0, common_1.Param)('messageId')),
    __param(1, (0, common_1.Param)('reaction')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], MessagingController.prototype, "removeReaction", null);
__decorate([
    (0, common_1.Get)('messages/:messageId/reactions'),
    __param(0, (0, common_1.Param)('messageId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MessagingController.prototype, "getReactions", null);
__decorate([
    (0, common_1.Get)('messages/:messageId/history'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('messageId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MessagingController.prototype, "getEditHistory", null);
__decorate([
    (0, common_1.Get)(':id/search'),
    (0, swagger_1.ApiOperation)({ summary: 'Search messages in a channel using full-text search' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_g = typeof search_messages_dto_1.SearchMessagesDto !== "undefined" && search_messages_dto_1.SearchMessagesDto) === "function" ? _g : Object, Object]),
    __metadata("design:returntype", Promise)
], MessagingController.prototype, "searchMessages", null);
__decorate([
    (0, common_1.Post)(':id/report'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_h = typeof report_channel_dto_1.ReportChannelDto !== "undefined" && report_channel_dto_1.ReportChannelDto) === "function" ? _h : Object, Object]),
    __metadata("design:returntype", Promise)
], MessagingController.prototype, "reportChannel", null);
__decorate([
    (0, common_1.Get)(':id/full-history'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MessagingController.prototype, "getChannelFullHistory", null);
__decorate([
    (0, common_1.Get)('admin/reports'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], MessagingController.prototype, "getAllReports", null);
__decorate([
    (0, common_1.Patch)('admin/reports/:reportId'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('reportId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_j = typeof report_channel_dto_1.UpdateReportStatusDto !== "undefined" && report_channel_dto_1.UpdateReportStatusDto) === "function" ? _j : Object, Object]),
    __metadata("design:returntype", Promise)
], MessagingController.prototype, "updateReportStatus", null);
exports.MessagingController = MessagingController = __decorate([
    (0, swagger_1.ApiTags)('Messaging'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('channels'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [typeof (_a = typeof messaging_service_1.MessagingService !== "undefined" && messaging_service_1.MessagingService) === "function" ? _a : Object])
], MessagingController);


/***/ }),
/* 44 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MessagingService_1;
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MessagingService = void 0;
const common_1 = __webpack_require__(2);
const prisma_service_1 = __webpack_require__(10);
const client_1 = __webpack_require__(11);
const audit_helper_1 = __webpack_require__(45);
const email_service_1 = __webpack_require__(46);
const mentions_service_1 = __webpack_require__(49);
const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;
let MessagingService = MessagingService_1 = class MessagingService {
    constructor(prisma, emailService, mentionsService) {
        this.prisma = prisma;
        this.emailService = emailService;
        this.mentionsService = mentionsService;
        this.logger = new common_1.Logger(MessagingService_1.name);
    }
    async createChannel(dto, userId, userRoles = []) {
        if (!userRoles.includes('admin')) {
            await this.validateMessagingRestrictions(userId, userRoles, dto.memberIds || []);
        }
        const channel = await this.prisma.channel.create({
            data: {
                type: dto.type,
                name: dto.name,
                classId: dto.classId,
                createdBy: userId,
                members: {
                    create: [
                        { userId, role: 'owner' },
                        ...(dto.memberIds || []).map((id) => ({
                            userId: id,
                            role: 'member',
                        })),
                    ],
                },
            },
            include: {
                members: {
                    include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
                },
            },
        });
        await (0, audit_helper_1.createAuditLog)(this.prisma, {
            action: audit_helper_1.AuditActions.CREATE_CHANNEL,
            channelId: channel.id,
            actorId: userId,
        });
        return channel;
    }
    async validateMessagingRestrictions(creatorId, creatorRoles, memberIds) {
        const isTeacher = creatorRoles.includes('teacher');
        const isStudent = creatorRoles.includes('student');
        const isParent = creatorRoles.includes('parent');
        for (const memberId of memberIds) {
            const member = await this.prisma.user.findUnique({
                where: { id: memberId },
                include: {
                    userRoles: { include: { role: true } },
                    enrollments: { select: { classId: true } },
                    parentOf: { select: { studentId: true } },
                    childOf: { select: { parentId: true, student: { select: { enrollments: { select: { classId: true } } } } } },
                },
            });
            if (!member)
                continue;
            const memberRoles = member.userRoles.map(ur => ur.role.name);
            const isMemberTeacher = memberRoles.includes('teacher');
            const isMemberStudent = memberRoles.includes('student');
            const isMemberParent = memberRoles.includes('parent');
            if (isTeacher) {
                const teacherClassAssignments = await this.prisma.classTeacher.findMany({
                    where: { teacherId: creatorId },
                    select: { classId: true },
                });
                const teacherClassIds = teacherClassAssignments.map(ca => ca.classId);
                const legacyClasses = await this.prisma.class.findMany({
                    where: { teacherId: creatorId },
                    select: { id: true },
                });
                legacyClasses.forEach(c => {
                    if (!teacherClassIds.includes(c.id)) {
                        teacherClassIds.push(c.id);
                    }
                });
                if (isMemberTeacher) {
                    const memberClassAssignments = await this.prisma.classTeacher.findMany({
                        where: { teacherId: memberId },
                        select: { classId: true },
                    });
                    const memberClassIds = memberClassAssignments.map(ca => ca.classId);
                    const hasCommonClass = teacherClassIds.some(id => memberClassIds.includes(id));
                    if (!hasCommonClass) {
                        throw new common_1.ForbiddenException(`Cannot message teacher ${member.firstName} ${member.lastName} - not assigned to the same class`);
                    }
                    continue;
                }
                if (isMemberStudent) {
                    const studentClassIds = member.enrollments.map(e => e.classId);
                    const hasCommonClass = teacherClassIds.some(id => studentClassIds.includes(id));
                    if (!hasCommonClass) {
                        throw new common_1.ForbiddenException(`Cannot message student ${member.firstName} ${member.lastName} - not enrolled in your class`);
                    }
                    continue;
                }
                if (isMemberParent) {
                    const children = await this.prisma.parentStudent.findMany({
                        where: { parentId: memberId },
                        select: {
                            student: {
                                select: {
                                    enrollments: { select: { classId: true } },
                                },
                            },
                        },
                    });
                    const childClassIds = children.flatMap(c => c.student.enrollments.map(e => e.classId));
                    const hasCommonClass = teacherClassIds.some(id => childClassIds.includes(id));
                    if (!hasCommonClass) {
                        throw new common_1.ForbiddenException(`Cannot message parent ${member.firstName} ${member.lastName} - their child is not enrolled in your class`);
                    }
                    continue;
                }
            }
            if (isStudent) {
                const studentClassIds = await this.prisma.classEnrollment.findMany({
                    where: { studentId: creatorId },
                    select: { classId: true },
                });
                const studentClasses = studentClassIds.map(e => e.classId);
                if (isMemberTeacher) {
                    const teacherClassAssignments = await this.prisma.classTeacher.findMany({
                        where: { teacherId: memberId },
                        select: { classId: true },
                    });
                    const teacherClassIds = teacherClassAssignments.map(ca => ca.classId);
                    const hasCommonClass = studentClasses.some(id => teacherClassIds.includes(id));
                    if (!hasCommonClass) {
                        throw new common_1.ForbiddenException(`Cannot message teacher ${member.firstName} ${member.lastName} - not assigned to your class`);
                    }
                    continue;
                }
                if (isMemberStudent) {
                    const memberClassIds = member.enrollments.map(e => e.classId);
                    const hasCommonClass = studentClasses.some(id => memberClassIds.includes(id));
                    if (!hasCommonClass) {
                        throw new common_1.ForbiddenException(`Cannot message student ${member.firstName} ${member.lastName} - not in the same class`);
                    }
                    continue;
                }
                if (isMemberParent) {
                    const parentChildren = await this.prisma.parentStudent.findMany({
                        where: { parentId: memberId },
                        select: { studentId: true },
                    });
                    const childIds = parentChildren.map(pc => pc.studentId);
                    const childEnrollments = await this.prisma.classEnrollment.findMany({
                        where: {
                            studentId: { in: childIds },
                            classId: { in: studentClasses }
                        },
                    });
                    if (childEnrollments.length === 0) {
                        throw new common_1.ForbiddenException(`Cannot message parent ${member.firstName} ${member.lastName} - not related to your class`);
                    }
                    continue;
                }
            }
            if (isParent) {
                const parentChildren = await this.prisma.parentStudent.findMany({
                    where: { parentId: creatorId },
                    select: { studentId: true },
                });
                const childIds = parentChildren.map(pc => pc.studentId);
                const childEnrollments = await this.prisma.classEnrollment.findMany({
                    where: { studentId: { in: childIds } },
                    select: { classId: true },
                });
                const parentChildClasses = childEnrollments.map(e => e.classId);
                if (isMemberTeacher) {
                    const teacherClassAssignments = await this.prisma.classTeacher.findMany({
                        where: { teacherId: memberId },
                        select: { classId: true },
                    });
                    const teacherClassIds = teacherClassAssignments.map(ca => ca.classId);
                    const hasCommonClass = parentChildClasses.some(id => teacherClassIds.includes(id));
                    if (!hasCommonClass) {
                        throw new common_1.ForbiddenException(`Cannot message teacher ${member.firstName} ${member.lastName} - not assigned to your child's class`);
                    }
                    continue;
                }
                if (isMemberParent) {
                    const otherParentChildren = await this.prisma.parentStudent.findMany({
                        where: { parentId: memberId },
                        select: { studentId: true },
                    });
                    const otherChildIds = otherParentChildren.map(pc => pc.studentId);
                    const otherChildEnrollments = await this.prisma.classEnrollment.findMany({
                        where: {
                            studentId: { in: otherChildIds },
                            classId: { in: parentChildClasses }
                        },
                    });
                    if (otherChildEnrollments.length === 0) {
                        throw new common_1.ForbiddenException(`Cannot message parent ${member.firstName} ${member.lastName} - your children are not in the same class`);
                    }
                    continue;
                }
                if (isMemberStudent) {
                    const memberClassIds = member.enrollments.map(e => e.classId);
                    const hasCommonClass = parentChildClasses.some(id => memberClassIds.includes(id));
                    if (!hasCommonClass) {
                        throw new common_1.ForbiddenException(`Cannot message student ${member.firstName} ${member.lastName} - not in your child's class`);
                    }
                    continue;
                }
            }
        }
    }
    async getUserChannels(userId) {
        const channels = await this.prisma.channel.findMany({
            where: {
                isArchived: false,
                deletedAt: null,
                members: { some: { userId, isBanned: false } },
            },
            include: {
                members: {
                    include: {
                        user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
                    },
                },
                messages: {
                    take: 1,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        sender: { select: { id: true, firstName: true, lastName: true } },
                    },
                },
            },
            orderBy: { updatedAt: 'desc' },
            take: 100,
        });
        return channels.map((ch) => ({
            ...ch,
            lastMessage: ch.messages[0] || null,
            messages: undefined,
        }));
    }
    async getUserChannelsWithUnread(userId) {
        const memberships = await this.prisma.channelMember.findMany({
            where: {
                userId,
                isBanned: false,
                channel: {
                    isArchived: false,
                    deletedAt: null,
                },
            },
            include: {
                channel: {
                    include: {
                        members: {
                            include: {
                                user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
                            },
                        },
                        messages: {
                            take: 1,
                            orderBy: { createdAt: 'desc' },
                            include: {
                                sender: { select: { id: true, firstName: true, lastName: true } },
                            },
                        },
                    },
                },
            },
            orderBy: { channel: { updatedAt: 'desc' } },
            take: 100,
        });
        const channelsWithUnread = await Promise.all(memberships.map(async (membership) => {
            const { channel, lastReadAt } = membership;
            let unreadCount = 0;
            if (lastReadAt) {
                unreadCount = await this.prisma.message.count({
                    where: {
                        channelId: channel.id,
                        createdAt: { gt: lastReadAt },
                        senderId: { not: userId },
                        isDeleted: false,
                    },
                });
            }
            else {
                unreadCount = await this.prisma.message.count({
                    where: {
                        channelId: channel.id,
                        senderId: { not: userId },
                        isDeleted: false,
                    },
                });
            }
            return {
                ...channel,
                lastMessage: channel.messages[0] || null,
                messages: undefined,
                unreadCount,
                membership: {
                    role: membership.role,
                    joinedAt: membership.joinedAt,
                    lastReadAt: membership.lastReadAt,
                },
            };
        }));
        return channelsWithUnread;
    }
    async getUserChannelsWithUnreadOptimized(userId) {
        const result = await this.prisma.$queryRaw `
            WITH user_memberships AS (
                SELECT 
                    cm.channel_id,
                    cm.role,
                    cm.joined_at as "joinedAt",
                    cm.last_read_at as "lastReadAt",
                    c.id as cid,
                    c.name,
                    c.type,
                    c.description,
                    c.is_archived as "isArchived",
                    c.created_by as "createdBy",
                    c.created_at as "createdAt",
                    c.updated_at as "updatedAt"
                FROM channel_members cm
                JOIN channels c ON cm.channel_id = c.id
                WHERE cm.user_id = ${userId} 
                  AND cm.is_banned = false
                  AND c.is_archived = false 
                  AND c.deleted_at IS NULL
            ),
            last_messages AS (
                SELECT DISTINCT ON (m.channel_id)
                    m.channel_id,
                    m.id,
                    m.content,
                    m.content_type as "contentType",
                    m.created_at as "createdAt",
                    m.sender_id as "senderId",
                    u.first_name as "senderFirstName",
                    u.last_name as "senderLastName"
                FROM messages m
                JOIN users u ON m.sender_id = u.id
                WHERE m.channel_id IN (SELECT channel_id FROM user_memberships)
                  AND m.is_deleted = false
                ORDER BY m.channel_id, m.created_at DESC
            ),
            unread_counts AS (
                SELECT 
                    um.channel_id,
                    COALESCE(COUNT(m.id)::int, 0) as "unreadCount"
                FROM user_memberships um
                LEFT JOIN messages m ON 
                    m.channel_id = um.channel_id
                    AND m.is_deleted = false
                    AND (um.last_read_at IS NULL OR m.created_at > um.last_read_at)
                    AND m.sender_id != ${userId}
                GROUP BY um.channel_id
            )
            SELECT 
                um.cid as "id",
                um.name,
                um.type,
                um.description,
                um."isArchived",
                um."createdBy",
                um."createdAt",
                um."updatedAt",
                um.role,
                um."joinedAt",
                um."lastReadAt",
                COALESCE(uc."unreadCount", 0) as "unreadCount",
                CASE 
                    WHEN lm.id IS NOT NULL THEN jsonb_build_object(
                        'id', lm.id,
                        'content', lm.content,
                        'contentType', lm."contentType",
                        'createdAt', lm."createdAt",
                        'sender', jsonb_build_object(
                            'id', lm."senderId",
                            'firstName', lm."senderFirstName",
                            'lastName', lm."senderLastName"
                        )
                    )
                    ELSE null
                END as "lastMessage"
            FROM user_memberships um
            LEFT JOIN unread_counts uc ON uc.channel_id = um.channel_id
            LEFT JOIN last_messages lm ON lm.channel_id = um.channel_id
            ORDER BY um."updatedAt" DESC
            LIMIT 100
        `;
        return result;
    }
    async markChannelAsRead(channelId, userId) {
        const member = await this.prisma.channelMember.findUnique({
            where: { channelId_userId: { channelId, userId } },
        });
        if (!member)
            throw new common_1.ForbiddenException('Not a member of this channel');
        if (member.isBanned)
            throw new common_1.ForbiddenException('You are banned from this channel');
        await this.prisma.channelMember.update({
            where: { channelId_userId: { channelId, userId } },
            data: { lastReadAt: new Date() },
        });
        return { success: true, channelId };
    }
    async getChannel(channelId, userId, includeDeleted = false) {
        const where = { id: channelId };
        if (!includeDeleted) {
            where.deletedAt = null;
        }
        const channel = await this.prisma.channel.findFirst({
            where,
            include: {
                members: {
                    include: {
                        user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, email: true } },
                    },
                },
            },
        });
        if (!channel)
            throw new common_1.NotFoundException('Channel not found');
        const isMember = channel.members.some((m) => m.userId === userId);
        if (!isMember)
            throw new common_1.ForbiddenException('Not a member of this channel');
        return channel;
    }
    async getChannelMembers(channelId, userId) {
        const member = await this.prisma.channelMember.findUnique({
            where: { channelId_userId: { channelId, userId } },
        });
        if (!member)
            throw new common_1.ForbiddenException('Not a member of this channel');
        return this.prisma.channelMember.findMany({
            where: { channelId, isBanned: false },
            include: {
                user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, email: true } },
            },
        });
    }
    async addMember(channelId, userId, role = 'member') {
        return this.prisma.channelMember.create({
            data: { channelId, userId, role },
            include: {
                user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
            },
        });
    }
    async removeMember(channelId, userId) {
        return this.prisma.channelMember.delete({
            where: { channelId_userId: { channelId, userId } },
        });
    }
    async getMessages(channelId, userId, cursor, limit = DEFAULT_PAGE_SIZE) {
        const pageSize = Math.min(Math.max(1, limit), MAX_PAGE_SIZE);
        const member = await this.prisma.channelMember.findUnique({
            where: { channelId_userId: { channelId, userId } },
        });
        if (!member)
            throw new common_1.ForbiddenException('Not a member of this channel');
        if (member.isBanned)
            throw new common_1.ForbiddenException('You are banned from this channel');
        const messages = await this.prisma.message.findMany({
            where: {
                channelId,
                isDeleted: false,
            },
            take: pageSize,
            ...(cursor
                ? {
                    skip: 1,
                    cursor: { id: cursor },
                }
                : {}),
            orderBy: { createdAt: 'desc' },
            include: {
                sender: {
                    select: { id: true, firstName: true, lastName: true, avatarUrl: true },
                },
                parent: {
                    select: {
                        id: true,
                        content: true,
                        sender: { select: { id: true, firstName: true, lastName: true } },
                    },
                },
                reactions: {
                    include: {
                        user: {
                            select: { id: true, firstName: true, lastName: true, avatarUrl: true },
                        },
                    },
                },
            },
        });
        return {
            messages: messages.reverse(),
            nextCursor: messages.length === pageSize ? messages[0]?.id : null,
        };
    }
    async sendMessage(channelId, userId, dto) {
        const message = await this.prisma.$transaction(async (tx) => {
            const member = await tx.channelMember.findUnique({
                where: { channelId_userId: { channelId, userId } },
            });
            if (!member)
                throw new common_1.ForbiddenException('Not a member of this channel');
            if (member.isBanned)
                throw new common_1.ForbiddenException('You are banned from this channel');
            if (member.isMuted)
                throw new common_1.ForbiddenException('You are muted in this channel');
            const msg = await tx.message.create({
                data: {
                    channelId,
                    senderId: userId,
                    content: dto.content,
                    replyTo: dto.replyTo,
                },
                include: {
                    sender: {
                        select: { id: true, firstName: true, lastName: true, avatarUrl: true },
                    },
                    parent: {
                        select: {
                            id: true,
                            content: true,
                            sender: { select: { id: true, firstName: true, lastName: true } },
                        },
                    },
                    reactions: {
                        include: {
                            user: {
                                select: { id: true, firstName: true, lastName: true, avatarUrl: true },
                            },
                        },
                    },
                },
            });
            await tx.channel.update({
                where: { id: channelId },
                data: { updatedAt: new Date() },
            });
            return msg;
        }, {
            isolationLevel: 'Serializable',
        });
        (0, audit_helper_1.createAuditLog)(this.prisma, {
            action: audit_helper_1.AuditActions.SEND_MESSAGE,
            messageId: message.id,
            channelId,
            actorId: userId,
        });
        this.queueMessageNotifications(message, channelId, userId).catch(err => {
            this.logger.error('Failed to queue message notifications:', err);
        });
        return message;
    }
    async queueMessageNotifications(message, channelId, senderId) {
        try {
            const channel = await this.prisma.channel.findUnique({
                where: { id: channelId },
                select: { name: true },
            });
            if (!channel)
                return;
            const members = await this.prisma.channelMember.findMany({
                where: {
                    channelId,
                    userId: { not: senderId },
                    isBanned: false,
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            firstName: true,
                            lastName: true,
                            emailNotificationsEnabled: true,
                            notificationPreferences: true,
                        },
                    },
                },
            });
            const senderName = this.sanitizeForEmail(`${message.sender.firstName} ${message.sender.lastName}`);
            const channelName = this.sanitizeForEmail(channel.name || 'Unnamed Channel');
            const sanitizedContent = this.sanitizeForEmail(message.content);
            for (const member of members) {
                if (!member.user.emailNotificationsEnabled)
                    continue;
                const prefs = member.user.notificationPreferences || {};
                if (prefs.new_message !== false) {
                    const digestEnabled = prefs.digest !== false;
                    if (!digestEnabled) {
                        await this.emailService.queueEmail({
                            to: member.user.email,
                            subject: `New message from ${senderName} in ${channelName}`,
                            html: 'pending',
                            priority: 'normal',
                            metadata: {
                                type: 'new_message',
                                messageId: message.id,
                                senderName,
                                channelName,
                                messageContent: sanitizedContent,
                            },
                        });
                    }
                }
            }
        }
        catch (error) {
            this.logger.error('Error queueing message notifications:', error);
        }
    }
    sanitizeForEmail(content) {
        if (!content)
            return '';
        return content
            .replace(/[\r\n]/g, ' ')
            .replace(/[<>]/g, '')
            .substring(0, 500);
    }
    async editMessage(messageId, userId, content) {
        const message = await this.prisma.message.findUnique({ where: { id: messageId } });
        if (!message)
            throw new common_1.NotFoundException('Message not found');
        if (message.senderId !== userId)
            throw new common_1.ForbiddenException('Cannot edit another user\'s message');
        if (message.isDeleted)
            throw new common_1.BadRequestException('Cannot edit a deleted message');
        await this.trackEditHistory(messageId, message.content, userId);
        const updated = await this.prisma.message.update({
            where: { id: messageId },
            data: { content, editedAt: new Date() },
            include: {
                sender: {
                    select: { id: true, firstName: true, lastName: true, avatarUrl: true },
                },
                reactions: {
                    include: {
                        user: {
                            select: { id: true, firstName: true, lastName: true, avatarUrl: true },
                        },
                    },
                },
            },
        });
        (0, audit_helper_1.createAuditLog)(this.prisma, {
            action: audit_helper_1.AuditActions.EDIT_MESSAGE,
            messageId,
            channelId: message.channelId,
            actorId: userId,
        });
        return updated;
    }
    async deleteMessage(messageId, userId, roles, softDelete = true) {
        const message = await this.prisma.message.findUnique({ where: { id: messageId } });
        if (!message)
            throw new common_1.NotFoundException('Message not found');
        if (message.isDeleted)
            throw new common_1.BadRequestException('Message is already deleted');
        const isAdmin = roles.includes('admin');
        if (message.senderId !== userId && !isAdmin) {
            throw new common_1.ForbiddenException('Cannot delete another user\'s message');
        }
        if (softDelete) {
            await this.prisma.message.update({
                where: { id: messageId },
                data: {
                    isDeleted: true,
                    deletedAt: new Date(),
                    deletedBy: userId,
                },
            });
        }
        else {
            await this.mentionsService.deleteMessageMentions(messageId);
            await this.prisma.message.delete({ where: { id: messageId } });
        }
        (0, audit_helper_1.createAuditLog)(this.prisma, {
            action: audit_helper_1.AuditActions.DELETE_MESSAGE,
            messageId,
            channelId: message.channelId,
            actorId: userId,
            metadata: { softDelete },
        });
        return { deleted: true, softDelete };
    }
    async searchMessages(channelId, userId, dto) {
        const membership = await this.prisma.channelMember.findUnique({
            where: { channelId_userId: { channelId, userId } },
        });
        if (!membership) {
            throw new common_1.ForbiddenException('You do not have access to this channel');
        }
        const page = Math.max(1, dto.page || 1);
        const limit = Math.min(100, Math.max(1, dto.limit || 20));
        const skip = (page - 1) * limit;
        const searchQuery = dto.q.trim().substring(0, 200);
        if (dto.sender && !this.isValidUUID(dto.sender)) {
            throw new common_1.BadRequestException('Invalid sender ID format');
        }
        const countQuery = this.buildSearchCountQuery(channelId, searchQuery, dto);
        const searchSqlQuery = this.buildSearchQuery(channelId, searchQuery, dto, limit, skip);
        const [countResult, messagesResult] = await Promise.all([
            this.prisma.$queryRaw(countQuery),
            this.prisma.$queryRaw(searchSqlQuery),
        ]);
        const total = countResult[0]?.total || 0;
        const totalPages = Math.ceil(total / limit);
        const messages = messagesResult.map((row) => ({
            id: row.id,
            channelId: row.channelId,
            senderId: row.senderId,
            content: row.content,
            contentType: row.contentType,
            replyTo: row.replyTo,
            isDeleted: row.isDeleted,
            editedAt: row.editedAt,
            createdAt: row.createdAt,
            sender: {
                id: row.senderId,
                firstName: row.senderFirstName,
                lastName: row.senderLastName,
                avatarUrl: row.senderAvatarUrl,
            },
            highlights: this.parseHighlights(row.headline),
            rank: Number(row.rank),
        }));
        return {
            messages,
            meta: {
                total,
                page,
                limit,
                totalPages,
                query: searchQuery,
            },
        };
    }
    parseHighlights(headline) {
        if (!headline)
            return [];
        return headline
            .split('...')
            .map((fragment) => fragment.trim())
            .filter((fragment) => fragment.length > 0);
    }
    async reportChannel(channelId, userId, reason) {
        const membership = await this.prisma.channelMember.findUnique({
            where: { channelId_userId: { channelId, userId } },
        });
        if (!membership)
            throw new common_1.ForbiddenException('Not a member of this channel');
        const existingReport = await this.prisma.channelReport.findFirst({
            where: { channelId, reportedBy: userId, status: { in: ['pending', 'investigating'] } },
        });
        if (existingReport) {
            throw new common_1.BadRequestException('You have already reported this channel');
        }
        const report = await this.prisma.channelReport.create({
            data: {
                channelId,
                reportedBy: userId,
                reason,
                status: 'pending',
            },
            include: {
                channel: true,
                reporter: { select: { id: true, firstName: true, lastName: true, email: true } },
            },
        });
        return report;
    }
    async getChannelFullHistory(channelId, adminId) {
        const admin = await this.prisma.userRole.findFirst({
            where: { userId: adminId, role: { name: 'admin' } },
        });
        if (!admin)
            throw new common_1.ForbiddenException('Admin access required');
        const messages = await this.prisma.message.findMany({
            where: { channelId },
            orderBy: { createdAt: 'asc' },
            include: {
                sender: {
                    select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
                },
                parent: {
                    select: {
                        id: true,
                        content: true,
                        isDeleted: true,
                        sender: { select: { id: true, firstName: true, lastName: true } },
                    },
                },
                attachments: true,
                reactions: {
                    include: {
                        user: {
                            select: { id: true, firstName: true, lastName: true, avatarUrl: true },
                        },
                    },
                },
            },
        });
        const channel = await this.prisma.channel.findUnique({
            where: { id: channelId },
            include: {
                members: {
                    include: {
                        user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
                    },
                },
                creator: { select: { id: true, firstName: true, lastName: true, email: true } },
            },
        });
        const reports = await this.prisma.channelReport.findMany({
            where: { channelId },
            include: {
                reporter: { select: { id: true, firstName: true, lastName: true, email: true } },
                assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        return {
            channel,
            messages,
            reports,
            totalMessages: messages.length,
            deletedMessages: messages.filter(m => m.isDeleted).length,
            editedMessages: messages.filter(m => m.editedAt).length,
        };
    }
    async getAllReports(status, page = 1, limit = 20) {
        const where = status && status !== 'all' ? { status } : {};
        const [reports, total] = await Promise.all([
            this.prisma.channelReport.findMany({
                where,
                include: {
                    channel: {
                        select: { id: true, name: true, type: true, createdAt: true },
                    },
                    reporter: { select: { id: true, firstName: true, lastName: true, email: true } },
                    assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.channelReport.count({ where }),
        ]);
        return {
            reports,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async updateReportStatus(reportId, adminId, dto) {
        const report = await this.prisma.channelReport.findUnique({
            where: { id: reportId },
        });
        if (!report)
            throw new common_1.NotFoundException('Report not found');
        const updated = await this.prisma.channelReport.update({
            where: { id: reportId },
            data: {
                status: dto.status,
                assignedTo: dto.status === 'investigating' ? adminId : report.assignedTo,
                resolution: dto.resolution,
                resolvedAt: dto.status === 'resolved' || dto.status === 'dismissed' ? new Date() : report.resolvedAt,
            },
            include: {
                channel: { select: { id: true, name: true, type: true } },
                reporter: { select: { id: true, firstName: true, lastName: true, email: true } },
                assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
            },
        });
        return updated;
    }
    async addReaction(messageId, userId, dto) {
        const message = await this.prisma.message.findUnique({
            where: { id: messageId },
            include: { channel: true },
        });
        if (!message)
            throw new common_1.NotFoundException('Message not found');
        if (message.isDeleted)
            throw new common_1.BadRequestException('Cannot react to a deleted message');
        const member = await this.prisma.channelMember.findUnique({
            where: { channelId_userId: { channelId: message.channelId, userId } },
        });
        if (!member)
            throw new common_1.ForbiddenException('Not a member of this channel');
        if (member.isBanned)
            throw new common_1.ForbiddenException('You are banned from this channel');
        const reaction = await this.prisma.reaction.upsert({
            where: {
                messageId_userId_reaction: {
                    messageId,
                    userId,
                    reaction: dto.reaction,
                },
            },
            update: {},
            create: {
                messageId,
                userId,
                reaction: dto.reaction,
            },
            include: {
                user: {
                    select: { id: true, firstName: true, lastName: true, avatarUrl: true },
                },
            },
        });
        (0, audit_helper_1.createAuditLog)(this.prisma, {
            action: audit_helper_1.AuditActions.ADD_REACTION,
            messageId,
            channelId: message.channelId,
            actorId: userId,
            metadata: { reaction: dto.reaction },
        });
        return reaction;
    }
    async removeReaction(messageId, userId, reaction) {
        const message = await this.prisma.message.findUnique({
            where: { id: messageId },
            include: { channel: true },
        });
        if (!message)
            throw new common_1.NotFoundException('Message not found');
        const existingReaction = await this.prisma.reaction.findUnique({
            where: {
                messageId_userId_reaction: {
                    messageId,
                    userId,
                    reaction,
                },
            },
        });
        if (!existingReaction) {
            throw new common_1.NotFoundException('Reaction not found');
        }
        await this.prisma.reaction.delete({
            where: {
                messageId_userId_reaction: {
                    messageId,
                    userId,
                    reaction,
                },
            },
        });
        (0, audit_helper_1.createAuditLog)(this.prisma, {
            action: audit_helper_1.AuditActions.REMOVE_REACTION,
            messageId,
            channelId: message.channelId,
            actorId: userId,
            metadata: { reaction },
        });
        return { removed: true, reaction };
    }
    async getReactions(messageId, userId) {
        const message = await this.prisma.message.findUnique({
            where: { id: messageId },
            include: { channel: true },
        });
        if (!message)
            throw new common_1.NotFoundException('Message not found');
        const member = await this.prisma.channelMember.findUnique({
            where: { channelId_userId: { channelId: message.channelId, userId } },
        });
        if (!member)
            throw new common_1.ForbiddenException('Not a member of this channel');
        const reactions = await this.prisma.reaction.findMany({
            where: { messageId },
            include: {
                user: {
                    select: { id: true, firstName: true, lastName: true, avatarUrl: true },
                },
            },
            orderBy: { createdAt: 'asc' },
        });
        const groupedReactions = reactions.reduce((acc, r) => {
            if (!acc[r.reaction]) {
                acc[r.reaction] = {
                    reaction: r.reaction,
                    count: 0,
                    users: [],
                };
            }
            acc[r.reaction].count++;
            acc[r.reaction].users.push(r.user);
            return acc;
        }, {});
        return {
            messageId,
            reactions: Object.values(groupedReactions),
            total: reactions.length,
        };
    }
    async trackEditHistory(messageId, previousContent, editedBy) {
        await this.prisma.editHistory.create({
            data: {
                messageId,
                previousContent,
                editedBy,
            },
        });
    }
    async getEditHistory(messageId, adminId) {
        const admin = await this.prisma.userRole.findFirst({
            where: { userId: adminId, role: { name: 'admin' } },
        });
        if (!admin)
            throw new common_1.ForbiddenException('Admin access required');
        const message = await this.prisma.message.findUnique({
            where: { id: messageId },
        });
        if (!message)
            throw new common_1.NotFoundException('Message not found');
        const history = await this.prisma.editHistory.findMany({
            where: { messageId },
            include: {
                editor: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
            },
            orderBy: { editedAt: 'asc' },
        });
        return {
            messageId,
            currentContent: message.content,
            history: history.map((h) => ({
                id: h.id,
                previousContent: h.previousContent,
                editedBy: h.editedBy,
                editedAt: h.editedAt,
                editor: h.editor,
            })),
            totalEdits: history.length,
        };
    }
    async markMessageAsRead(messageId, userId) {
        const message = await this.prisma.message.findUnique({
            where: { id: messageId },
            include: { channel: true },
        });
        if (!message)
            throw new common_1.NotFoundException('Message not found');
        if (message.isDeleted)
            throw new common_1.BadRequestException('Cannot read a deleted message');
        const membership = await this.prisma.channelMember.findUnique({
            where: { channelId_userId: { channelId: message.channelId, userId } },
        });
        if (!membership)
            throw new common_1.ForbiddenException('Not a member of this channel');
        if (membership.isBanned)
            throw new common_1.ForbiddenException('You are banned from this channel');
        if (message.senderId === userId) {
            return this.getMessageReadReceipts(messageId, userId);
        }
        await this.prisma.messageRead.upsert({
            where: {
                messageId_userId: { messageId, userId },
            },
            update: {
                readAt: new Date(),
            },
            create: {
                messageId,
                userId,
                readAt: new Date(),
            },
        });
        await this.prisma.channelMember.update({
            where: { channelId_userId: { channelId: message.channelId, userId } },
            data: { lastReadAt: new Date() },
        });
        return this.getMessageReadReceipts(messageId, userId);
    }
    async markMessagesAsRead(messageIds, channelId, userId) {
        const membership = await this.prisma.channelMember.findUnique({
            where: { channelId_userId: { channelId, userId } },
        });
        if (!membership)
            throw new common_1.ForbiddenException('Not a member of this channel');
        if (membership.isBanned)
            throw new common_1.ForbiddenException('You are banned from this channel');
        const messages = await this.prisma.message.findMany({
            where: {
                id: { in: messageIds },
                channelId,
                isDeleted: false,
                senderId: { not: userId },
            },
            select: { id: true },
        });
        const validMessageIds = messages.map(m => m.id);
        if (validMessageIds.length === 0) {
            return { readCount: 0, channelId };
        }
        const now = new Date();
        await this.prisma.$transaction(async (tx) => {
            for (const messageId of validMessageIds) {
                await tx.messageRead.upsert({
                    where: {
                        messageId_userId: { messageId, userId },
                    },
                    update: {
                        readAt: now,
                    },
                    create: {
                        messageId,
                        userId,
                        readAt: now,
                    },
                });
            }
            await tx.channelMember.update({
                where: { channelId_userId: { channelId, userId } },
                data: { lastReadAt: now },
            });
        });
        return { readCount: validMessageIds.length, channelId };
    }
    async getMessageReadReceipts(messageId, requestingUserId) {
        const message = await this.prisma.message.findUnique({
            where: { id: messageId },
            include: { channel: true },
        });
        if (!message)
            throw new common_1.NotFoundException('Message not found');
        const membership = await this.prisma.channelMember.findUnique({
            where: { channelId_userId: { channelId: message.channelId, userId: requestingUserId } },
        });
        if (!membership)
            throw new common_1.ForbiddenException('Not a member of this channel');
        const readReceipts = await this.prisma.messageRead.findMany({
            where: { messageId },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatarUrl: true,
                    },
                },
            },
            orderBy: { readAt: 'asc' },
        });
        const totalMembers = await this.prisma.channelMember.count({
            where: {
                channelId: message.channelId,
                isBanned: false,
                userId: { not: message.senderId },
            },
        });
        return {
            messageId,
            channelId: message.channelId,
            readBy: readReceipts.map(r => ({
                userId: r.user.id,
                firstName: r.user.firstName,
                lastName: r.user.lastName,
                avatarUrl: r.user.avatarUrl,
                readAt: r.readAt,
            })),
            readCount: readReceipts.length,
            totalMembers,
        };
    }
    async getChannelReadStatus(channelId, userId) {
        const membership = await this.prisma.channelMember.findUnique({
            where: { channelId_userId: { channelId, userId } },
        });
        if (!membership)
            throw new common_1.ForbiddenException('Not a member of this channel');
        const messages = await this.prisma.message.findMany({
            where: {
                channelId,
                isDeleted: false,
                senderId: { not: userId },
            },
            select: {
                id: true,
                reads: {
                    where: { userId },
                    select: { userId: true },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
        const messageStatuses = messages.map(m => ({
            messageId: m.id,
            readBy: m.reads.map(r => r.userId),
            readCount: m.reads.length,
        }));
        const unreadCount = messageStatuses.filter(m => m.readBy.length === 0).length;
        return {
            channelId,
            messages: messageStatuses,
            unreadCount,
        };
    }
    async getMessagesWithReadReceipts(channelId, userId, cursor, limit = DEFAULT_PAGE_SIZE) {
        const pageSize = Math.min(Math.max(1, limit), MAX_PAGE_SIZE);
        const member = await this.prisma.channelMember.findUnique({
            where: { channelId_userId: { channelId, userId } },
        });
        if (!member)
            throw new common_1.ForbiddenException('Not a member of this channel');
        if (member.isBanned)
            throw new common_1.ForbiddenException('You are banned from this channel');
        const messages = await this.prisma.message.findMany({
            where: {
                channelId,
                isDeleted: false,
            },
            take: pageSize,
            ...(cursor
                ? {
                    skip: 1,
                    cursor: { id: cursor },
                }
                : {}),
            orderBy: { createdAt: 'desc' },
            include: {
                sender: {
                    select: { id: true, firstName: true, lastName: true, avatarUrl: true },
                },
                parent: {
                    select: {
                        id: true,
                        content: true,
                        sender: { select: { id: true, firstName: true, lastName: true } },
                    },
                },
                reads: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                avatarUrl: true,
                            },
                        },
                    },
                    orderBy: { readAt: 'asc' },
                },
            },
        });
        return {
            messages: messages.reverse().map(msg => ({
                ...msg,
                readBy: msg.reads.map(r => ({
                    userId: r.user.id,
                    firstName: r.user.firstName,
                    lastName: r.user.lastName,
                    avatarUrl: r.user.avatarUrl,
                    readAt: r.readAt,
                })),
                reads: undefined,
            })),
            nextCursor: messages.length === pageSize ? messages[0]?.id : null,
        };
    }
    async startTyping(channelId, userId) {
        const membership = await this.prisma.channelMember.findUnique({
            where: { channelId_userId: { channelId, userId } },
        });
        if (!membership || membership.isBanned || membership.isMuted) {
            return;
        }
        const expiresAt = new Date(Date.now() + 5000);
        try {
            await this.prisma.typingIndicator.upsert({
                where: {
                    channelId_userId: { channelId, userId },
                },
                update: {
                    startedAt: new Date(),
                    expiresAt,
                },
                create: {
                    channelId,
                    userId,
                    startedAt: new Date(),
                    expiresAt,
                },
            });
        }
        catch (error) {
            this.logger.error('Error saving typing indicator:', error.message);
        }
    }
    async stopTyping(channelId, userId) {
        try {
            await this.prisma.typingIndicator.deleteMany({
                where: { channelId, userId },
            });
        }
        catch (error) {
        }
    }
    async getTypingUsers(channelId, excludeUserId) {
        const now = new Date();
        const typingIndicators = await this.prisma.typingIndicator.findMany({
            where: {
                channelId,
                expiresAt: { gt: now },
                userId: excludeUserId ? { not: excludeUserId } : undefined,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
        });
        return typingIndicators.map(t => ({
            userId: t.user.id,
            userName: t.user.email?.split('@')[0] || `${t.user.firstName} ${t.user.lastName}`,
            firstName: t.user.firstName,
            lastName: t.user.lastName,
        }));
    }
    buildSearchCountQuery(channelId, searchQuery, dto) {
        const conditions = [
            client_1.Prisma.sql `m.channel_id = ${channelId}`,
            client_1.Prisma.sql `m.is_deleted = false`,
            client_1.Prisma.sql `m.search_vector @@ websearch_to_tsquery('english', ${searchQuery})`,
        ];
        if (dto.from) {
            conditions.push(client_1.Prisma.sql `m.created_at >= ${new Date(dto.from)}::timestamp`);
        }
        if (dto.to) {
            conditions.push(client_1.Prisma.sql `m.created_at <= ${new Date(dto.to)}::timestamp`);
        }
        if (dto.sender) {
            conditions.push(client_1.Prisma.sql `m.sender_id = ${dto.sender}`);
        }
        return client_1.Prisma.sql `
            SELECT COUNT(*)::int as total
            FROM messages m
            WHERE ${client_1.Prisma.join(conditions, ' AND ')}
        `;
    }
    buildSearchQuery(channelId, searchQuery, dto, limit, skip) {
        const conditions = [
            client_1.Prisma.sql `m.channel_id = ${channelId}`,
            client_1.Prisma.sql `m.is_deleted = false`,
            client_1.Prisma.sql `m.search_vector @@ websearch_to_tsquery('english', ${searchQuery})`,
        ];
        if (dto.from) {
            conditions.push(client_1.Prisma.sql `m.created_at >= ${new Date(dto.from)}::timestamp`);
        }
        if (dto.to) {
            conditions.push(client_1.Prisma.sql `m.created_at <= ${new Date(dto.to)}::timestamp`);
        }
        if (dto.sender) {
            conditions.push(client_1.Prisma.sql `m.sender_id = ${dto.sender}`);
        }
        return client_1.Prisma.sql `
            SELECT 
                m.id,
                m.channel_id as "channelId",
                m.sender_id as "senderId",
                m.content,
                m.content_type as "contentType",
                m.reply_to as "replyTo",
                m.is_deleted as "isDeleted",
                m.edited_at as "editedAt",
                m.created_at as "createdAt",
                u.first_name as "senderFirstName",
                u.last_name as "senderLastName",
                u.avatar_url as "senderAvatarUrl",
                ts_rank_cd(m.search_vector, websearch_to_tsquery('english', ${searchQuery}), 32) as rank,
                ts_headline(
                    'english',
                    m.content,
                    websearch_to_tsquery('english', ${searchQuery}),
                    'StartSel=<mark>, StopSel=</mark>, MaxWords=50, MinWords=10, MaxFragments=3, FragmentDelimiter=...'
                ) as headline
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            WHERE ${client_1.Prisma.join(conditions, ' AND ')}
            ORDER BY 
                ts_rank_cd(m.search_vector, websearch_to_tsquery('english', ${searchQuery}), 32) DESC,
                m.created_at DESC
            LIMIT ${limit}
            OFFSET ${skip}
        `;
    }
    isValidUUID(str) {
        const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidV4Regex.test(str);
    }
};
exports.MessagingService = MessagingService;
exports.MessagingService = MessagingService = MessagingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object, typeof (_b = typeof email_service_1.EmailService !== "undefined" && email_service_1.EmailService) === "function" ? _b : Object, typeof (_c = typeof mentions_service_1.MentionsService !== "undefined" && mentions_service_1.MentionsService) === "function" ? _c : Object])
], MessagingService);


/***/ }),
/* 45 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AuditActions = void 0;
exports.createAuditLog = createAuditLog;
const common_1 = __webpack_require__(2);
var AuditActions;
(function (AuditActions) {
    AuditActions["CREATE_CHANNEL"] = "create_channel";
    AuditActions["SEND_MESSAGE"] = "send_message";
    AuditActions["EDIT_MESSAGE"] = "edit_message";
    AuditActions["DELETE_MESSAGE"] = "delete_message";
    AuditActions["ARCHIVE_CHANNEL"] = "archive_channel";
    AuditActions["UNARCHIVE_CHANNEL"] = "unarchive_channel";
    AuditActions["MUTE_USER"] = "mute_user";
    AuditActions["UNMUTE_USER"] = "unmute_user";
    AuditActions["BAN_USER"] = "ban_user";
    AuditActions["UNBAN_USER"] = "unban_user";
    AuditActions["ADD_REACTION"] = "add_reaction";
    AuditActions["REMOVE_REACTION"] = "remove_reaction";
    AuditActions["USER_DELETE"] = "user_delete";
    AuditActions["USER_REACTIVATE"] = "user_reactivate";
    AuditActions["COURSE_ACTIVATE"] = "course_activate";
    AuditActions["COURSE_DEACTIVATE"] = "course_deactivate";
    AuditActions["REPORT_UPDATE"] = "report_update";
    AuditActions["PROMOTE_STUDENTS"] = "promote_students";
})(AuditActions || (exports.AuditActions = AuditActions = {}));
const logger = new common_1.Logger('AuditHelper');
async function createAuditLog(prisma, data) {
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
    }
    catch (error) {
        logger.error(`Failed to create audit log: ${error.message}`, {
            action: data.action,
            actorId: data.actorId,
            error: error.message,
        });
    }
}


/***/ }),
/* 46 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var EmailService_1;
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EmailService = void 0;
const common_1 = __webpack_require__(2);
const config_1 = __webpack_require__(5);
const nodemailer = __importStar(__webpack_require__(47));
const prisma_service_1 = __webpack_require__(10);
const email_templates_1 = __webpack_require__(48);
let EmailService = EmailService_1 = class EmailService {
    constructor(configService, prisma) {
        this.configService = configService;
        this.prisma = prisma;
        this.logger = new common_1.Logger(EmailService_1.name);
        this.isDevelopment = this.configService.get('NODE_ENV') === 'development';
        this.initializeTransporter();
    }
    initializeTransporter() {
        const smtpHost = this.configService.get('SMTP_HOST') || 'smtp.gmail.com';
        const smtpPort = parseInt(this.configService.get('SMTP_PORT') || '587', 10);
        const smtpUser = this.configService.get('SMTP_USER');
        const smtpPass = this.configService.get('SMTP_PASS');
        const smtpSecure = this.configService.get('SMTP_SECURE') === 'true';
        if (!smtpUser || !smtpPass) {
            this.logger.warn('SMTP credentials not configured. Emails will be logged to console only.');
            this.transporter = this.createMockTransporter();
            return;
        }
        this.transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpSecure,
            auth: {
                user: smtpUser,
                pass: smtpPass,
            },
            tls: {
                rejectUnauthorized: false,
            },
        });
        this.transporter.verify((error) => {
            if (error) {
                this.logger.error('SMTP connection failed:', error.message);
            }
            else {
                this.logger.log('SMTP server ready to send emails');
            }
        });
    }
    createMockTransporter() {
        return {
            sendMail: async (mailOptions) => {
                this.logger.log('==================== MOCK EMAIL ====================');
                this.logger.log(`To: ${mailOptions.to}`);
                this.logger.log(`From: ${mailOptions.from}`);
                this.logger.log(`Subject: ${mailOptions.subject}`);
                this.logger.log(`Text: ${mailOptions.text?.substring(0, 200)}...`);
                this.logger.log('====================================================');
                return { messageId: `mock-${Date.now()}` };
            },
            verify: (cb) => cb(null),
        };
    }
    async sendEmail(options) {
        try {
            const fromEmail = this.configService.get('SMTP_FROM') || 'noreply@schoolmessaging.com';
            const fromName = this.configService.get('SMTP_FROM_NAME') || 'School Messaging System';
            const result = await this.transporter.sendMail({
                from: options.from || `"${fromName}" <${fromEmail}>`,
                to: options.to,
                subject: options.subject,
                html: options.html,
                text: options.text,
            });
            this.logger.log(`Email sent successfully to ${options.to}, messageId: ${result.messageId}`);
            return { success: true, messageId: result.messageId };
        }
        catch (error) {
            this.logger.error(`Failed to send email to ${options.to}:`, error.message);
            return { success: false, error: error.message };
        }
    }
    async queueEmail(options) {
        const emailQueue = await this.prisma.emailQueue.create({
            data: {
                toEmail: options.to,
                subject: options.subject,
                body: options.html,
                status: 'pending',
            },
        });
        this.logger.log(`Email queued for ${options.to}, queue ID: ${emailQueue.id}`);
        return emailQueue.id;
    }
    async sendNotificationDigest(to, userName, unreadMessages, digestType = 'daily') {
        const template = email_templates_1.EmailTemplate.getDigestTemplate({
            userName,
            unreadMessages,
            digestType,
            appUrl: this.configService.get('VITE_API_URL') || 'http://localhost:5173',
        });
        return this.sendEmail({
            to,
            subject: template.subject,
            html: template.html,
            text: template.text,
        });
    }
    async sendNewMessageNotification(to, recipientName, senderName, channelName, messageContent, isMention = false) {
        const template = email_templates_1.EmailTemplate.getNewMessageTemplate({
            recipientName,
            senderName,
            channelName,
            messageContent,
            isMention,
            appUrl: this.configService.get('VITE_API_URL') || 'http://localhost:5173',
        });
        return this.sendEmail({
            to,
            subject: template.subject,
            html: template.html,
            text: template.text,
        });
    }
    async sendAccountActivityAlert(to, userName, activityType, details) {
        const template = email_templates_1.EmailTemplate.getAccountActivityTemplate({
            userName,
            activityType,
            details,
            appUrl: this.configService.get('VITE_API_URL') || 'http://localhost:5173',
        });
        return this.sendEmail({
            to,
            subject: template.subject,
            html: template.html,
            text: template.text,
        });
    }
    async sendPasswordReset(to, userName, resetToken, expiresIn = '1 hour') {
        const baseUrl = this.configService.get('VITE_API_URL') || 'http://localhost:5173';
        const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
        const template = email_templates_1.EmailTemplate.getPasswordResetTemplate({
            userName,
            resetUrl,
            expiresIn,
            appUrl: baseUrl,
        });
        return this.sendEmail({
            to,
            subject: template.subject,
            html: template.html,
            text: template.text,
        });
    }
    async sendWelcomeEmail(to, userName, role) {
        const template = email_templates_1.EmailTemplate.getWelcomeTemplate({
            userName,
            role,
            appUrl: this.configService.get('VITE_API_URL') || 'http://localhost:5173',
        });
        return this.sendEmail({
            to,
            subject: template.subject,
            html: template.html,
            text: template.text,
        });
    }
    async shouldSendEmail(userId, notificationType) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                emailNotificationsEnabled: true,
                notificationPreferences: true,
            },
        });
        if (!user || !user.emailNotificationsEnabled) {
            return false;
        }
        const preferences = user.notificationPreferences;
        if (preferences && preferences[notificationType] === false) {
            return false;
        }
        return true;
    }
    async getQueueStats() {
        const [pending, processing, sent, failed] = await Promise.all([
            this.prisma.emailQueue.count({ where: { status: 'pending' } }),
            this.prisma.emailQueue.count({ where: { status: 'processing' } }),
            this.prisma.emailQueue.count({ where: { status: 'sent' } }),
            this.prisma.emailQueue.count({ where: { status: 'failed' } }),
        ]);
        return {
            pending,
            processing,
            sent,
            failed,
            total: pending + processing + sent + failed,
        };
    }
    async cleanupQueue(olderThanDays = 7) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
        const result = await this.prisma.emailQueue.deleteMany({
            where: {
                status: { in: ['sent', 'failed'] },
                createdAt: { lt: cutoffDate },
            },
        });
        this.logger.log(`Cleaned up ${result.count} old email queue entries`);
        return result.count;
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = EmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object, typeof (_b = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _b : Object])
], EmailService);


/***/ }),
/* 47 */
/***/ ((module) => {

module.exports = require("nodemailer");

/***/ }),
/* 48 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EmailTemplate = void 0;
const BRAND_COLORS = {
    primary: '#4F46E5',
    primaryDark: '#4338CA',
    secondary: '#10B981',
    danger: '#EF4444',
    warning: '#F59E0B',
    background: '#F9FAFB',
    surface: '#FFFFFF',
    text: '#1F2937',
    textMuted: '#6B7280',
    border: '#E5E7EB',
};
const baseStyles = {
    container: `font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: ${BRAND_COLORS.background};`,
    header: `background-color: ${BRAND_COLORS.primary}; padding: 24px; text-align: center;`,
    headerText: `color: white; margin: 0; font-size: 24px; font-weight: 600;`,
    content: `background-color: ${BRAND_COLORS.surface}; padding: 32px 24px;`,
    footer: `background-color: ${BRAND_COLORS.background}; padding: 24px; text-align: center; color: ${BRAND_COLORS.textMuted}; font-size: 12px;`,
    button: `display: inline-block; background-color: ${BRAND_COLORS.primary}; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 500;`,
    buttonSecondary: `display: inline-block; background-color: ${BRAND_COLORS.secondary}; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 500;`,
    text: `color: ${BRAND_COLORS.text}; line-height: 1.6; margin: 0 0 16px 0;`,
    heading: `color: ${BRAND_COLORS.text}; font-size: 20px; font-weight: 600; margin: 0 0 16px 0;`,
    subheading: `color: ${BRAND_COLORS.text}; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;`,
    card: `background-color: ${BRAND_COLORS.surface}; border: 1px solid ${BRAND_COLORS.border}; border-radius: 8px; padding: 16px; margin-bottom: 12px;`,
    badge: (color) => `display: inline-block; background-color: ${color}20; color: ${color}; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500;`,
    divider: `border: none; border-top: 1px solid ${BRAND_COLORS.border}; margin: 24px 0;`,
    link: `color: ${BRAND_COLORS.primary}; text-decoration: none;`,
    small: `color: ${BRAND_COLORS.textMuted}; font-size: 12px;`,
};
const wrapEmail = (content, appUrl) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>School Messaging System</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${BRAND_COLORS.background};">
    <div style="${baseStyles.container}">
        <div style="${baseStyles.header}">
            <h1 style="${baseStyles.headerText}">📚 School Messaging System</h1>
        </div>
        ${content}
        <div style="${baseStyles.footer}">
            <p style="margin: 0 0 8px 0;">This email was sent by the School Messaging System.</p>
            <p style="margin: 0;">
                <a href="${appUrl}" style="${baseStyles.link}">Visit Website</a> • 
                <a href="${appUrl}/settings/notifications" style="${baseStyles.link}">Notification Settings</a>
            </p>
        </div>
    </div>
</body>
</html>
`;
class EmailTemplate {
    static getNewMessageTemplate(params) {
        const { recipientName, senderName, channelName, messageContent, isMention, appUrl } = params;
        const mentionBadge = isMention
            ? `<span style="${baseStyles.badge(BRAND_COLORS.warning)}">@Mention</span>`
            : '';
        const subject = isMention
            ? `${senderName} mentioned you in ${channelName}`
            : `New message from ${senderName} in ${channelName}`;
        const html = wrapEmail(`
            <div style="${baseStyles.content}">
                <p style="${baseStyles.text}">Hi ${recipientName},</p>
                <p style="${baseStyles.text}">
                    You have a new message ${mentionBadge}
                </p>
                
                <div style="${baseStyles.card}">
                    <p style="${baseStyles.subheading}">${senderName} in ${channelName}</p>
                    <p style="${baseStyles.text}; margin-bottom: 0;">${messageContent.substring(0, 200)}${messageContent.length > 200 ? '...' : ''}</p>
                </div>
                
                <div style="text-align: center; margin: 24px 0;">
                    <a href="${appUrl}/messaging" style="${baseStyles.button}">View Message</a>
                </div>
                
                <hr style="${baseStyles.divider}">
                
                <p style="${baseStyles.small}">
                    You're receiving this because you have email notifications enabled. 
                    <a href="${appUrl}/settings/notifications" style="${baseStyles.link}">Update preferences</a>
                </p>
            </div>
        `, appUrl);
        const text = `Hi ${recipientName},

You have a new message from ${senderName} in ${channelName}:

"${messageContent.substring(0, 200)}${messageContent.length > 200 ? '...' : ''}"

View the message: ${appUrl}/messaging

---
You're receiving this because you have email notifications enabled.
Update preferences: ${appUrl}/settings/notifications`;
        return { subject, html, text };
    }
    static getDigestTemplate(params) {
        const { userName, unreadMessages, digestType, appUrl } = params;
        const subject = `${digestType === 'daily' ? 'Daily' : 'Weekly'} Message Digest - ${unreadMessages.length} unread messages`;
        const totalUnread = unreadMessages.reduce((sum, m) => sum + m.count, 0);
        const messagesList = unreadMessages.length === 0
            ? '<p style="${baseStyles.text}; text-align: center; color: ${BRAND_COLORS.textMuted};">No unread messages! 🎉</p>'
            : unreadMessages.map(msg => `
                <div style="${baseStyles.card}">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <span style="${baseStyles.subheading}; margin: 0;">${msg.channelName}</span>
                        ${msg.count > 1 ? `<span style="${baseStyles.badge(BRAND_COLORS.primary)}">${msg.count} new</span>` : ''}
                    </div>
                    <p style="${baseStyles.small}; margin: 0 0 4px 0;">From ${msg.senderName}</p>
                    <p style="${baseStyles.text}; margin: 0;">${msg.messagePreview.substring(0, 100)}${msg.messagePreview.length > 100 ? '...' : ''}</p>
                </div>
            `).join('');
        const html = wrapEmail(`
            <div style="${baseStyles.content}">
                <p style="${baseStyles.text}">Hi ${userName},</p>
                
                <h2 style="${baseStyles.heading}">
                    ${digestType === 'daily' ? '📬 Daily' : '📊 Weekly'} Digest
                </h2>
                
                <p style="${baseStyles.text}">
                    You have <strong>${totalUnread}</strong> unread message${totalUnread !== 1 ? 's' : ''} 
                    across <strong>${unreadMessages.length}</strong> conversation${unreadMessages.length !== 1 ? 's' : ''}.
                </p>
                
                ${messagesList}
                
                <div style="text-align: center; margin: 24px 0;">
                    <a href="${appUrl}/messaging" style="${baseStyles.button}">View All Messages</a>
                </div>
                
                <hr style="${baseStyles.divider}">
                
                <p style="${baseStyles.small}">
                    You're receiving this ${digestType} digest because you have email notifications enabled.
                    <a href="${appUrl}/settings/notifications" style="${baseStyles.link}">Update preferences</a>
                </p>
            </div>
        `, appUrl);
        const text = `Hi ${userName},

${digestType === 'daily' ? 'Daily' : 'Weekly'} Digest

You have ${totalUnread} unread message${totalUnread !== 1 ? 's' : ''} across ${unreadMessages.length} conversation${unreadMessages.length !== 1 ? 's' : ''}.

${unreadMessages.map(msg => `
${msg.channelName}${msg.count > 1 ? ` (${msg.count} new)` : ''}
From ${msg.senderName}
"${msg.messagePreview.substring(0, 100)}${msg.messagePreview.length > 100 ? '...' : ''}"
`).join('\n---\n')}

View all messages: ${appUrl}/messaging

---
You're receiving this ${digestType} digest because you have email notifications enabled.
Update preferences: ${appUrl}/settings/notifications`;
        return { subject, html, text };
    }
    static getAccountActivityTemplate(params) {
        const { userName, activityType, details, appUrl } = params;
        const activityLabels = {
            login: { subject: 'New login to your account', title: 'New Login Detected', icon: '🔐', color: BRAND_COLORS.secondary },
            password_change: { subject: 'Your password was changed', title: 'Password Changed', icon: '🔑', color: BRAND_COLORS.primary },
            profile_update: { subject: 'Your profile was updated', title: 'Profile Updated', icon: '👤', color: BRAND_COLORS.primary },
            suspicious_activity: { subject: 'Suspicious activity detected', title: '⚠️ Suspicious Activity', icon: '⚠️', color: BRAND_COLORS.danger },
        };
        const activity = activityLabels[activityType];
        const formattedTime = new Intl.DateTimeFormat('en-US', {
            dateStyle: 'full',
            timeStyle: 'short',
        }).format(details.timestamp);
        const html = wrapEmail(`
            <div style="${baseStyles.content}">
                <p style="${baseStyles.text}">Hi ${userName},</p>
                
                <div style="text-align: center; margin: 24px 0;">
                    <div style="font-size: 48px; margin-bottom: 16px;">${activity.icon}</div>
                    <h2 style="${baseStyles.heading}; color: ${activity.color};">${activity.title}</h2>
                </div>
                
                <p style="${baseStyles.text}">
                    We noticed activity on your School Messaging account:
                </p>
                
                <div style="${baseStyles.card}">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; color: ${BRAND_COLORS.textMuted}; width: 100px;">Time</td>
                            <td style="padding: 8px 0; font-weight: 500;">${formattedTime}</td>
                        </tr>
                        ${details.ipAddress ? `
                        <tr>
                            <td style="padding: 8px 0; color: ${BRAND_COLORS.textMuted};">IP Address</td>
                            <td style="padding: 8px 0; font-family: monospace;">${details.ipAddress}</td>
                        </tr>
                        ` : ''}
                        ${details.device ? `
                        <tr>
                            <td style="padding: 8px 0; color: ${BRAND_COLORS.textMuted};">Device</td>
                            <td style="padding: 8px 0;">${details.device}</td>
                        </tr>
                        ` : ''}
                        ${details.location ? `
                        <tr>
                            <td style="padding: 8px 0; color: ${BRAND_COLORS.textMuted};">Location</td>
                            <td style="padding: 8px 0;">${details.location}</td>
                        </tr>
                        ` : ''}
                    </table>
                </div>
                
                ${activityType === 'suspicious_activity' ? `
                <div style="background-color: ${BRAND_COLORS.danger}10; border-left: 4px solid ${BRAND_COLORS.danger}; padding: 16px; margin: 16px 0; border-radius: 0 8px 8px 0;">
                    <p style="${baseStyles.text}; margin: 0; color: ${BRAND_COLORS.danger};">
                        <strong>Action Required:</strong> If you don't recognize this activity, please secure your account immediately.
                    </p>
                </div>
                ` : ''}
                
                <div style="text-align: center; margin: 24px 0;">
                    <a href="${appUrl}/settings/security" style="${activityType === 'suspicious_activity' ? baseStyles.button : baseStyles.buttonSecondary}">
                        ${activityType === 'suspicious_activity' ? 'Secure My Account' : 'Review Account Activity'}
                    </a>
                </div>
                
                <hr style="${baseStyles.divider}">
                
                <p style="${baseStyles.small}">
                    You're receiving this security alert to help keep your account safe.
                    <a href="${appUrl}/settings/notifications" style="${baseStyles.link}">Notification settings</a>
                </p>
            </div>
        `, appUrl);
        const text = `Hi ${userName},

${activity.title}

We noticed activity on your School Messaging account:

Time: ${formattedTime}
${details.ipAddress ? `IP Address: ${details.ipAddress}\n` : ''}${details.device ? `Device: ${details.device}\n` : ''}${details.location ? `Location: ${details.location}\n` : ''}

${activityType === 'suspicious_activity' ? `⚠️ ACTION REQUIRED: If you don't recognize this activity, please secure your account immediately.` : ''}

Review account activity: ${appUrl}/settings/security

---
You're receiving this security alert to help keep your account safe.
Notification settings: ${appUrl}/settings/notifications`;
        return { subject: activity.subject, html, text };
    }
    static getPasswordResetTemplate(params) {
        const { userName, resetUrl, expiresIn, appUrl } = params;
        const subject = 'Reset your password';
        const html = wrapEmail(`
            <div style="${baseStyles.content}">
                <div style="text-align: center; margin: 24px 0;">
                    <div style="font-size: 48px; margin-bottom: 16px;">🔐</div>
                    <h2 style="${baseStyles.heading}">Reset Your Password</h2>
                </div>
                
                <p style="${baseStyles.text}">Hi ${userName},</p>
                
                <p style="${baseStyles.text}">
                    We received a request to reset your password. Click the button below to create a new password:
                </p>
                
                <div style="text-align: center; margin: 32px 0;">
                    <a href="${resetUrl}" style="${baseStyles.button}">Reset Password</a>
                </div>
                
                <p style="${baseStyles.text}">
                    Or copy and paste this link into your browser:
                </p>
                <p style="${baseStyles.text}; word-break: break-all; background-color: ${BRAND_COLORS.background}; padding: 12px; border-radius: 4px; font-family: monospace; font-size: 12px;">
                    ${resetUrl}
                </p>
                
                <div style="background-color: ${BRAND_COLORS.warning}10; border-left: 4px solid ${BRAND_COLORS.warning}; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0;">
                    <p style="${baseStyles.text}; margin: 0;">
                        <strong>⏰ This link expires in ${expiresIn}</strong>
                    </p>
                </div>
                
                <p style="${baseStyles.text}">
                    If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
                </p>
                
                <hr style="${baseStyles.divider}">
                
                <p style="${baseStyles.small}">
                    Need help? Contact support at <a href="mailto:support@schoolmessaging.com" style="${baseStyles.link}">support@schoolmessaging.com</a>
                </p>
            </div>
        `, appUrl);
        const text = `Hi ${userName},

Reset Your Password

We received a request to reset your password. Click the link below to create a new password:

${resetUrl}

⏰ This link expires in ${expiresIn}

If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.

---
Need help? Contact support at support@schoolmessaging.com`;
        return { subject, html, text };
    }
    static getWelcomeTemplate(params) {
        const { userName, role, appUrl } = params;
        const roleSpecificContent = {
            teacher: 'As a teacher, you can create channels, send announcements, grade assignments, and communicate with parents and students.',
            parent: 'As a parent, you can stay connected with your child\'s teachers, receive updates, and track their academic progress.',
            student: 'As a student, you can join class channels, submit assignments, view your grades, and collaborate with classmates.',
            admin: 'As an administrator, you have full access to manage users, courses, and system settings.',
        };
        const subject = 'Welcome to School Messaging System!';
        const html = wrapEmail(`
            <div style="${baseStyles.content}">
                <div style="text-align: center; margin: 24px 0;">
                    <div style="font-size: 48px; margin-bottom: 16px;">🎓</div>
                    <h2 style="${baseStyles.heading}">Welcome to School Messaging!</h2>
                </div>
                
                <p style="${baseStyles.text}">Hi ${userName},</p>
                
                <p style="${baseStyles.text}">
                    Welcome to your school's messaging platform! We're excited to have you on board.
                </p>
                
                <div style="${baseStyles.card}">
                    <p style="${baseStyles.text}; margin: 0;">
                        ${roleSpecificContent[role] || roleSpecificContent.student}
                    </p>
                </div>
                
                <h3 style="${baseStyles.subheading}">Get Started:</h3>
                
                <table style="width: 100%; margin: 16px 0;">
                    <tr>
                        <td style="padding: 8px;">💬</td>
                        <td style="padding: 8px;"><strong>Join conversations</strong> in your class channels</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px;">📁</td>
                        <td style="padding: 8px;"><strong>Share files</strong> and course materials</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px;">📅</td>
                        <td style="padding: 8px;"><strong>Stay updated</strong> with announcements</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px;">🔔</td>
                        <td style="padding: 8px;"><strong>Customize notifications</strong> to your preference</td>
                    </tr>
                </table>
                
                <div style="text-align: center; margin: 32px 0;">
                    <a href="${appUrl}/messaging" style="${baseStyles.button}">Get Started</a>
                </div>
                
                <hr style="${baseStyles.divider}">
                
                <p style="${baseStyles.small}">
                    Need help getting started? Check out our <a href="${appUrl}/help" style="${baseStyles.link}">Help Center</a> or 
                    contact support at <a href="mailto:support@schoolmessaging.com" style="${baseStyles.link}">support@schoolmessaging.com</a>
                </p>
            </div>
        `, appUrl);
        const text = `Welcome to School Messaging!

Hi ${userName},

Welcome to your school's messaging platform! We're excited to have you on board.

${roleSpecificContent[role] || roleSpecificContent.student}

Get Started:
- 💬 Join conversations in your class channels
- 📁 Share files and course materials  
- 📅 Stay updated with announcements
- 🔔 Customize notifications to your preference

Get Started: ${appUrl}/messaging

---
Need help getting started? Check out our Help Center or contact support at support@schoolmessaging.com`;
        return { subject, html, text };
    }
}
exports.EmailTemplate = EmailTemplate;


/***/ }),
/* 49 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MentionsService_1;
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MentionsService = void 0;
const common_1 = __webpack_require__(2);
const prisma_service_1 = __webpack_require__(10);
const MENTION_REGEX = /@([a-zA-Z0-9_]+)|@"([^"]+)"/g;
let MentionsService = MentionsService_1 = class MentionsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(MentionsService_1.name);
    }
    parseMentions(content) {
        const mentions = [];
        const seen = new Set();
        let match;
        MENTION_REGEX.lastIndex = 0;
        while ((match = MENTION_REGEX.exec(content)) !== null) {
            const raw = match[0];
            if (seen.has(raw.toLowerCase()))
                continue;
            seen.add(raw.toLowerCase());
            const mention = { raw };
            if (match[1]) {
                mention.username = match[1];
            }
            else if (match[2]) {
                mention.fullName = match[2];
            }
            mentions.push(mention);
        }
        return mentions;
    }
    async getMentionedUsers(mentions, channelId) {
        const results = [];
        const channelMembers = await this.prisma.channelMember.findMany({
            where: { channelId },
            select: { userId: true },
        });
        const memberUserIds = channelMembers.map(m => m.userId);
        if (memberUserIds.length === 0)
            return results;
        for (const mention of mentions) {
            try {
                let user = null;
                if (mention.username) {
                    const searchTerm = mention.username.toLowerCase().replace(/_/g, ' ');
                    user = await this.prisma.user.findFirst({
                        where: {
                            id: { in: memberUserIds },
                            OR: [
                                {
                                    firstName: {
                                        equals: searchTerm.split(' ')[0],
                                        mode: 'insensitive',
                                    },
                                    lastName: {
                                        equals: searchTerm.split(' ').slice(1).join(' ') || '',
                                        mode: 'insensitive',
                                    },
                                },
                                {
                                    email: {
                                        startsWith: mention.username.toLowerCase() + '@',
                                        mode: 'insensitive',
                                    },
                                },
                            ],
                        },
                        select: { id: true },
                    });
                }
                if (mention.fullName && !user) {
                    const nameParts = mention.fullName.trim().split(/\s+/);
                    const firstName = nameParts[0];
                    const lastName = nameParts.slice(1).join(' ');
                    user = await this.prisma.user.findFirst({
                        where: {
                            id: { in: memberUserIds },
                            firstName: {
                                equals: firstName,
                                mode: 'insensitive',
                            },
                            ...(lastName && {
                                lastName: {
                                    equals: lastName,
                                    mode: 'insensitive',
                                },
                            }),
                        },
                        select: { id: true },
                    });
                }
                if (user) {
                    results.push({ userId: user.id, mention });
                }
            }
            catch (error) {
                this.logger.error(`Error resolving mention ${mention.raw}:`, error);
            }
        }
        return results;
    }
    async createMentions(messageId, mentions) {
        const createdMentionIds = [];
        for (const { userId, mention } of mentions) {
            try {
                const created = await this.prisma.mention.create({
                    data: {
                        messageId,
                        mentionedUserId: userId,
                        mentionText: mention.raw,
                        isRead: false,
                    },
                    select: { id: true },
                });
                createdMentionIds.push(created.id);
            }
            catch (error) {
                this.logger.error(`Error creating mention for user ${userId}:`, error);
            }
        }
        return createdMentionIds;
    }
    async getUserMentions(userId, options = {}) {
        const { unreadOnly = false, page = 1, limit = 20 } = options;
        const skip = (page - 1) * limit;
        const where = {
            mentionedUserId: userId,
            ...(unreadOnly && { isRead: false }),
        };
        const [mentions, total, unreadCount] = await Promise.all([
            this.prisma.mention.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    message: {
                        select: {
                            id: true,
                            content: true,
                            channelId: true,
                            createdAt: true,
                            sender: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    avatarUrl: true,
                                },
                            },
                            channel: {
                                select: {
                                    id: true,
                                    name: true,
                                    type: true,
                                },
                            },
                        },
                    },
                },
            }),
            this.prisma.mention.count({ where }),
            this.prisma.mention.count({
                where: { mentionedUserId: userId, isRead: false },
            }),
        ]);
        return {
            mentions: mentions.map(m => this.mapToMentionResponse(m)),
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                unreadCount,
            },
        };
    }
    async markMentionAsRead(mentionId, userId) {
        const mention = await this.prisma.mention.findFirst({
            where: {
                id: mentionId,
                mentionedUserId: userId,
            },
        });
        if (!mention) {
            throw new common_1.NotFoundException('Mention not found');
        }
        await this.prisma.mention.update({
            where: { id: mentionId },
            data: {
                isRead: true,
                readAt: new Date(),
            },
        });
        return { success: true };
    }
    async markAllMentionsAsRead(userId) {
        const result = await this.prisma.mention.updateMany({
            where: {
                mentionedUserId: userId,
                isRead: false,
            },
            data: {
                isRead: true,
                readAt: new Date(),
            },
        });
        return {
            success: true,
            markedCount: result.count,
        };
    }
    async markMentionsAsRead(userId, mentionIds) {
        const result = await this.prisma.mention.updateMany({
            where: {
                id: { in: mentionIds },
                mentionedUserId: userId,
            },
            data: {
                isRead: true,
                readAt: new Date(),
            },
        });
        return {
            success: true,
            markedCount: result.count,
        };
    }
    async getUnreadMentionCount(userId) {
        return this.prisma.mention.count({
            where: {
                mentionedUserId: userId,
                isRead: false,
            },
        });
    }
    async getMessageMentions(messageId) {
        const mentions = await this.prisma.mention.findMany({
            where: { messageId },
            include: {
                mentionedUser: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatarUrl: true,
                    },
                },
            },
        });
        return mentions.map(m => this.mapToMentionResponse(m));
    }
    async deleteMessageMentions(messageId) {
        await this.prisma.mention.deleteMany({
            where: { messageId },
        });
    }
    mapToMentionResponse(mention) {
        return {
            id: mention.id,
            messageId: mention.messageId,
            mentionedUserId: mention.mentionedUserId,
            mentionText: mention.mentionText,
            isRead: mention.isRead,
            createdAt: mention.createdAt,
            readAt: mention.readAt,
            ...(mention.message && {
                message: {
                    id: mention.message.id,
                    content: mention.message.content,
                    channelId: mention.message.channelId,
                    createdAt: mention.message.createdAt,
                    sender: mention.message.sender,
                    channel: mention.message.channel,
                },
            }),
        };
    }
};
exports.MentionsService = MentionsService;
exports.MentionsService = MentionsService = MentionsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], MentionsService);


/***/ }),
/* 50 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GetConversationsQueryDto = exports.AddMemberDto = exports.SendMessageDto = exports.RejectChannelDto = exports.ApproveChannelDto = exports.MuteUserDto = exports.ChannelRequestDto = exports.CreateChannelDto = exports.CreateMessageDto = exports.AttachmentDto = exports.ContentType = void 0;
const class_validator_1 = __webpack_require__(23);
const class_transformer_1 = __webpack_require__(26);
const sanitize_decorator_1 = __webpack_require__(24);
var ContentType;
(function (ContentType) {
    ContentType["TEXT"] = "text";
    ContentType["IMAGE"] = "image";
    ContentType["FILE"] = "file";
    ContentType["VOICE"] = "voice";
    ContentType["MIXED"] = "mixed";
})(ContentType || (exports.ContentType = ContentType = {}));
class AttachmentDto {
}
exports.AttachmentDto = AttachmentDto;
__decorate([
    (0, class_validator_1.IsString)({ message: 'File name must be a string' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'File name is required' }),
    (0, class_validator_1.MaxLength)(255, { message: 'File name cannot exceed 255 characters' }),
    (0, sanitize_decorator_1.SanitizePlainText)(),
    __metadata("design:type", String)
], AttachmentDto.prototype, "fileName", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'File type must be a string' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'File type is required' }),
    (0, class_validator_1.MaxLength)(100, { message: 'File type cannot exceed 100 characters' }),
    (0, sanitize_decorator_1.SanitizePlainText)(),
    __metadata("design:type", String)
], AttachmentDto.prototype, "fileType", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'File path must be a string' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'File path is required' }),
    (0, class_validator_1.MaxLength)(500, { message: 'File path cannot exceed 500 characters' }),
    (0, sanitize_decorator_1.SanitizePlainText)(),
    __metadata("design:type", String)
], AttachmentDto.prototype, "filePath", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'URL must be a string' }),
    (0, class_validator_1.MaxLength)(1000, { message: 'URL cannot exceed 1000 characters' }),
    (0, sanitize_decorator_1.SanitizePlainText)(),
    __metadata("design:type", String)
], AttachmentDto.prototype, "url", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)({ message: 'Duration must be an integer' }),
    (0, class_validator_1.Min)(0, { message: 'Duration cannot be negative' }),
    (0, class_validator_1.Max)(3600, { message: 'Duration cannot exceed 3600 seconds' }),
    __metadata("design:type", Number)
], AttachmentDto.prototype, "duration", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)({ message: 'Width must be an integer' }),
    (0, class_validator_1.Min)(1, { message: 'Width must be at least 1' }),
    (0, class_validator_1.Max)(10000, { message: 'Width cannot exceed 10000' }),
    __metadata("design:type", Number)
], AttachmentDto.prototype, "width", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)({ message: 'Height must be an integer' }),
    (0, class_validator_1.Min)(1, { message: 'Height must be at least 1' }),
    (0, class_validator_1.Max)(10000, { message: 'Height cannot exceed 10000' }),
    __metadata("design:type", Number)
], AttachmentDto.prototype, "height", void 0);
class CreateMessageDto {
    constructor() {
        this.contentType = ContentType.TEXT;
    }
}
exports.CreateMessageDto = CreateMessageDto;
__decorate([
    (0, class_validator_1.IsString)({ message: 'Content must be a string' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Content is required' }),
    (0, class_validator_1.MaxLength)(4000, { message: 'Message cannot exceed 4000 characters' }),
    (0, sanitize_decorator_1.SanitizeHtml)(),
    __metadata("design:type", String)
], CreateMessageDto.prototype, "content", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(ContentType, { message: 'Invalid content type' }),
    __metadata("design:type", String)
], CreateMessageDto.prototype, "contentType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)('4', { message: 'Invalid reply message ID' }),
    __metadata("design:type", String)
], CreateMessageDto.prototype, "replyTo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)({ message: 'Attachments must be an array' }),
    (0, class_validator_1.ArrayMaxSize)(10, { message: 'Cannot attach more than 10 files' }),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => AttachmentDto),
    __metadata("design:type", Array)
], CreateMessageDto.prototype, "attachments", void 0);
class CreateChannelDto {
}
exports.CreateChannelDto = CreateChannelDto;
__decorate([
    (0, class_validator_1.IsString)({ message: 'Channel type must be a string' }),
    (0, class_validator_1.IsIn)(['podcast', 'classroom', 'class_broadcast', 'direct_message', 'teacher_parent', 'teacher_student', 'admin_broadcast', 'group'], { message: 'Invalid channel type' }),
    __metadata("design:type", String)
], CreateChannelDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'Channel name must be a string' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Channel name is required' }),
    (0, class_validator_1.MaxLength)(200, { message: 'Channel name cannot exceed 200 characters' }),
    (0, sanitize_decorator_1.SanitizePlainText)(),
    __metadata("design:type", String)
], CreateChannelDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Description must be a string' }),
    (0, class_validator_1.MaxLength)(1000, { message: 'Description cannot exceed 1000 characters' }),
    (0, sanitize_decorator_1.SanitizeHtml)(),
    __metadata("design:type", String)
], CreateChannelDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)({ message: 'Member IDs must be an array' }),
    (0, class_validator_1.ArrayMaxSize)(500, { message: 'Cannot add more than 500 members at once' }),
    (0, class_validator_1.IsUUID)('4', { each: true, message: 'Invalid member ID in array' }),
    __metadata("design:type", Array)
], CreateChannelDto.prototype, "memberIds", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)('4', { message: 'Invalid class ID' }),
    __metadata("design:type", String)
], CreateChannelDto.prototype, "classId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)({ message: 'Max members must be an integer' }),
    (0, class_validator_1.Min)(2, { message: 'Max members must be at least 2' }),
    (0, class_validator_1.Max)(1000, { message: 'Max members cannot exceed 1000' }),
    __metadata("design:type", Number)
], CreateChannelDto.prototype, "maxMembers", void 0);
class ChannelRequestDto {
}
exports.ChannelRequestDto = ChannelRequestDto;
__decorate([
    (0, class_validator_1.IsString)({ message: 'Type must be a string' }),
    (0, class_validator_1.IsEnum)(ContentType, { message: 'Invalid type' }),
    __metadata("design:type", String)
], ChannelRequestDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'Name must be a string' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Name is required' }),
    (0, class_validator_1.MaxLength)(200, { message: 'Name cannot exceed 200 characters' }),
    (0, sanitize_decorator_1.SanitizePlainText)(),
    __metadata("design:type", String)
], ChannelRequestDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Description must be a string' }),
    (0, class_validator_1.MaxLength)(1000, { message: 'Description cannot exceed 1000 characters' }),
    (0, sanitize_decorator_1.SanitizeHtml)(),
    __metadata("design:type", String)
], ChannelRequestDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsArray)({ message: 'Member IDs must be an array' }),
    (0, class_validator_1.ArrayMaxSize)(100, { message: 'Cannot add more than 100 members at once' }),
    (0, class_validator_1.IsUUID)('4', { each: true, message: 'Invalid member ID in array' }),
    __metadata("design:type", Array)
], ChannelRequestDto.prototype, "memberIds", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Reason must be a string' }),
    (0, class_validator_1.MaxLength)(500, { message: 'Reason cannot exceed 500 characters' }),
    (0, sanitize_decorator_1.SanitizePlainText)(),
    __metadata("design:type", String)
], ChannelRequestDto.prototype, "reason", void 0);
class MuteUserDto {
}
exports.MuteUserDto = MuteUserDto;
__decorate([
    (0, class_validator_1.IsUUID)('4', { message: 'Invalid user ID' }),
    __metadata("design:type", String)
], MuteUserDto.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)({ message: 'Duration must be an integer' }),
    (0, class_validator_1.Min)(1, { message: 'Duration must be at least 1 minute' }),
    (0, class_validator_1.Max)(10080, { message: 'Duration cannot exceed 1 week (10080 minutes)' }),
    __metadata("design:type", Number)
], MuteUserDto.prototype, "duration", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Reason must be a string' }),
    (0, class_validator_1.MaxLength)(500, { message: 'Reason cannot exceed 500 characters' }),
    (0, sanitize_decorator_1.SanitizePlainText)(),
    __metadata("design:type", String)
], MuteUserDto.prototype, "reason", void 0);
class ApproveChannelDto {
}
exports.ApproveChannelDto = ApproveChannelDto;
__decorate([
    (0, class_validator_1.IsUUID)('4', { message: 'Invalid channel ID' }),
    __metadata("design:type", String)
], ApproveChannelDto.prototype, "channelId", void 0);
class RejectChannelDto {
}
exports.RejectChannelDto = RejectChannelDto;
__decorate([
    (0, class_validator_1.IsUUID)('4', { message: 'Invalid channel ID' }),
    __metadata("design:type", String)
], RejectChannelDto.prototype, "channelId", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'Reason must be a string' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Reason is required' }),
    (0, class_validator_1.MaxLength)(500, { message: 'Reason cannot exceed 500 characters' }),
    (0, sanitize_decorator_1.SanitizePlainText)(),
    __metadata("design:type", String)
], RejectChannelDto.prototype, "reason", void 0);
class SendMessageDto {
}
exports.SendMessageDto = SendMessageDto;
__decorate([
    (0, class_validator_1.IsString)({ message: 'Content must be a string' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Content is required' }),
    (0, class_validator_1.MaxLength)(4000, { message: 'Message cannot exceed 4000 characters' }),
    (0, sanitize_decorator_1.SanitizeHtml)(),
    __metadata("design:type", String)
], SendMessageDto.prototype, "content", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Reply to must be a string' }),
    (0, class_validator_1.IsUUID)('4', { message: 'Invalid reply message ID' }),
    __metadata("design:type", String)
], SendMessageDto.prototype, "replyTo", void 0);
class AddMemberDto {
}
exports.AddMemberDto = AddMemberDto;
__decorate([
    (0, class_validator_1.IsString)({ message: 'User ID must be a string' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'User ID is required' }),
    (0, class_validator_1.IsUUID)('4', { message: 'Invalid user ID' }),
    __metadata("design:type", String)
], AddMemberDto.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Role must be a string' }),
    (0, class_validator_1.IsIn)(['owner', 'moderator', 'member'], { message: 'Role must be one of: owner, moderator, member' }),
    __metadata("design:type", String)
], AddMemberDto.prototype, "role", void 0);
class GetConversationsQueryDto {
    constructor() {
        this.page = 1;
        this.limit = 20;
    }
}
exports.GetConversationsQueryDto = GetConversationsQueryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)({ message: 'Page must be an integer' }),
    (0, class_validator_1.Min)(1, { message: 'Page must be at least 1' }),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], GetConversationsQueryDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)({ message: 'Limit must be an integer' }),
    (0, class_validator_1.Min)(1, { message: 'Limit must be at least 1' }),
    (0, class_validator_1.Max)(200, { message: 'Limit cannot exceed 200' }),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], GetConversationsQueryDto.prototype, "limit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Type must be a string' }),
    (0, class_validator_1.MaxLength)(50, { message: 'Type cannot exceed 50 characters' }),
    (0, sanitize_decorator_1.SanitizePlainText)(),
    __metadata("design:type", String)
], GetConversationsQueryDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Status must be a string' }),
    (0, class_validator_1.MaxLength)(50, { message: 'Status cannot exceed 50 characters' }),
    (0, sanitize_decorator_1.SanitizePlainText)(),
    __metadata("design:type", String)
], GetConversationsQueryDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Search must be a string' }),
    (0, class_validator_1.MaxLength)(200, { message: 'Search cannot exceed 200 characters' }),
    (0, sanitize_decorator_1.SanitizePlainText)(),
    __metadata("design:type", String)
], GetConversationsQueryDto.prototype, "search", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Date from must be a string' }),
    __metadata("design:type", String)
], GetConversationsQueryDto.prototype, "dateFrom", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Date to must be a string' }),
    __metadata("design:type", String)
], GetConversationsQueryDto.prototype, "dateTo", void 0);


/***/ }),
/* 51 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EditHistoryEntryDto = exports.ReactionResponseDto = exports.RemoveReactionDto = exports.AddReactionDto = void 0;
const class_validator_1 = __webpack_require__(23);
class AddReactionDto {
}
exports.AddReactionDto = AddReactionDto;
__decorate([
    (0, class_validator_1.IsString)({ message: 'Reaction must be a string' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Reaction is required' }),
    (0, class_validator_1.MaxLength)(50, { message: 'Reaction cannot exceed 50 characters' }),
    __metadata("design:type", String)
], AddReactionDto.prototype, "reaction", void 0);
class RemoveReactionDto {
}
exports.RemoveReactionDto = RemoveReactionDto;
__decorate([
    (0, class_validator_1.IsString)({ message: 'Reaction ID must be a string' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Reaction ID is required' }),
    (0, class_validator_1.IsUUID)('4', { message: 'Invalid reaction ID' }),
    __metadata("design:type", String)
], RemoveReactionDto.prototype, "reactionId", void 0);
class ReactionResponseDto {
}
exports.ReactionResponseDto = ReactionResponseDto;
class EditHistoryEntryDto {
}
exports.EditHistoryEntryDto = EditHistoryEntryDto;


/***/ }),
/* 52 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SearchMessagesDto = void 0;
const class_validator_1 = __webpack_require__(23);
const class_transformer_1 = __webpack_require__(26);
class SearchMessagesDto {
    constructor() {
        this.page = 1;
        this.limit = 20;
    }
}
exports.SearchMessagesDto = SearchMessagesDto;
__decorate([
    (0, class_validator_1.IsString)({ message: 'Search query must be a string' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Search query is required' }),
    (0, class_validator_1.MaxLength)(200, { message: 'Search query cannot exceed 200 characters' }),
    __metadata("design:type", String)
], SearchMessagesDto.prototype, "q", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)({}, { message: 'Invalid date format for from date' }),
    __metadata("design:type", String)
], SearchMessagesDto.prototype, "from", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)({}, { message: 'Invalid date format for to date' }),
    __metadata("design:type", String)
], SearchMessagesDto.prototype, "to", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Sender must be a string' }),
    (0, class_validator_1.IsUUID)('4', { message: 'Invalid sender user ID format' }),
    __metadata("design:type", String)
], SearchMessagesDto.prototype, "sender", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)({ message: 'Page must be an integer' }),
    (0, class_validator_1.Min)(1, { message: 'Page must be at least 1' }),
    (0, class_validator_1.Max)(10000, { message: 'Page cannot exceed 10000' }),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], SearchMessagesDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)({ message: 'Limit must be an integer' }),
    (0, class_validator_1.Min)(1, { message: 'Limit must be at least 1' }),
    (0, class_validator_1.Max)(100, { message: 'Limit cannot exceed 100' }),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], SearchMessagesDto.prototype, "limit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Channel ID must be a string' }),
    (0, class_validator_1.IsUUID)('4', { message: 'Invalid channel ID format' }),
    __metadata("design:type", String)
], SearchMessagesDto.prototype, "channelId", void 0);


/***/ }),
/* 53 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UpdateReportStatusDto = exports.ReportChannelDto = exports.ReportReason = exports.ReportStatus = void 0;
const class_validator_1 = __webpack_require__(23);
const sanitize_decorator_1 = __webpack_require__(24);
var ReportStatus;
(function (ReportStatus) {
    ReportStatus["PENDING"] = "pending";
    ReportStatus["INVESTIGATING"] = "investigating";
    ReportStatus["RESOLVED"] = "resolved";
    ReportStatus["DISMISSED"] = "dismissed";
})(ReportStatus || (exports.ReportStatus = ReportStatus = {}));
var ReportReason;
(function (ReportReason) {
    ReportReason["SPAM"] = "spam";
    ReportReason["HARASSMENT"] = "harassment";
    ReportReason["INAPPROPRIATE_CONTENT"] = "inappropriate_content";
    ReportReason["IMPERSONATION"] = "impersonation";
    ReportReason["OTHER"] = "other";
})(ReportReason || (exports.ReportReason = ReportReason = {}));
class ReportChannelDto {
}
exports.ReportChannelDto = ReportChannelDto;
__decorate([
    (0, class_validator_1.IsString)({ message: 'Reason must be a string' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Reason is required' }),
    (0, class_validator_1.MaxLength)(1000, { message: 'Reason cannot exceed 1000 characters' }),
    (0, sanitize_decorator_1.SanitizePlainText)(),
    __metadata("design:type", String)
], ReportChannelDto.prototype, "reason", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(ReportReason, { message: 'Invalid report reason category' }),
    __metadata("design:type", String)
], ReportChannelDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Reported message ID must be a string' }),
    (0, class_validator_1.IsUUID)('4', { message: 'Invalid message ID' }),
    __metadata("design:type", String)
], ReportChannelDto.prototype, "messageId", void 0);
class UpdateReportStatusDto {
}
exports.UpdateReportStatusDto = UpdateReportStatusDto;
__decorate([
    (0, class_validator_1.IsString)({ message: 'Status must be a string' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Status is required' }),
    (0, class_validator_1.IsEnum)(ReportStatus, { message: 'Status must be one of: pending, investigating, resolved, dismissed' }),
    __metadata("design:type", String)
], UpdateReportStatusDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Resolution must be a string' }),
    (0, class_validator_1.MaxLength)(2000, { message: 'Resolution cannot exceed 2000 characters' }),
    (0, sanitize_decorator_1.SanitizeHtml)(),
    __metadata("design:type", String)
], UpdateReportStatusDto.prototype, "resolution", void 0);


/***/ }),
/* 54 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TypingEventDto = exports.TypingIndicatorDto = exports.ChannelReadStatusDto = exports.ReadReceiptResponseDto = exports.MarkMessagesReadDto = exports.MarkMessageReadDto = void 0;
const class_validator_1 = __webpack_require__(23);
class MarkMessageReadDto {
}
exports.MarkMessageReadDto = MarkMessageReadDto;
__decorate([
    (0, class_validator_1.IsString)({ message: 'Message ID must be a string' }),
    (0, class_validator_1.IsUUID)('4', { message: 'Invalid message ID' }),
    __metadata("design:type", String)
], MarkMessageReadDto.prototype, "messageId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Channel ID must be a string' }),
    (0, class_validator_1.IsUUID)('4', { message: 'Invalid channel ID' }),
    __metadata("design:type", String)
], MarkMessageReadDto.prototype, "channelId", void 0);
class MarkMessagesReadDto {
}
exports.MarkMessagesReadDto = MarkMessagesReadDto;
__decorate([
    (0, class_validator_1.IsArray)({ message: 'Message IDs must be an array' }),
    (0, class_validator_1.ArrayMaxSize)(100, { message: 'Cannot mark more than 100 messages as read at once' }),
    (0, class_validator_1.IsString)({ each: true, message: 'Each message ID must be a string' }),
    (0, class_validator_1.IsUUID)('4', { each: true, message: 'Invalid message ID in array' }),
    __metadata("design:type", Array)
], MarkMessagesReadDto.prototype, "messageIds", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'Channel ID must be a string' }),
    (0, class_validator_1.IsUUID)('4', { message: 'Invalid channel ID' }),
    __metadata("design:type", String)
], MarkMessagesReadDto.prototype, "channelId", void 0);
class ReadReceiptResponseDto {
}
exports.ReadReceiptResponseDto = ReadReceiptResponseDto;
class ChannelReadStatusDto {
}
exports.ChannelReadStatusDto = ChannelReadStatusDto;
class TypingIndicatorDto {
}
exports.TypingIndicatorDto = TypingIndicatorDto;
class TypingEventDto {
}
exports.TypingEventDto = TypingEventDto;
__decorate([
    (0, class_validator_1.IsString)({ message: 'Channel ID must be a string' }),
    (0, class_validator_1.IsUUID)('4', { message: 'Invalid channel ID' }),
    __metadata("design:type", String)
], TypingEventDto.prototype, "channelId", void 0);


/***/ }),
/* 55 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var MessagingGateway_1;
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MessagingGateway = void 0;
const websockets_1 = __webpack_require__(56);
const socket_io_1 = __webpack_require__(57);
const jwt_1 = __webpack_require__(13);
const common_1 = __webpack_require__(2);
const redis_1 = __webpack_require__(42);
const redis_adapter_1 = __webpack_require__(58);
const config_1 = __webpack_require__(5);
const prisma_service_1 = __webpack_require__(10);
const ws_rate_limit_guard_1 = __webpack_require__(59);
const channel_membership_guard_1 = __webpack_require__(60);
const redis_service_1 = __webpack_require__(61);
const metrics_service_1 = __webpack_require__(30);
const handlers_1 = __webpack_require__(62);
const ws_message_dto_1 = __webpack_require__(68);
let MessagingGateway = MessagingGateway_1 = class MessagingGateway {
    constructor(jwtService, configService, prisma, messageHandler, reactionHandler, typingHandler, channelHandler, metricsService, redisService) {
        this.jwtService = jwtService;
        this.configService = configService;
        this.prisma = prisma;
        this.messageHandler = messageHandler;
        this.reactionHandler = reactionHandler;
        this.typingHandler = typingHandler;
        this.channelHandler = channelHandler;
        this.metricsService = metricsService;
        this.redisService = redisService;
        this.logger = new common_1.Logger(MessagingGateway_1.name);
        this.rateLimits = new Map();
        this.RATE_LIMITS = {
            'message:send': { max: 30, windowMs: 60000 },
            'message:edit': { max: 20, windowMs: 60000 },
            'message:delete': { max: 10, windowMs: 60000 },
            'typing:start': { max: 60, windowMs: 60000 },
            'typing:stop': { max: 60, windowMs: 60000 },
            'channel:join': { max: 10, windowMs: 60000 },
            'reaction:add': { max: 30, windowMs: 60000 },
            'reaction:remove': { max: 20, windowMs: 60000 },
        };
    }
    async afterInit(server) {
        try {
            const redisUrl = this.configService.get('REDIS_URL') || 'redis://localhost:6379';
            this.pubClient = (0, redis_1.createClient)({ url: redisUrl });
            this.subClient = this.pubClient.duplicate();
            await Promise.all([
                this.pubClient.connect(),
                this.subClient.connect(),
            ]);
            server.adapter = (0, redis_adapter_1.createAdapter)(this.pubClient, this.subClient);
            this.logger.log('✅ Redis adapter configured for WebSocket scaling');
        }
        catch (error) {
            this.logger.warn('⚠️ Redis adapter not configured - WebSocket scaling will be limited:', error.message);
        }
    }
    async handleConnection(client) {
        try {
            const token = client.handshake.auth?.token;
            if (!token) {
                this.logger.warn(`Connection rejected: No token provided (${client.id})`);
                client.disconnect();
                return;
            }
            const secret = this.configService.get('JWT_SECRET');
            if (!secret) {
                throw new common_1.UnauthorizedException('JWT_SECRET not configured');
            }
            const payload = this.jwtService.verify(token, { secret });
            client.user = payload;
            const jti = payload.jti;
            if (jti) {
                const isDenied = await this.redisService.get(`denylist:${jti}`);
                if (isDenied) {
                    this.logger.warn(`Denied token attempted WebSocket connection: ${jti}`);
                    client.disconnect();
                    return;
                }
            }
            this.rateLimits.set(client.id, new Map());
            if (payload.roles.includes('admin')) {
                client.join('admin-global');
            }
            const channels = await this.prisma.channelMember.findMany({
                where: { userId: payload.sub, isBanned: false },
                select: { channelId: true },
            });
            const channelRooms = channels.map(c => `channel:${c.channelId}`);
            for (const room of channelRooms) {
                client.join(room);
            }
            if (channelRooms.length > 0) {
                this.server.to(channelRooms).to('admin-global').emit('user:online', { userId: payload.sub });
            }
            else {
                this.server.to('admin-global').emit('user:online', { userId: payload.sub });
            }
            this.metricsService.recordWsConnection(payload.sub);
            const primaryRole = payload.roles[0] || 'unknown';
            this.metricsService.recordWsEvent('connection');
            this.logger.log(`🟢 ${payload.email} connected (${client.id})`);
        }
        catch (err) {
            this.logger.warn(`❌ WS auth failed for ${client.id}:`, err.message);
            client.disconnect();
        }
    }
    async handleDisconnect(client) {
        this.rateLimits.delete(client.id);
        if (client.user) {
            try {
                const channels = await this.prisma.channelMember.findMany({
                    where: { userId: client.user.sub },
                    select: { channelId: true },
                });
                const rooms = channels.map(c => `channel:${c.channelId}`);
                if (rooms.length > 0) {
                    this.server.to(rooms).to('admin-global').emit('user:offline', { userId: client.user.sub });
                }
                else {
                    this.server.to('admin-global').emit('user:offline', { userId: client.user.sub });
                }
                this.metricsService.recordWsDisconnection(client.user.sub);
                this.metricsService.recordWsEvent('disconnection');
                this.logger.log(`🔴 ${client.user.email} disconnected`);
            }
            catch (error) {
                this.logger.error('Error during disconnect:', error.message);
            }
        }
    }
    checkRateLimit(socketId, event) {
        const limits = this.rateLimits.get(socketId);
        if (!limits)
            return false;
        const config = this.RATE_LIMITS[event];
        if (!config)
            return true;
        const now = Date.now();
        const entry = limits.get(event);
        if (!entry || now > entry.resetTime) {
            limits.set(event, {
                count: 1,
                resetTime: now + config.windowMs,
            });
            return true;
        }
        if (entry.count >= config.max) {
            return false;
        }
        entry.count++;
        return true;
    }
    async handleSendMessage(client, data) {
        if (!this.checkRateLimit(client.id, 'message:send')) {
            this.metricsService.recordRateLimit('message:send', client.user?.roles?.[0] || 'unknown');
            return { success: false, error: 'Rate limit exceeded. Please slow down.' };
        }
        const result = await this.messageHandler.handleSendMessage(this.server, client, data);
        if (result.success) {
            const senderRole = client.user?.roles?.[0] || 'unknown';
            this.metricsService.recordMessageSent(data.channelId ? 'channel' : 'direct', senderRole);
            this.metricsService.recordWsEvent('message:send');
        }
        return result;
    }
    async handleEditMessage(client, data) {
        if (!this.checkRateLimit(client.id, 'message:edit')) {
            return { success: false, error: 'Rate limit exceeded. Please slow down.' };
        }
        return this.messageHandler.handleEditMessage(this.server, client, data);
    }
    async handleDeleteMessage(client, data) {
        if (!this.checkRateLimit(client.id, 'message:delete')) {
            return { success: false, error: 'Rate limit exceeded. Please slow down.' };
        }
        return this.messageHandler.handleDeleteMessage(this.server, client, data);
    }
    async handleMessageRead(client, data) {
        return this.messageHandler.handleMessageRead(this.server, client, data);
    }
    async handleMessagesReadBulk(client, data) {
        return this.messageHandler.handleMessagesReadBulk(this.server, client, data);
    }
    async handleTypingStart(client, data) {
        if (!this.checkRateLimit(client.id, 'typing:start')) {
            return;
        }
        return this.typingHandler.handleTypingStart(client, data);
    }
    async handleTypingStop(client, data) {
        if (!this.checkRateLimit(client.id, 'typing:stop')) {
            return;
        }
        return this.typingHandler.handleTypingStop(client, data);
    }
    async handleGetTypingUsers(client, data) {
        return this.typingHandler.handleGetTypingUsers(client, data);
    }
    async handleJoinChannel(client, data) {
        if (!this.checkRateLimit(client.id, 'channel:join')) {
            return { success: false, error: 'Rate limit exceeded' };
        }
        return this.channelHandler.handleJoinChannel(client, data);
    }
    async handleAddReaction(client, data) {
        if (!this.checkRateLimit(client.id, 'reaction:add')) {
            return { success: false, error: 'Rate limit exceeded. Please slow down.' };
        }
        return this.reactionHandler.handleAddReaction(this.server, client, data);
    }
    async handleRemoveReaction(client, data) {
        if (!this.checkRateLimit(client.id, 'reaction:remove')) {
            return { success: false, error: 'Rate limit exceeded. Please slow down.' };
        }
        return this.reactionHandler.handleRemoveReaction(this.server, client, data);
    }
    emitToChannel(channelId, event, data) {
        this.server.to(`channel:${channelId}`).emit(event, data);
    }
    getOnlineUsers() {
        return Array.from(this.server.sockets.sockets.keys());
    }
};
exports.MessagingGateway = MessagingGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", typeof (_k = typeof socket_io_1.Server !== "undefined" && socket_io_1.Server) === "function" ? _k : Object)
], MessagingGateway.prototype, "server", void 0);
__decorate([
    (0, common_1.UseGuards)(ws_rate_limit_guard_1.WsRateLimitGuard, channel_membership_guard_1.ChannelMembershipGuard),
    (0, websockets_1.SubscribeMessage)('message:send'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeof (_l = typeof ws_message_dto_1.WsSendMessageDto !== "undefined" && ws_message_dto_1.WsSendMessageDto) === "function" ? _l : Object]),
    __metadata("design:returntype", Promise)
], MessagingGateway.prototype, "handleSendMessage", null);
__decorate([
    (0, common_1.UseGuards)(ws_rate_limit_guard_1.WsRateLimitGuard, channel_membership_guard_1.ChannelMembershipGuard),
    (0, websockets_1.SubscribeMessage)('message:edit'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeof (_m = typeof ws_message_dto_1.WsEditMessageDto !== "undefined" && ws_message_dto_1.WsEditMessageDto) === "function" ? _m : Object]),
    __metadata("design:returntype", Promise)
], MessagingGateway.prototype, "handleEditMessage", null);
__decorate([
    (0, common_1.UseGuards)(ws_rate_limit_guard_1.WsRateLimitGuard, channel_membership_guard_1.ChannelMembershipGuard),
    (0, websockets_1.SubscribeMessage)('message:delete'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeof (_o = typeof ws_message_dto_1.WsDeleteMessageDto !== "undefined" && ws_message_dto_1.WsDeleteMessageDto) === "function" ? _o : Object]),
    __metadata("design:returntype", Promise)
], MessagingGateway.prototype, "handleDeleteMessage", null);
__decorate([
    (0, common_1.UseGuards)(ws_rate_limit_guard_1.WsRateLimitGuard, channel_membership_guard_1.ChannelMembershipGuard),
    (0, websockets_1.SubscribeMessage)('message:read'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeof (_p = typeof ws_message_dto_1.WsReadReceiptDto !== "undefined" && ws_message_dto_1.WsReadReceiptDto) === "function" ? _p : Object]),
    __metadata("design:returntype", Promise)
], MessagingGateway.prototype, "handleMessageRead", null);
__decorate([
    (0, common_1.UseGuards)(ws_rate_limit_guard_1.WsRateLimitGuard, channel_membership_guard_1.ChannelMembershipGuard),
    (0, websockets_1.SubscribeMessage)('message:read_bulk'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeof (_q = typeof ws_message_dto_1.WsReadBulkDto !== "undefined" && ws_message_dto_1.WsReadBulkDto) === "function" ? _q : Object]),
    __metadata("design:returntype", Promise)
], MessagingGateway.prototype, "handleMessagesReadBulk", null);
__decorate([
    (0, common_1.UseGuards)(ws_rate_limit_guard_1.WsRateLimitGuard, channel_membership_guard_1.ChannelMembershipGuard),
    (0, websockets_1.SubscribeMessage)('typing:start'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MessagingGateway.prototype, "handleTypingStart", null);
__decorate([
    (0, common_1.UseGuards)(ws_rate_limit_guard_1.WsRateLimitGuard, channel_membership_guard_1.ChannelMembershipGuard),
    (0, websockets_1.SubscribeMessage)('typing:stop'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MessagingGateway.prototype, "handleTypingStop", null);
__decorate([
    (0, common_1.UseGuards)(ws_rate_limit_guard_1.WsRateLimitGuard, channel_membership_guard_1.ChannelMembershipGuard),
    (0, websockets_1.SubscribeMessage)('typing:get'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeof (_r = typeof ws_message_dto_1.WsGetTypingDto !== "undefined" && ws_message_dto_1.WsGetTypingDto) === "function" ? _r : Object]),
    __metadata("design:returntype", Promise)
], MessagingGateway.prototype, "handleGetTypingUsers", null);
__decorate([
    (0, common_1.UseGuards)(ws_rate_limit_guard_1.WsRateLimitGuard, channel_membership_guard_1.ChannelMembershipGuard),
    (0, websockets_1.SubscribeMessage)('channel:join'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeof (_s = typeof ws_message_dto_1.WsJoinChannelDto !== "undefined" && ws_message_dto_1.WsJoinChannelDto) === "function" ? _s : Object]),
    __metadata("design:returntype", Promise)
], MessagingGateway.prototype, "handleJoinChannel", null);
__decorate([
    (0, common_1.UseGuards)(ws_rate_limit_guard_1.WsRateLimitGuard, channel_membership_guard_1.ChannelMembershipGuard),
    (0, websockets_1.SubscribeMessage)('reaction:add'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeof (_t = typeof ws_message_dto_1.WsReactionDto !== "undefined" && ws_message_dto_1.WsReactionDto) === "function" ? _t : Object]),
    __metadata("design:returntype", Promise)
], MessagingGateway.prototype, "handleAddReaction", null);
__decorate([
    (0, common_1.UseGuards)(ws_rate_limit_guard_1.WsRateLimitGuard, channel_membership_guard_1.ChannelMembershipGuard),
    (0, websockets_1.SubscribeMessage)('reaction:remove'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeof (_u = typeof ws_message_dto_1.WsReactionDto !== "undefined" && ws_message_dto_1.WsReactionDto) === "function" ? _u : Object]),
    __metadata("design:returntype", Promise)
], MessagingGateway.prototype, "handleRemoveReaction", null);
exports.MessagingGateway = MessagingGateway = MessagingGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: (origin, callback) => {
                const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
                    'http://localhost:5173',
                    'http://localhost:4173',
                ];
                const isLocalhost = origin && /^http:\/\/localhost:\d+$/.test(origin);
                if (!origin || allowedOrigins.includes(origin) || isLocalhost) {
                    callback(null, true);
                }
                else {
                    callback(new Error('Not allowed by CORS'), false);
                }
            },
            credentials: true,
        },
        namespace: '/messaging',
        pingTimeout: 60000,
        pingInterval: 25000,
        transports: ['websocket', 'polling'],
    }),
    __metadata("design:paramtypes", [typeof (_a = typeof jwt_1.JwtService !== "undefined" && jwt_1.JwtService) === "function" ? _a : Object, typeof (_b = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _b : Object, typeof (_c = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _c : Object, typeof (_d = typeof handlers_1.MessageHandler !== "undefined" && handlers_1.MessageHandler) === "function" ? _d : Object, typeof (_e = typeof handlers_1.ReactionHandler !== "undefined" && handlers_1.ReactionHandler) === "function" ? _e : Object, typeof (_f = typeof handlers_1.TypingHandler !== "undefined" && handlers_1.TypingHandler) === "function" ? _f : Object, typeof (_g = typeof handlers_1.ChannelHandler !== "undefined" && handlers_1.ChannelHandler) === "function" ? _g : Object, typeof (_h = typeof metrics_service_1.MetricsService !== "undefined" && metrics_service_1.MetricsService) === "function" ? _h : Object, typeof (_j = typeof redis_service_1.RedisService !== "undefined" && redis_service_1.RedisService) === "function" ? _j : Object])
], MessagingGateway);


/***/ }),
/* 56 */
/***/ ((module) => {

module.exports = require("@nestjs/websockets");

/***/ }),
/* 57 */
/***/ ((module) => {

module.exports = require("socket.io");

/***/ }),
/* 58 */
/***/ ((module) => {

module.exports = require("@socket.io/redis-adapter");

/***/ }),
/* 59 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var WsRateLimitGuard_1;
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.WsRateLimitGuard = void 0;
const common_1 = __webpack_require__(2);
const core_1 = __webpack_require__(1);
let WsRateLimitGuard = WsRateLimitGuard_1 = class WsRateLimitGuard {
    constructor(reflector) {
        this.reflector = reflector;
        this.logger = new common_1.Logger(WsRateLimitGuard_1.name);
        this.userLimits = new Map();
        this.rateLimits = {
            'message:send': { interval: 60000, maxRequests: 30 },
            'message:edit': { interval: 60000, maxRequests: 20 },
            'message:delete': { interval: 60000, maxRequests: 10 },
            'message:read': { interval: 60000, maxRequests: 120 },
            'message:read_bulk': { interval: 60000, maxRequests: 30 },
            'typing:start': { interval: 60000, maxRequests: 60 },
            'typing:stop': { interval: 60000, maxRequests: 60 },
            'typing:get': { interval: 60000, maxRequests: 60 },
            'channel:join': { interval: 60000, maxRequests: 20 },
            'reaction:add': { interval: 60000, maxRequests: 50 },
            'reaction:remove': { interval: 60000, maxRequests: 50 },
            'default': { interval: 60000, maxRequests: 100 },
        };
        this.cleanupInterval = setInterval(() => this.cleanup(), 300000);
    }
    canActivate(context) {
        const wsContext = context.switchToWs();
        const client = wsContext.getClient();
        const event = wsContext.getPattern();
        const userId = client.user?.sub;
        if (!userId) {
            this.logger.warn(`Rate limit check failed: no user ID for event ${event}`);
            return false;
        }
        const config = this.rateLimits[event] || this.rateLimits['default'];
        const now = Date.now();
        let userLimit = this.userLimits.get(userId);
        if (!userLimit) {
            userLimit = { requests: [] };
            this.userLimits.set(userId, userLimit);
        }
        const windowStart = now - config.interval;
        userLimit.requests = userLimit.requests.filter(timestamp => timestamp > windowStart);
        if (userLimit.requests.length >= config.maxRequests) {
            const oldestRequest = userLimit.requests[0];
            const retryAfter = Math.ceil((oldestRequest + config.interval - now) / 1000);
            this.logger.warn(`Rate limit exceeded for user ${userId} on event ${event}. Retry after ${retryAfter}s`);
            if (client.emit) {
                client.emit('error:rate-limit', {
                    event,
                    retryAfter,
                    limit: config.maxRequests,
                    window: config.interval,
                    message: `Rate limit exceeded. Please wait ${retryAfter} seconds before trying again.`,
                });
            }
            return false;
        }
        userLimit.requests.push(now);
        return true;
    }
    getRateLimitStatus(userId, event = 'default') {
        const config = this.rateLimits[event] || this.rateLimits['default'];
        const userLimit = this.userLimits.get(userId);
        const now = Date.now();
        if (!userLimit) {
            return {
                remaining: config.maxRequests,
                limit: config.maxRequests,
                resetAt: now + config.interval,
                window: config.interval,
            };
        }
        const windowStart = now - config.interval;
        const requestsInWindow = userLimit.requests.filter(timestamp => timestamp > windowStart);
        const oldestRequest = requestsInWindow[0] || now;
        return {
            remaining: Math.max(0, config.maxRequests - requestsInWindow.length),
            limit: config.maxRequests,
            resetAt: oldestRequest + config.interval,
            window: config.interval,
        };
    }
    cleanup() {
        const now = Date.now();
        const maxInterval = Math.max(...Object.values(this.rateLimits).map(c => c.interval));
        const cutoff = now - maxInterval * 2;
        let cleanedCount = 0;
        for (const [userId, userLimit] of this.userLimits.entries()) {
            userLimit.requests = userLimit.requests.filter(timestamp => timestamp > cutoff);
            if (userLimit.requests.length === 0) {
                this.userLimits.delete(userId);
                cleanedCount++;
            }
        }
        if (cleanedCount > 0) {
            this.logger.debug(`Cleaned up ${cleanedCount} inactive rate limit entries`);
        }
    }
    resetRateLimit(userId) {
        this.userLimits.delete(userId);
        this.logger.log(`Rate limit reset for user ${userId}`);
    }
    getStats() {
        let totalRequests = 0;
        for (const userLimit of this.userLimits.values()) {
            totalRequests += userLimit.requests.length;
        }
        return {
            trackedUsers: this.userLimits.size,
            totalRequests,
            events: Object.entries(this.rateLimits).reduce((acc, [key, config]) => {
                acc[key] = { limit: config.maxRequests, window: config.interval };
                return acc;
            }, {}),
        };
    }
    onApplicationShutdown() {
        clearInterval(this.cleanupInterval);
        this.userLimits.clear();
    }
};
exports.WsRateLimitGuard = WsRateLimitGuard;
exports.WsRateLimitGuard = WsRateLimitGuard = WsRateLimitGuard_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof core_1.Reflector !== "undefined" && core_1.Reflector) === "function" ? _a : Object])
], WsRateLimitGuard);


/***/ }),
/* 60 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ChannelMembershipGuard_1;
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ChannelMembershipGuard = void 0;
const common_1 = __webpack_require__(2);
const prisma_service_1 = __webpack_require__(10);
let ChannelMembershipGuard = ChannelMembershipGuard_1 = class ChannelMembershipGuard {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(ChannelMembershipGuard_1.name);
    }
    async canActivate(context) {
        const wsContext = context.switchToWs();
        const client = wsContext.getClient();
        const data = wsContext.getData();
        const userId = client.user?.sub;
        if (!userId) {
            this.logger.warn('Channel membership check failed: no user ID');
            return false;
        }
        const channelId = data.channelId || data.message?.channelId;
        if (!channelId) {
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
                if (client.emit) {
                    client.emit('error:channel-membership', {
                        channelId,
                        message: 'You are not a member of this channel',
                    });
                }
                return false;
            }
            return true;
        }
        catch (error) {
            this.logger.error('Error checking channel membership:', error.message);
            return false;
        }
    }
};
exports.ChannelMembershipGuard = ChannelMembershipGuard;
exports.ChannelMembershipGuard = ChannelMembershipGuard = ChannelMembershipGuard_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], ChannelMembershipGuard);


/***/ }),
/* 61 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var RedisService_1;
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RedisService = void 0;
const common_1 = __webpack_require__(2);
const config_1 = __webpack_require__(5);
const ioredis_1 = __importDefault(__webpack_require__(21));
let RedisService = RedisService_1 = class RedisService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(RedisService_1.name);
        this.client = null;
        this.isAvailable = false;
    }
    async onModuleInit() {
        try {
            const redisUrl = this.configService.get('REDIS_URL') || 'redis://localhost:6379';
            this.client = new ioredis_1.default(redisUrl, {
                retryStrategy: (times) => {
                    if (times > 3) {
                        this.logger.warn('Redis connection failed after 3 retries, continuing without cache');
                        return null;
                    }
                    return Math.min(times * 100, 3000);
                },
                maxRetriesPerRequest: 3,
                enableOfflineQueue: false,
            });
            this.client.on('connect', () => {
                this.isAvailable = true;
                this.logger.log('Redis connection established');
            });
            this.client.on('error', (err) => {
                this.isAvailable = false;
                this.logger.warn(`Redis error: ${err.message}`);
            });
            await this.client.ping();
        }
        catch (error) {
            this.logger.warn(`Redis not available, analytics will work without caching: ${error.message}`);
            this.isAvailable = false;
        }
    }
    async onModuleDestroy() {
        if (this.client) {
            await this.client.quit();
            this.logger.log('Redis connection closed');
        }
    }
    async get(key) {
        if (!this.isAvailable || !this.client)
            return null;
        try {
            return await this.client.get(key);
        }
        catch {
            return null;
        }
    }
    async set(key, value, ttl) {
        if (!this.isAvailable || !this.client)
            return;
        try {
            if (ttl) {
                await this.client.setex(key, ttl, value);
            }
            else {
                await this.client.set(key, value);
            }
        }
        catch {
        }
    }
    async del(key) {
        if (!this.isAvailable || !this.client)
            return;
        try {
            await this.client.del(key);
        }
        catch {
        }
    }
    async flushdb() {
        if (!this.isAvailable || !this.client)
            return;
        try {
            await this.client.flushdb();
        }
        catch {
        }
    }
    getClient() {
        return this.client;
    }
    isConnected() {
        return this.isAvailable;
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = RedisService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object])
], RedisService);


/***/ }),
/* 62 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ChannelHandler = exports.TypingHandler = exports.ReactionHandler = exports.MessageHandler = void 0;
var message_handler_1 = __webpack_require__(63);
Object.defineProperty(exports, "MessageHandler", ({ enumerable: true, get: function () { return message_handler_1.MessageHandler; } }));
var reaction_handler_1 = __webpack_require__(64);
Object.defineProperty(exports, "ReactionHandler", ({ enumerable: true, get: function () { return reaction_handler_1.ReactionHandler; } }));
var typing_handler_1 = __webpack_require__(65);
Object.defineProperty(exports, "TypingHandler", ({ enumerable: true, get: function () { return typing_handler_1.TypingHandler; } }));
var channel_handler_1 = __webpack_require__(67);
Object.defineProperty(exports, "ChannelHandler", ({ enumerable: true, get: function () { return channel_handler_1.ChannelHandler; } }));


/***/ }),
/* 63 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MessageHandler_1;
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MessageHandler = void 0;
const common_1 = __webpack_require__(2);
const messaging_service_1 = __webpack_require__(44);
const prisma_service_1 = __webpack_require__(10);
let MessageHandler = MessageHandler_1 = class MessageHandler {
    constructor(messagingService, prisma) {
        this.messagingService = messagingService;
        this.prisma = prisma;
        this.logger = new common_1.Logger(MessageHandler_1.name);
    }
    async handleSendMessage(server, client, data) {
        if (!client.user) {
            return { success: false, error: 'Not authenticated' };
        }
        try {
            const message = await this.messagingService.sendMessage(data.channelId, client.user.sub, { content: data.content, replyTo: data.replyTo });
            server.to(`channel:${data.channelId}`).emit('message:new', message);
            return { success: true, message };
        }
        catch (err) {
            this.logger.error('Error sending message:', err.message);
            return { success: false, error: err.message };
        }
    }
    async handleEditMessage(server, client, data) {
        if (!client.user) {
            return { success: false, error: 'Not authenticated' };
        }
        try {
            const message = await this.messagingService.editMessage(data.messageId, client.user.sub, data.content);
            server.to(`channel:${message.channelId}`).emit('message:updated', {
                type: 'updated',
                messageId: message.id,
                content: message.content,
                editedAt: message.editedAt,
                channelId: message.channelId,
            });
            return { success: true, message };
        }
        catch (err) {
            this.logger.error('Error editing message:', err.message);
            return { success: false, error: err.message };
        }
    }
    async handleDeleteMessage(server, client, data) {
        if (!client.user) {
            return { success: false, error: 'Not authenticated' };
        }
        try {
            const original = await this.prisma.message.findUnique({
                where: { id: data.messageId },
            });
            if (!original) {
                return { success: false, error: 'Message not found' };
            }
            await this.messagingService.deleteMessage(data.messageId, client.user.sub, client.user.roles);
            server.to(`channel:${original.channelId}`).emit('message:deleted', {
                type: 'deleted',
                messageId: data.messageId,
                channelId: original.channelId,
            });
            return { success: true };
        }
        catch (err) {
            this.logger.error('Error deleting message:', err.message);
            return { success: false, error: err.message };
        }
    }
    async handleMessageRead(server, client, data) {
        if (!client.user) {
            return { success: false, error: 'Not authenticated' };
        }
        try {
            await this.prisma.messageRead.upsert({
                where: {
                    messageId_userId: {
                        messageId: data.messageId,
                        userId: client.user.sub,
                    },
                },
                create: {
                    messageId: data.messageId,
                    userId: client.user.sub,
                    readAt: new Date(),
                },
                update: { readAt: new Date() },
            });
            server.to(`channel:${data.channelId}`).emit('message:read_receipt', {
                messageId: data.messageId,
                channelId: data.channelId,
                readBy: { userId: client.user.sub, readAt: new Date() },
            });
            return { success: true };
        }
        catch (err) {
            this.logger.error('Error marking message as read:', err.message);
            return { success: false, error: err.message };
        }
    }
    async handleMessagesReadBulk(server, client, data) {
        if (!client.user) {
            return { success: false, error: 'Not authenticated' };
        }
        const userId = client.user.sub;
        try {
            const now = new Date();
            await this.prisma.$transaction(data.messageIds.map((messageId) => this.prisma.messageRead.upsert({
                where: { messageId_userId: { messageId, userId } },
                create: { messageId, userId, readAt: now },
                update: { readAt: now },
            })));
            for (const messageId of data.messageIds) {
                server.to(`channel:${data.channelId}`).emit('message:read_receipt', {
                    messageId,
                    channelId: data.channelId,
                    readBy: { userId, readAt: now },
                });
            }
            return { success: true, count: data.messageIds.length };
        }
        catch (err) {
            this.logger.error('Error marking messages as read:', err.message);
            return { success: false, error: err.message };
        }
    }
};
exports.MessageHandler = MessageHandler;
exports.MessageHandler = MessageHandler = MessageHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof messaging_service_1.MessagingService !== "undefined" && messaging_service_1.MessagingService) === "function" ? _a : Object, typeof (_b = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _b : Object])
], MessageHandler);


/***/ }),
/* 64 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ReactionHandler_1;
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ReactionHandler = void 0;
const common_1 = __webpack_require__(2);
const messaging_service_1 = __webpack_require__(44);
const prisma_service_1 = __webpack_require__(10);
let ReactionHandler = ReactionHandler_1 = class ReactionHandler {
    constructor(messagingService, prisma) {
        this.messagingService = messagingService;
        this.prisma = prisma;
        this.logger = new common_1.Logger(ReactionHandler_1.name);
    }
    async handleAddReaction(server, client, data) {
        if (!client.user) {
            return { success: false, error: 'Not authenticated' };
        }
        try {
            const reaction = await this.messagingService.addReaction(data.messageId, client.user.sub, { reaction: data.reaction });
            const message = await this.prisma.message.findUnique({
                where: { id: data.messageId },
                select: { channelId: true },
            });
            if (message) {
                server.to(`channel:${message.channelId}`).emit('message:reaction_added', {
                    type: 'reaction_added',
                    messageId: data.messageId,
                    reaction: data.reaction,
                    userId: client.user.sub,
                    user: reaction.user,
                    createdAt: reaction.createdAt,
                });
            }
            return { success: true, reaction };
        }
        catch (err) {
            this.logger.error('Error adding reaction:', err.message);
            return { success: false, error: err.message };
        }
    }
    async handleRemoveReaction(server, client, data) {
        if (!client.user) {
            return { success: false, error: 'Not authenticated' };
        }
        try {
            const result = await this.messagingService.removeReaction(data.messageId, client.user.sub, data.reaction);
            const message = await this.prisma.message.findUnique({
                where: { id: data.messageId },
                select: { channelId: true },
            });
            if (message) {
                server.to(`channel:${message.channelId}`).emit('message:reaction_removed', {
                    type: 'reaction_removed',
                    messageId: data.messageId,
                    reaction: data.reaction,
                    userId: client.user.sub,
                });
            }
            return { success: true, result };
        }
        catch (err) {
            this.logger.error('Error removing reaction:', err.message);
            return { success: false, error: err.message };
        }
    }
};
exports.ReactionHandler = ReactionHandler;
exports.ReactionHandler = ReactionHandler = ReactionHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof messaging_service_1.MessagingService !== "undefined" && messaging_service_1.MessagingService) === "function" ? _a : Object, typeof (_b = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _b : Object])
], ReactionHandler);


/***/ }),
/* 65 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var TypingHandler_1;
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TypingHandler = void 0;
const common_1 = __webpack_require__(2);
const typing_service_1 = __webpack_require__(66);
let TypingHandler = TypingHandler_1 = class TypingHandler {
    constructor(typingService) {
        this.typingService = typingService;
        this.logger = new common_1.Logger(TypingHandler_1.name);
    }
    async handleTypingStart(client, data) {
        if (!client.user)
            return;
        const userName = client.user.email?.split('@')[0] || 'Someone';
        const shouldProcess = await this.typingService.shouldProcessTypingEvent(data.channelId, client.user.sub, 2000);
        if (!shouldProcess) {
            return;
        }
        await this.typingService.startTyping(data.channelId, client.user.sub, userName);
        client.to(`channel:${data.channelId}`).emit('typing:update', {
            type: 'start',
            channelId: data.channelId,
            userId: client.user.sub,
            userName: userName,
        });
        client.to(`channel:${data.channelId}`).emit('user:typing', {
            type: 'start',
            channelId: data.channelId,
            userId: client.user.sub,
            userName: userName,
        });
    }
    async handleTypingStop(client, data) {
        if (!client.user)
            return;
        const userName = client.user.email?.split('@')[0] || 'Someone';
        await this.typingService.stopTyping(data.channelId, client.user.sub);
        client.to(`channel:${data.channelId}`).emit('typing:update', {
            type: 'stop',
            channelId: data.channelId,
            userId: client.user.sub,
            userName: userName,
        });
        client.to(`channel:${data.channelId}`).emit('user:typing', {
            type: 'stop',
            channelId: data.channelId,
            userId: client.user.sub,
            userName: userName,
        });
    }
    async handleGetTypingUsers(client, data) {
        if (!client.user) {
            return { success: false, error: 'Not authenticated' };
        }
        try {
            const typingUsers = await this.typingService.getTypingUsers(data.channelId, client.user.sub);
            return {
                success: true,
                channelId: data.channelId,
                users: typingUsers,
            };
        }
        catch (err) {
            this.logger.error('Error getting typing users:', err.message);
            return { success: false, error: err.message };
        }
    }
};
exports.TypingHandler = TypingHandler;
exports.TypingHandler = TypingHandler = TypingHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof typing_service_1.TypingService !== "undefined" && typing_service_1.TypingService) === "function" ? _a : Object])
], TypingHandler);


/***/ }),
/* 66 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var TypingService_1;
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TypingService = void 0;
const common_1 = __webpack_require__(2);
const config_1 = __webpack_require__(5);
const common_2 = __webpack_require__(2);
const redis_module_1 = __webpack_require__(41);
const redis_1 = __webpack_require__(42);
let TypingService = TypingService_1 = class TypingService {
    constructor(redisClient, configService) {
        this.redisClient = redisClient;
        this.configService = configService;
        this.logger = new common_1.Logger(TypingService_1.name);
        this.TYPING_TTL_SECONDS = 5;
        this.TYPING_PREFIX = 'typing:';
        this.memoryTypingStore = new Map();
        this.memoryDebounceStore = new Map();
        this.cleanupInterval = setInterval(() => this.cleanupExpiredTyping(), 10000);
    }
    onModuleDestroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
    }
    getTypingKey(channelId) {
        return `${this.TYPING_PREFIX}${channelId}`;
    }
    isRedisAvailable() {
        return this.redisClient?.isReady || false;
    }
    async startTyping(channelId, userId, userName) {
        const key = this.getTypingKey(channelId);
        const typingData = {
            userId,
            userName,
            startedAt: Date.now(),
        };
        try {
            if (this.isRedisAvailable()) {
                await this.redisClient.hSet(key, userId, JSON.stringify(typingData));
                await this.redisClient.expire(key, this.TYPING_TTL_SECONDS);
            }
            else {
                if (!this.memoryTypingStore.has(channelId)) {
                    this.memoryTypingStore.set(channelId, new Map());
                }
                this.memoryTypingStore.get(channelId).set(userId, typingData);
            }
        }
        catch (error) {
            this.logger.error(`Error recording typing start for user ${userId}:`, error.message);
            if (!this.memoryTypingStore.has(channelId)) {
                this.memoryTypingStore.set(channelId, new Map());
            }
            this.memoryTypingStore.get(channelId).set(userId, typingData);
        }
    }
    async stopTyping(channelId, userId) {
        const key = this.getTypingKey(channelId);
        try {
            if (this.isRedisAvailable()) {
                await this.redisClient.hDel(key, userId);
            }
            const channelTyping = this.memoryTypingStore.get(channelId);
            if (channelTyping) {
                channelTyping.delete(userId);
                if (channelTyping.size === 0) {
                    this.memoryTypingStore.delete(channelId);
                }
            }
        }
        catch (error) {
            this.logger.error(`Error recording typing stop for user ${userId}:`, error.message);
        }
    }
    async getTypingUsers(channelId, excludeUserId) {
        const key = this.getTypingKey(channelId);
        const now = Date.now();
        const validTypingUsers = [];
        try {
            if (this.isRedisAvailable()) {
                const typingData = await this.redisClient.hGetAll(key);
                for (const [userId, dataStr] of Object.entries(typingData)) {
                    if (userId === excludeUserId)
                        continue;
                    try {
                        const data = JSON.parse(dataStr);
                        if (now - data.startedAt < this.TYPING_TTL_SECONDS * 1000) {
                            validTypingUsers.push(data);
                        }
                    }
                    catch (e) {
                    }
                }
            }
            const memoryChannel = this.memoryTypingStore.get(channelId);
            if (memoryChannel) {
                for (const [userId, data] of memoryChannel.entries()) {
                    if (userId === excludeUserId)
                        continue;
                    if (!validTypingUsers.find(u => u.userId === userId) &&
                        now - data.startedAt < this.TYPING_TTL_SECONDS * 1000) {
                        validTypingUsers.push(data);
                    }
                }
            }
        }
        catch (error) {
            this.logger.error(`Error getting typing users for channel ${channelId}:`, error.message);
        }
        return validTypingUsers;
    }
    cleanupExpiredTyping() {
        const now = Date.now();
        for (const [channelId, users] of this.memoryTypingStore.entries()) {
            for (const [userId, data] of users.entries()) {
                if (now - data.startedAt > this.TYPING_TTL_SECONDS * 1000) {
                    users.delete(userId);
                }
            }
            if (users.size === 0) {
                this.memoryTypingStore.delete(channelId);
            }
        }
    }
    async shouldProcessTypingEvent(channelId, userId, debounceMs = 2000) {
        const key = `typing:debounce:${channelId}:${userId}`;
        try {
            if (this.isRedisAvailable()) {
                const result = await this.redisClient.set(key, '1', {
                    NX: true,
                    EX: Math.ceil(debounceMs / 1000),
                });
                return result === 'OK';
            }
            else {
                const debounceKey = `${channelId}:${userId}`;
                const lastTyped = this.getMemoryDebounce(debounceKey);
                const now = Date.now();
                if (!lastTyped || now - lastTyped > debounceMs) {
                    this.setMemoryDebounce(debounceKey, now);
                    return true;
                }
                return false;
            }
        }
        catch (error) {
            return true;
        }
    }
    getMemoryDebounce(key) {
        return this.memoryDebounceStore.get(key);
    }
    setMemoryDebounce(key, timestamp) {
        this.memoryDebounceStore.set(key, timestamp);
        if (this.memoryDebounceStore.size > 1000) {
            const now = Date.now();
            for (const [k, v] of this.memoryDebounceStore.entries()) {
                if (now - v > 10000) {
                    this.memoryDebounceStore.delete(k);
                }
            }
        }
    }
};
exports.TypingService = TypingService;
exports.TypingService = TypingService = TypingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_2.Inject)(redis_module_1.REDIS_CLIENT)),
    __metadata("design:paramtypes", [typeof (_a = typeof redis_1.RedisClientType !== "undefined" && redis_1.RedisClientType) === "function" ? _a : Object, typeof (_b = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _b : Object])
], TypingService);


/***/ }),
/* 67 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ChannelHandler_1;
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ChannelHandler = void 0;
const common_1 = __webpack_require__(2);
const prisma_service_1 = __webpack_require__(10);
let ChannelHandler = ChannelHandler_1 = class ChannelHandler {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(ChannelHandler_1.name);
    }
    async handleJoinChannel(client, data) {
        if (!client.user) {
            return { success: false, error: 'Not authenticated' };
        }
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
    async handleLeaveChannel(client, data) {
        if (!client.user) {
            return { success: false, error: 'Not authenticated' };
        }
        client.leave(`channel:${data.channelId}`);
        return { success: true };
    }
};
exports.ChannelHandler = ChannelHandler;
exports.ChannelHandler = ChannelHandler = ChannelHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], ChannelHandler);


/***/ }),
/* 68 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.WsGetTypingDto = exports.WsReadBulkDto = exports.WsReadReceiptDto = exports.WsRemoveReactionDto = exports.WsReactionDto = exports.WsTypingDto = exports.WsLeaveChannelDto = exports.WsJoinChannelDto = exports.WsDeleteMessageDto = exports.WsEditMessageDto = exports.WsSendMessageDto = void 0;
const class_validator_1 = __webpack_require__(23);
const create_message_dto_1 = __webpack_require__(50);
class WsSendMessageDto {
}
exports.WsSendMessageDto = WsSendMessageDto;
__decorate([
    (0, class_validator_1.IsString)({ message: 'Channel ID must be a string' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Channel ID is required' }),
    (0, class_validator_1.IsUUID)('4', { message: 'Invalid channel ID' }),
    __metadata("design:type", String)
], WsSendMessageDto.prototype, "channelId", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'Content must be a string' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Content is required' }),
    (0, class_validator_1.MaxLength)(4000, { message: 'Message cannot exceed 4000 characters' }),
    __metadata("design:type", String)
], WsSendMessageDto.prototype, "content", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Reply to must be a string' }),
    (0, class_validator_1.IsUUID)('4', { message: 'Invalid reply message ID' }),
    __metadata("design:type", String)
], WsSendMessageDto.prototype, "replyTo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(create_message_dto_1.ContentType, { message: 'Invalid content type' }),
    __metadata("design:type", typeof (_a = typeof create_message_dto_1.ContentType !== "undefined" && create_message_dto_1.ContentType) === "function" ? _a : Object)
], WsSendMessageDto.prototype, "contentType", void 0);
class WsEditMessageDto {
}
exports.WsEditMessageDto = WsEditMessageDto;
__decorate([
    (0, class_validator_1.IsString)({ message: 'Message ID must be a string' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Message ID is required' }),
    (0, class_validator_1.IsUUID)('4', { message: 'Invalid message ID' }),
    __metadata("design:type", String)
], WsEditMessageDto.prototype, "messageId", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'Content must be a string' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Content is required' }),
    (0, class_validator_1.MaxLength)(4000, { message: 'Message cannot exceed 4000 characters' }),
    __metadata("design:type", String)
], WsEditMessageDto.prototype, "content", void 0);
class WsDeleteMessageDto {
    constructor() {
        this.softDelete = true;
    }
}
exports.WsDeleteMessageDto = WsDeleteMessageDto;
__decorate([
    (0, class_validator_1.IsString)({ message: 'Message ID must be a string' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Message ID is required' }),
    (0, class_validator_1.IsUUID)('4', { message: 'Invalid message ID' }),
    __metadata("design:type", String)
], WsDeleteMessageDto.prototype, "messageId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'Soft delete must be a boolean' }),
    __metadata("design:type", Boolean)
], WsDeleteMessageDto.prototype, "softDelete", void 0);
class WsJoinChannelDto {
}
exports.WsJoinChannelDto = WsJoinChannelDto;
__decorate([
    (0, class_validator_1.IsString)({ message: 'Channel ID must be a string' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Channel ID is required' }),
    (0, class_validator_1.IsUUID)('4', { message: 'Invalid channel ID' }),
    __metadata("design:type", String)
], WsJoinChannelDto.prototype, "channelId", void 0);
class WsLeaveChannelDto {
}
exports.WsLeaveChannelDto = WsLeaveChannelDto;
__decorate([
    (0, class_validator_1.IsString)({ message: 'Channel ID must be a string' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Channel ID is required' }),
    (0, class_validator_1.IsUUID)('4', { message: 'Invalid channel ID' }),
    __metadata("design:type", String)
], WsLeaveChannelDto.prototype, "channelId", void 0);
class WsTypingDto {
}
exports.WsTypingDto = WsTypingDto;
__decorate([
    (0, class_validator_1.IsString)({ message: 'Channel ID must be a string' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Channel ID is required' }),
    (0, class_validator_1.IsUUID)('4', { message: 'Invalid channel ID' }),
    __metadata("design:type", String)
], WsTypingDto.prototype, "channelId", void 0);
class WsReactionDto {
}
exports.WsReactionDto = WsReactionDto;
__decorate([
    (0, class_validator_1.IsString)({ message: 'Message ID must be a string' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Message ID is required' }),
    (0, class_validator_1.IsUUID)('4', { message: 'Invalid message ID' }),
    __metadata("design:type", String)
], WsReactionDto.prototype, "messageId", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'Reaction must be a string' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Reaction is required' }),
    (0, class_validator_1.MaxLength)(50, { message: 'Reaction cannot exceed 50 characters' }),
    __metadata("design:type", String)
], WsReactionDto.prototype, "reaction", void 0);
class WsRemoveReactionDto {
}
exports.WsRemoveReactionDto = WsRemoveReactionDto;
__decorate([
    (0, class_validator_1.IsString)({ message: 'Message ID must be a string' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Message ID is required' }),
    (0, class_validator_1.IsUUID)('4', { message: 'Invalid message ID' }),
    __metadata("design:type", String)
], WsRemoveReactionDto.prototype, "messageId", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'Reaction must be a string' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Reaction is required' }),
    (0, class_validator_1.MaxLength)(50, { message: 'Reaction cannot exceed 50 characters' }),
    __metadata("design:type", String)
], WsRemoveReactionDto.prototype, "reaction", void 0);
class WsReadReceiptDto {
}
exports.WsReadReceiptDto = WsReadReceiptDto;
__decorate([
    (0, class_validator_1.IsString)({ message: 'Message ID must be a string' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Message ID is required' }),
    (0, class_validator_1.IsUUID)('4', { message: 'Invalid message ID' }),
    __metadata("design:type", String)
], WsReadReceiptDto.prototype, "messageId", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'Channel ID must be a string' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Channel ID is required' }),
    (0, class_validator_1.IsUUID)('4', { message: 'Invalid channel ID' }),
    __metadata("design:type", String)
], WsReadReceiptDto.prototype, "channelId", void 0);
class WsReadBulkDto {
}
exports.WsReadBulkDto = WsReadBulkDto;
__decorate([
    (0, class_validator_1.IsString)({ message: 'Channel ID must be a string' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Channel ID is required' }),
    (0, class_validator_1.IsUUID)('4', { message: 'Invalid channel ID' }),
    __metadata("design:type", String)
], WsReadBulkDto.prototype, "channelId", void 0);
__decorate([
    (0, class_validator_1.IsArray)({ message: 'Message IDs must be an array' }),
    (0, class_validator_1.ArrayMaxSize)(100, { message: 'Cannot mark more than 100 messages as read at once' }),
    (0, class_validator_1.IsUUID)('4', { each: true, message: 'Invalid message ID in array' }),
    __metadata("design:type", Array)
], WsReadBulkDto.prototype, "messageIds", void 0);
class WsGetTypingDto {
}
exports.WsGetTypingDto = WsGetTypingDto;
__decorate([
    (0, class_validator_1.IsString)({ message: 'Channel ID must be a string' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Channel ID is required' }),
    (0, class_validator_1.IsUUID)('4', { message: 'Invalid channel ID' }),
    __metadata("design:type", String)
], WsGetTypingDto.prototype, "channelId", void 0);


/***/ }),
/* 69 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c, _d, _e, _f;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ChannelManagementController = void 0;
const common_1 = __webpack_require__(2);
const swagger_1 = __webpack_require__(3);
const channel_management_service_1 = __webpack_require__(70);
const messaging_service_1 = __webpack_require__(44);
const jwt_auth_guard_1 = __webpack_require__(29);
const roles_guard_1 = __webpack_require__(32);
const roles_decorator_1 = __webpack_require__(33);
const create_message_dto_1 = __webpack_require__(50);
let ChannelManagementController = class ChannelManagementController {
    constructor(channelManagementService, messagingService) {
        this.channelManagementService = channelManagementService;
        this.messagingService = messagingService;
    }
    async createChannel(dto, req) {
        return this.channelManagementService.createChannel(dto, req.user.sub, req.user.roles);
    }
    async requestChannel(dto, req) {
        return this.channelManagementService.createDirectMessage({
            type: dto.type,
            name: dto.name,
            description: dto.description,
            memberIds: dto.memberIds,
        }, req.user.sub, req.user.roles);
    }
    async createPodcastChannel(dto, req) {
        return this.channelManagementService.createPodcastChannel(dto.name, dto.description || '', req.user.sub);
    }
    async createClassroomChannel(dto, req) {
        return this.channelManagementService.createClassroomChannel(dto.name, dto.description || '', dto.classId, req.user.sub, dto.maxStudents || 30);
    }
    async getPendingChannels(page, limit, type) {
        return this.channelManagementService.getPendingChannels({ page, limit, type });
    }
    async approveChannel(channelId, req) {
        return this.channelManagementService.approveChannel(channelId, req.user.sub);
    }
    async rejectChannel(channelId, dto, req) {
        return this.channelManagementService.rejectChannel(channelId, req.user.sub, dto.reason);
    }
    async muteUser(channelId, dto, req) {
        return this.channelManagementService.muteUser(channelId, dto, req.user.sub, req.user.roles);
    }
    async muteAllStudents(channelId, dto, req) {
        return this.channelManagementService.muteAllStudents(channelId, req.user.sub, req.user.roles, dto.duration, dto.reason);
    }
    async unmuteUser(channelId, userId, req) {
        return this.channelManagementService.unmuteUser(channelId, userId, req.user.sub, req.user.roles);
    }
    async unmuteAllStudents(channelId, req) {
        return this.channelManagementService.unmuteAllStudents(channelId, req.user.sub, req.user.roles);
    }
    async getChannelMutes(channelId) {
        return this.channelManagementService.getChannelMutes(channelId);
    }
    async getAllConversations(query, req) {
        return this.channelManagementService.getAllConversations({
            page: query.page,
            limit: query.limit,
            type: query.type,
            status: query.status,
            search: query.search,
            dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
            dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
        });
    }
    async getConversationDetails(channelId) {
        return this.channelManagementService.getConversationDetails(channelId);
    }
    async getMyPendingRequests(req) {
        return this.channelManagementService.getAllConversations({
            status: 'pending',
        }).then(result => ({
            channels: result.channels.filter(c => c.createdBy === req.user.sub || c.requestedBy === req.user.sub),
            total: result.channels.filter(c => c.createdBy === req.user.sub || c.requestedBy === req.user.sub).length,
        }));
    }
};
exports.ChannelManagementController = ChannelManagementController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new channel' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_c = typeof create_message_dto_1.CreateChannelDto !== "undefined" && create_message_dto_1.CreateChannelDto) === "function" ? _c : Object, Object]),
    __metadata("design:returntype", Promise)
], ChannelManagementController.prototype, "createChannel", null);
__decorate([
    (0, common_1.Post)('request'),
    (0, swagger_1.ApiOperation)({ summary: 'Request a new conversation (requires admin approval)' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_d = typeof create_message_dto_1.ChannelRequestDto !== "undefined" && create_message_dto_1.ChannelRequestDto) === "function" ? _d : Object, Object]),
    __metadata("design:returntype", Promise)
], ChannelManagementController.prototype, "requestChannel", null);
__decorate([
    (0, common_1.Post)('podcast'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a podcast channel (admin only)' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChannelManagementController.prototype, "createPodcastChannel", null);
__decorate([
    (0, common_1.Post)('classroom'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a classroom channel' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChannelManagementController.prototype, "createClassroomChannel", null);
__decorate([
    (0, common_1.Get)('pending'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all pending channel requests (admin only)' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'type', required: false }),
    __param(0, (0, common_1.Query)('page', new common_1.DefaultValuePipe(1), common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(20), common_1.ParseIntPipe)),
    __param(2, (0, common_1.Query)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String]),
    __metadata("design:returntype", Promise)
], ChannelManagementController.prototype, "getPendingChannels", null);
__decorate([
    (0, common_1.Post)(':id/approve'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Approve a channel request (admin only)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ChannelManagementController.prototype, "approveChannel", null);
__decorate([
    (0, common_1.Post)(':id/reject'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Reject a channel request (admin only)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ChannelManagementController.prototype, "rejectChannel", null);
__decorate([
    (0, common_1.Post)(':id/mute'),
    (0, swagger_1.ApiOperation)({ summary: 'Mute a user in this channel' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_e = typeof create_message_dto_1.MuteUserDto !== "undefined" && create_message_dto_1.MuteUserDto) === "function" ? _e : Object, Object]),
    __metadata("design:returntype", Promise)
], ChannelManagementController.prototype, "muteUser", null);
__decorate([
    (0, common_1.Post)(':id/mute-all'),
    (0, swagger_1.ApiOperation)({ summary: 'Mute all students in this classroom channel' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ChannelManagementController.prototype, "muteAllStudents", null);
__decorate([
    (0, common_1.Post)(':id/unmute/:userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Unmute a user' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('userId')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], ChannelManagementController.prototype, "unmuteUser", null);
__decorate([
    (0, common_1.Post)(':id/unmute-all'),
    (0, swagger_1.ApiOperation)({ summary: 'Unmute all students' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ChannelManagementController.prototype, "unmuteAllStudents", null);
__decorate([
    (0, common_1.Get)(':id/mutes'),
    (0, swagger_1.ApiOperation)({ summary: 'Get list of muted users in this channel' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ChannelManagementController.prototype, "getChannelMutes", null);
__decorate([
    (0, common_1.Get)('admin/all'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all conversations with filters (admin only)' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_f = typeof create_message_dto_1.GetConversationsQueryDto !== "undefined" && create_message_dto_1.GetConversationsQueryDto) === "function" ? _f : Object, Object]),
    __metadata("design:returntype", Promise)
], ChannelManagementController.prototype, "getAllConversations", null);
__decorate([
    (0, common_1.Get)('admin/:id/details'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Get detailed conversation view with messages (admin only)' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ChannelManagementController.prototype, "getConversationDetails", null);
__decorate([
    (0, common_1.Get)('my/pending'),
    (0, swagger_1.ApiOperation)({ summary: 'Get my pending channel requests' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChannelManagementController.prototype, "getMyPendingRequests", null);
exports.ChannelManagementController = ChannelManagementController = __decorate([
    (0, swagger_1.ApiTags)('Channel Management'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('channels'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [typeof (_a = typeof channel_management_service_1.ChannelManagementService !== "undefined" && channel_management_service_1.ChannelManagementService) === "function" ? _a : Object, typeof (_b = typeof messaging_service_1.MessagingService !== "undefined" && messaging_service_1.MessagingService) === "function" ? _b : Object])
], ChannelManagementController);


/***/ }),
/* 70 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ChannelManagementService_1;
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ChannelManagementService = void 0;
const common_1 = __webpack_require__(2);
const prisma_service_1 = __webpack_require__(10);
let ChannelManagementService = ChannelManagementService_1 = class ChannelManagementService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(ChannelManagementService_1.name);
    }
    async createChannel(dto, creatorId, creatorRoles) {
        const isAdmin = creatorRoles.includes('admin');
        const isTeacher = creatorRoles.includes('teacher');
        if (!isAdmin) {
            const needsApproval = ['teacher_parent', 'teacher_student', 'group'].includes(dto.type);
            if (needsApproval) {
                return this.createPendingChannel(dto, creatorId);
            }
            if (dto.type === 'classroom' && !isTeacher) {
                throw new common_1.ForbiddenException('Only teachers can create classroom channels');
            }
        }
        return this.createApprovedChannel(dto, creatorId);
    }
    async createPodcastChannel(name, description, adminId) {
        return this.prisma.channel.create({
            data: {
                type: 'podcast',
                name,
                description,
                createdBy: adminId,
                approvalStatus: 'approved',
                approvedBy: adminId,
                approvedAt: new Date(),
            },
        });
    }
    async createClassroomChannel(name, description, classId, teacherId, maxStudents = 30) {
        const classData = await this.prisma.class.findUnique({
            where: { id: classId },
            include: { enrollments: { include: { student: true } } },
        });
        if (!classData) {
            throw new common_1.NotFoundException('Class not found');
        }
        if (classData.teacherId !== teacherId) {
            throw new common_1.ForbiddenException('You can only create channels for classes you teach');
        }
        const channel = await this.prisma.channel.create({
            data: {
                type: 'classroom',
                name,
                description,
                classId,
                createdBy: teacherId,
                approvalStatus: 'approved',
                maxMembers: maxStudents,
                members: {
                    create: [
                        { userId: teacherId, role: 'owner' },
                        ...classData.enrollments.map(e => ({
                            userId: e.studentId,
                            role: 'student',
                        })),
                    ],
                },
            },
        });
        this.logger.log(`Classroom channel created: ${channel.id} for class ${classId}`);
        return channel;
    }
    async createDirectMessage(dto, creatorId, creatorRoles) {
        if (!dto.memberIds || dto.memberIds.length === 0) {
            throw new common_1.BadRequestException('At least one member is required');
        }
        const existingChannel = await this.findExistingDirectMessage(creatorId, dto.memberIds, dto.type);
        if (existingChannel) {
            return existingChannel;
        }
        const isAdmin = creatorRoles.includes('admin');
        if (isAdmin) {
            return this.createApprovedChannel(dto, creatorId);
        }
        return this.createPendingChannel(dto, creatorId);
    }
    async createApprovedChannel(dto, creatorId) {
        const memberIds = dto.memberIds || [];
        return this.prisma.channel.create({
            data: {
                type: dto.type,
                name: dto.name,
                description: dto.description,
                classId: dto.classId,
                createdBy: creatorId,
                approvalStatus: 'approved',
                approvedBy: creatorId,
                approvedAt: new Date(),
                maxMembers: dto.maxMembers,
                members: {
                    create: [
                        { userId: creatorId, role: 'owner' },
                        ...memberIds.map(id => ({ userId: id, role: 'member' })),
                    ],
                },
            },
            include: { members: true },
        });
    }
    async createPendingChannel(dto, requesterId) {
        return this.prisma.channel.create({
            data: {
                type: dto.type,
                name: dto.name,
                description: dto.description,
                createdBy: requesterId,
                requestedBy: requesterId,
                approvalStatus: 'pending',
                members: {
                    create: [
                        { userId: requesterId, role: 'owner' },
                        ...(dto.memberIds || []).map(id => ({ userId: id, role: 'member' })),
                    ],
                },
            },
        });
    }
    async findExistingDirectMessage(userId, memberIds, type) {
        if (type === 'direct_message' && memberIds.length === 1) {
            const existing = await this.prisma.channel.findFirst({
                where: {
                    type: 'direct_message',
                    deletedAt: null,
                    AND: [
                        { members: { some: { userId } } },
                        { members: { some: { userId: memberIds[0] } } },
                    ],
                },
                include: { members: true },
            });
            if (existing && existing.members.length === 2) {
                return existing;
            }
        }
        return null;
    }
    async getPendingChannels(params) {
        const { page = 1, limit = 20, type } = params;
        const skip = (page - 1) * limit;
        const where = {
            approvalStatus: 'pending',
            deletedAt: null,
        };
        if (type)
            where.type = type;
        const [channels, total] = await Promise.all([
            this.prisma.channel.findMany({
                where,
                include: {
                    members: {
                        include: {
                            user: {
                                select: { id: true, email: true, firstName: true, lastName: true },
                            },
                        },
                    },
                    creator: {
                        select: { id: true, email: true, firstName: true, lastName: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.channel.count({ where }),
        ]);
        return { channels: channels, total };
    }
    async approveChannel(channelId, adminId) {
        const channel = await this.prisma.channel.findUnique({
            where: { id: channelId },
        });
        if (!channel) {
            throw new common_1.NotFoundException('Channel not found');
        }
        if (channel.approvalStatus !== 'pending') {
            throw new common_1.BadRequestException('Channel is not pending approval');
        }
        return this.prisma.channel.update({
            where: { id: channelId },
            data: {
                approvalStatus: 'approved',
                approvedBy: adminId,
                approvedAt: new Date(),
            },
        });
    }
    async rejectChannel(channelId, adminId, reason) {
        const channel = await this.prisma.channel.findUnique({
            where: { id: channelId },
        });
        if (!channel) {
            throw new common_1.NotFoundException('Channel not found');
        }
        if (channel.approvalStatus !== 'pending') {
            throw new common_1.BadRequestException('Channel is not pending approval');
        }
        return this.prisma.channel.update({
            where: { id: channelId },
            data: {
                approvalStatus: 'rejected',
                approvedBy: adminId,
                approvedAt: new Date(),
                rejectionReason: reason,
            },
        });
    }
    async muteUser(channelId, dto, muterId, muterRoles) {
        const { userId, duration, reason } = dto;
        await this.checkModerationPermission(channelId, muterId, muterRoles);
        if (userId === muterId) {
            throw new common_1.BadRequestException('Cannot mute yourself');
        }
        const membership = await this.prisma.channelMember.findUnique({
            where: { channelId_userId: { channelId, userId } },
        });
        if (!membership) {
            throw new common_1.NotFoundException('User is not a member of this channel');
        }
        await this.prisma.channelMute.updateMany({
            where: {
                channelId,
                userId,
                isActive: true,
            },
            data: { isActive: false },
        });
        const expiresAt = duration
            ? new Date(Date.now() + duration * 60 * 1000)
            : null;
        const mute = await this.prisma.channelMute.create({
            data: {
                channelId,
                userId,
                mutedBy: muterId,
                expiresAt,
                reason,
                isActive: true,
            },
        });
        await this.prisma.channelMember.update({
            where: { channelId_userId: { channelId, userId } },
            data: { isMuted: true },
        });
        this.logger.log(`User ${userId} muted in channel ${channelId} by ${muterId}`);
        return mute;
    }
    async muteAllStudents(channelId, muterId, muterRoles, duration, reason) {
        await this.checkModerationPermission(channelId, muterId, muterRoles);
        const students = await this.prisma.channelMember.findMany({
            where: {
                channelId,
                role: 'student',
                isMuted: false,
            },
        });
        const expiresAt = duration
            ? new Date(Date.now() + duration * 60 * 1000)
            : null;
        await this.prisma.$transaction([
            ...students.map(s => this.prisma.channelMute.create({
                data: {
                    channelId,
                    userId: s.userId,
                    mutedBy: muterId,
                    expiresAt,
                    reason: reason || 'Muted all students',
                    isActive: true,
                },
            })),
            this.prisma.channelMember.updateMany({
                where: {
                    channelId,
                    role: 'student',
                },
                data: { isMuted: true },
            }),
        ]);
        this.logger.log(`All ${students.length} students muted in channel ${channelId}`);
        return { muted: students.length };
    }
    async unmuteUser(channelId, userId, muterId, muterRoles) {
        await this.checkModerationPermission(channelId, muterId, muterRoles);
        await this.prisma.channelMute.updateMany({
            where: {
                channelId,
                userId,
                isActive: true,
            },
            data: { isActive: false },
        });
        await this.prisma.channelMember.update({
            where: { channelId_userId: { channelId, userId } },
            data: { isMuted: false },
        });
        this.logger.log(`User ${userId} unmuted in channel ${channelId}`);
    }
    async unmuteAllStudents(channelId, muterId, muterRoles) {
        await this.checkModerationPermission(channelId, muterId, muterRoles);
        const result = await this.prisma.channelMember.updateMany({
            where: {
                channelId,
                role: 'student',
                isMuted: true,
            },
            data: { isMuted: false },
        });
        await this.prisma.channelMute.updateMany({
            where: {
                channelId,
                isActive: true,
            },
            data: { isActive: false },
        });
        this.logger.log(`All students unmuted in channel ${channelId}`);
        return { unmuted: result.count };
    }
    async isUserMuted(channelId, userId) {
        const member = await this.prisma.channelMember.findUnique({
            where: { channelId_userId: { channelId, userId } },
        });
        if (!member || !member.isMuted) {
            return { muted: false };
        }
        const mute = await this.prisma.channelMute.findFirst({
            where: {
                channelId,
                userId,
                isActive: true,
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gt: new Date() } },
                ],
            },
            orderBy: { mutedAt: 'desc' },
        });
        if (!mute) {
            await this.prisma.channelMember.update({
                where: { channelId_userId: { channelId, userId } },
                data: { isMuted: false },
            });
            return { muted: false };
        }
        return {
            muted: true,
            reason: mute.reason || undefined,
            expiresAt: mute.expiresAt || undefined,
        };
    }
    async getChannelMutes(channelId) {
        return this.prisma.channelMute.findMany({
            where: {
                channelId,
                isActive: true,
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gt: new Date() } },
                ],
            },
            include: {
                user: {
                    select: { id: true, email: true, firstName: true, lastName: true },
                },
                muter: {
                    select: { id: true, email: true, firstName: true, lastName: true },
                },
            },
            orderBy: { mutedAt: 'desc' },
        });
    }
    async getAllConversations(params) {
        const { page = 1, limit = 20, type, status, search, dateFrom, dateTo } = params;
        const skip = (page - 1) * limit;
        const where = {
            deletedAt: null,
        };
        if (type)
            where.type = type;
        if (status)
            where.approvalStatus = status;
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (dateFrom || dateTo) {
            where.createdAt = {};
            if (dateFrom)
                where.createdAt.gte = dateFrom;
            if (dateTo)
                where.createdAt.lte = dateTo;
        }
        const [channels, total] = await Promise.all([
            this.prisma.channel.findMany({
                where,
                include: {
                    members: {
                        include: {
                            user: {
                                select: { id: true, email: true, firstName: true, lastName: true },
                            },
                        },
                    },
                    creator: {
                        select: { id: true, email: true, firstName: true, lastName: true },
                    },
                    _count: {
                        select: { messages: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.channel.count({ where }),
        ]);
        return { channels, total };
    }
    async getConversationDetails(channelId, includeDeleted = false) {
        const where = { id: channelId };
        if (!includeDeleted) {
            where.deletedAt = null;
        }
        const channel = await this.prisma.channel.findFirst({
            where,
            include: {
                members: {
                    include: {
                        user: {
                            select: { id: true, email: true, firstName: true, lastName: true },
                        },
                    },
                },
                messages: {
                    take: 50,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        sender: {
                            select: { id: true, email: true, firstName: true, lastName: true },
                        },
                        attachments: true,
                    },
                },
                mutes: {
                    where: { isActive: true },
                    include: {
                        user: {
                            select: { id: true, email: true, firstName: true, lastName: true },
                        },
                    },
                },
            },
        });
        if (!channel) {
            throw new common_1.NotFoundException('Channel not found');
        }
        return channel;
    }
    async checkModerationPermission(channelId, userId, userRoles) {
        const isAdmin = userRoles.includes('admin');
        if (isAdmin)
            return;
        const membership = await this.prisma.channelMember.findUnique({
            where: { channelId_userId: { channelId, userId } },
        });
        if (!membership || !['owner', 'moderator'].includes(membership.role)) {
            throw new common_1.ForbiddenException('You do not have permission to moderate this channel');
        }
    }
};
exports.ChannelManagementService = ChannelManagementService;
exports.ChannelManagementService = ChannelManagementService = ChannelManagementService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], ChannelManagementService);


/***/ }),
/* 71 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MessagingEnhancedService_1;
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MessagingEnhancedService = void 0;
const common_1 = __webpack_require__(2);
const prisma_service_1 = __webpack_require__(10);
const channel_management_service_1 = __webpack_require__(70);
let MessagingEnhancedService = MessagingEnhancedService_1 = class MessagingEnhancedService {
    constructor(prisma, channelManagementService) {
        this.prisma = prisma;
        this.channelManagementService = channelManagementService;
        this.logger = new common_1.Logger(MessagingEnhancedService_1.name);
    }
    async sendMessage(channelId, senderId, dto) {
        const membership = await this.prisma.channelMember.findUnique({
            where: { channelId_userId: { channelId, userId: senderId } },
            include: { channel: true },
        });
        if (!membership) {
            throw new common_1.ForbiddenException('You are not a member of this channel');
        }
        if (membership.channel.isArchived) {
            throw new common_1.ForbiddenException('This channel is archived');
        }
        if (membership.channel.approvalStatus !== 'approved') {
            throw new common_1.ForbiddenException('This channel is pending approval');
        }
        const muteStatus = await this.channelManagementService.isUserMuted(channelId, senderId);
        if (muteStatus.muted) {
            throw new common_1.ForbiddenException(`You are muted in this channel${muteStatus.reason ? `: ${muteStatus.reason}` : ''}` +
                `${muteStatus.expiresAt ? ` until ${muteStatus.expiresAt.toLocaleString()}` : ''}`);
        }
        if (membership.isBanned) {
            throw new common_1.ForbiddenException('You are banned from this channel');
        }
        const messageData = {
            content: dto.content,
            contentType: dto.contentType || 'text',
            channel: { connect: { id: channelId } },
            sender: { connect: { id: senderId } },
            ...(dto.replyTo && { parent: { connect: { id: dto.replyTo } } }),
        };
        const message = await this.prisma.message.create({
            data: messageData,
            include: {
                sender: {
                    select: { id: true, email: true, firstName: true, lastName: true, avatarUrl: true },
                },
                attachments: true,
                parent: {
                    include: {
                        sender: {
                            select: { id: true, email: true, firstName: true, lastName: true },
                        },
                    },
                },
            },
        });
        if (dto.attachments && dto.attachments.length > 0) {
            await this.prisma.messageAttachment.createMany({
                data: dto.attachments.map(att => ({
                    messageId: message.id,
                    fileName: att.fileName,
                    fileType: att.fileType,
                    fileSize: 0,
                    filePath: att.filePath,
                    url: att.url,
                    duration: att.duration,
                    width: att.width,
                    height: att.height,
                })),
            });
            return this.prisma.message.findUnique({
                where: { id: message.id },
                include: {
                    sender: {
                        select: { id: true, email: true, firstName: true, lastName: true, avatarUrl: true },
                    },
                    attachments: true,
                    parent: {
                        include: {
                            sender: {
                                select: { id: true, email: true, firstName: true, lastName: true },
                            },
                        },
                    },
                },
            });
        }
        this.logger.log(`Message sent: ${message.id} in channel ${channelId}`);
        return message;
    }
    async getMessages(channelId, userId, params) {
        const { cursor, limit = 50, contentType } = params;
        const membership = await this.prisma.channelMember.findUnique({
            where: { channelId_userId: { channelId, userId } },
        });
        if (!membership) {
            throw new common_1.ForbiddenException('You are not a member of this channel');
        }
        const where = {
            channelId,
            isDeleted: false,
        };
        if (contentType) {
            where.contentType = contentType;
        }
        const messages = await this.prisma.message.findMany({
            where,
            take: limit + 1,
            ...(cursor && { skip: 1, cursor: { id: cursor } }),
            orderBy: { createdAt: 'desc' },
            include: {
                sender: {
                    select: { id: true, email: true, firstName: true, lastName: true, avatarUrl: true },
                },
                attachments: true,
                _count: {
                    select: { replies: true },
                },
            },
        });
        let nextCursor;
        if (messages.length > limit) {
            const nextMessage = messages.pop();
            nextCursor = nextMessage?.id;
        }
        return { messages, nextCursor };
    }
    async attachFile(messageId, userId, file) {
        const message = await this.prisma.message.findUnique({
            where: { id: messageId },
        });
        if (!message) {
            throw new common_1.NotFoundException('Message not found');
        }
        if (message.senderId !== userId) {
            throw new common_1.ForbiddenException('You can only attach files to your own messages');
        }
        const attachment = await this.prisma.messageAttachment.create({
            data: {
                messageId,
                fileName: file.fileName,
                fileType: file.fileType,
                fileSize: file.fileSize,
                filePath: file.filePath,
                url: file.url,
                duration: file.duration,
                width: file.width,
                height: file.height,
            },
        });
        const contentType = this.determineContentType(file.fileType);
        if (contentType !== 'text' && message.contentType === 'text') {
            await this.prisma.message.update({
                where: { id: messageId },
                data: { contentType },
            });
        }
        else if (contentType !== message.contentType) {
            await this.prisma.message.update({
                where: { id: messageId },
                data: { contentType: 'mixed' },
            });
        }
        return attachment;
    }
    async getVoiceMessages(channelId, userId, params) {
        const { limit = 20, cursor } = params;
        const membership = await this.prisma.channelMember.findUnique({
            where: { channelId_userId: { channelId, userId } },
        });
        if (!membership) {
            throw new common_1.ForbiddenException('You are not a member of this channel');
        }
        const messages = await this.prisma.message.findMany({
            where: {
                channelId,
                isDeleted: false,
                OR: [
                    { contentType: 'voice' },
                    { contentType: 'mixed' },
                ],
            },
            take: limit + 1,
            ...(cursor && { skip: 1, cursor: { id: cursor } }),
            orderBy: { createdAt: 'desc' },
            include: {
                sender: {
                    select: { id: true, email: true, firstName: true, lastName: true },
                },
                attachments: {
                    where: {
                        fileType: { startsWith: 'audio/' },
                    },
                },
            },
        });
        let nextCursor;
        if (messages.length > limit) {
            const nextMessage = messages.pop();
            nextCursor = nextMessage?.id;
        }
        return { messages, nextCursor };
    }
    async searchMessages(channelId, userId, query, params) {
        const membership = await this.prisma.channelMember.findUnique({
            where: { channelId_userId: { channelId, userId } },
        });
        if (!membership) {
            throw new common_1.ForbiddenException('You are not a member of this channel');
        }
        const where = {
            channelId,
            isDeleted: false,
            content: { contains: query, mode: 'insensitive' },
        };
        if (params.contentType) {
            where.contentType = params.contentType;
        }
        if (params.dateFrom || params.dateTo) {
            where.createdAt = {};
            if (params.dateFrom)
                where.createdAt.gte = params.dateFrom;
            if (params.dateTo)
                where.createdAt.lte = params.dateTo;
        }
        const messages = await this.prisma.message.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 100,
            include: {
                sender: {
                    select: { id: true, email: true, firstName: true, lastName: true },
                },
                attachments: params.hasAttachments !== undefined ? true : undefined,
            },
        });
        if (params.hasAttachments !== undefined) {
            return messages.filter(m => params.hasAttachments ? m.attachments.length > 0 : m.attachments.length === 0);
        }
        return messages;
    }
    determineContentType(fileType) {
        if (fileType.startsWith('image/'))
            return 'image';
        if (fileType.startsWith('audio/'))
            return 'voice';
        if (fileType.startsWith('video/'))
            return 'file';
        return 'file';
    }
};
exports.MessagingEnhancedService = MessagingEnhancedService;
exports.MessagingEnhancedService = MessagingEnhancedService = MessagingEnhancedService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object, typeof (_b = typeof channel_management_service_1.ChannelManagementService !== "undefined" && channel_management_service_1.ChannelManagementService) === "function" ? _b : Object])
], MessagingEnhancedService);


/***/ }),
/* 72 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.NotificationsModule = void 0;
const common_1 = __webpack_require__(2);
const schedule_1 = __webpack_require__(8);
const email_service_1 = __webpack_require__(46);
const queue_processor_1 = __webpack_require__(73);
const push_service_1 = __webpack_require__(74);
const push_controller_1 = __webpack_require__(75);
const prisma_module_1 = __webpack_require__(9);
let NotificationsModule = class NotificationsModule {
};
exports.NotificationsModule = NotificationsModule;
exports.NotificationsModule = NotificationsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            schedule_1.ScheduleModule.forRoot(),
            prisma_module_1.PrismaModule,
        ],
        controllers: [push_controller_1.PushNotificationController],
        providers: [email_service_1.EmailService, queue_processor_1.QueueProcessor, push_service_1.PushNotificationService],
        exports: [email_service_1.EmailService, queue_processor_1.QueueProcessor, push_service_1.PushNotificationService],
    })
], NotificationsModule);


/***/ }),
/* 73 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var QueueProcessor_1;
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.QueueProcessor = void 0;
const common_1 = __webpack_require__(2);
const prisma_service_1 = __webpack_require__(10);
const push_service_1 = __webpack_require__(74);
const email_service_1 = __webpack_require__(46);
let QueueProcessor = QueueProcessor_1 = class QueueProcessor {
    constructor(prisma, pushService, emailService) {
        this.prisma = prisma;
        this.pushService = pushService;
        this.emailService = emailService;
        this.logger = new common_1.Logger(QueueProcessor_1.name);
    }
    async processNotification(job) {
        try {
            this.logger.debug(`Processing notification: ${job.type} for user ${job.userId}`);
            const shouldSend = await this.pushService.shouldSendNotification(job.userId, this.mapTypeToPreference(job.type));
            if (!shouldSend) {
                this.logger.debug(`Notification skipped due to user preferences: ${job.userId}`);
                return;
            }
            await this.pushService.sendToUser(job.userId, job.title, job.body, job.data);
            if (job.email) {
                const user = await this.prisma.user.findUnique({
                    where: { id: job.userId },
                    select: { email: true, emailNotificationsEnabled: true },
                });
                if (user?.emailNotificationsEnabled !== false && user?.email) {
                    await this.emailService.sendEmail({
                        to: user.email,
                        subject: job.email.subject,
                        html: job.email.html,
                    });
                }
            }
        }
        catch (error) {
            this.logger.error(`Failed to process notification: ${error.message}`, error.stack);
            throw error;
        }
    }
    async processBatch(jobs) {
        await Promise.all(jobs.map(job => this.processNotification(job)));
    }
    async processDigest(job) {
        try {
            this.logger.debug(`Processing digest for user ${job.userId} with ${job.unreadCount} unread`);
            const digestContent = await this.generateDigestContent(job.userId, job.since);
            if (digestContent.length === 0) {
                this.logger.debug(`No digest content for user ${job.userId}`);
                return;
            }
            const title = `You have ${job.unreadCount} new notifications`;
            const body = this.formatDigestBody(digestContent);
            await this.pushService.sendToUser(job.userId, title, body, {
                type: 'digest',
                unreadCount: job.unreadCount,
            });
        }
        catch (error) {
            this.logger.error(`Failed to process digest: ${error.message}`, error.stack);
            throw error;
        }
    }
    async generateDigestContent(userId, since) {
        const result = await this.prisma.$queryRaw `
      WITH UnreadMessages AS (
        SELECT
          c.name as "channelName",
          u.first_name as "firstName",
          u.last_name as "lastName",
          m.content as "messagePreview",
          COUNT(*) OVER(PARTITION BY m.channel_id) as "totalCount",
          ROW_NUMBER() OVER(PARTITION BY m.channel_id ORDER BY m.created_at DESC) as rn
        FROM messages m
        JOIN channel_members cm ON m.channel_id = cm.channel_id AND cm.user_id = ${userId}
        JOIN channels c ON m.channel_id = c.id
        JOIN users u ON m.sender_id = u.id
        WHERE m.created_at >= ${since}
          AND m.sender_id != ${userId}
          AND m.is_deleted = false
          AND (cm.last_read_at IS NULL OR m.created_at > cm.last_read_at)
      )
      SELECT
        "channelName",
        "firstName",
        "lastName",
        "messagePreview",
        CAST("totalCount" AS INTEGER) as "count"
      FROM UnreadMessages
      WHERE rn = 1
    `;
        return result.map(row => ({
            channelName: row.channelName || 'Unnamed Channel',
            senderName: `${row.firstName} ${row.lastName}`,
            messagePreview: row.messagePreview,
            count: row.count,
        }));
    }
    formatDigestBody(content) {
        if (content.length === 0) {
            return 'No new messages';
        }
        const items = content.slice(0, 3);
        const remaining = content.length - items.length;
        let body = items.map(item => {
            const preview = item.messagePreview.length > 50
                ? item.messagePreview.substring(0, 50) + '...'
                : item.messagePreview;
            return `${item.channelName}: ${item.senderName} - "${preview}"`;
        }).join('\n');
        if (remaining > 0) {
            body += `\n+ ${remaining} more...`;
        }
        return body;
    }
    mapTypeToPreference(type) {
        const mapping = {
            message: 'messages',
            assignment: 'assignments',
            grade: 'grades',
            attendance: 'attendance',
            announcement: 'announcements',
            reminder: 'announcements',
        };
        return mapping[type] || 'announcements';
    }
    async scheduleNotification(job, delayMs) {
        if (delayMs && delayMs > 0) {
            setTimeout(() => {
                this.processNotification(job).catch(err => {
                    this.logger.error(`Delayed notification failed: ${err.message}`);
                });
            }, delayMs);
        }
        else {
            await this.processNotification(job);
        }
    }
    async retryNotification(job, attempt = 1) {
        const maxRetries = 3;
        const delay = Math.pow(2, attempt) * 1000;
        try {
            await this.processNotification(job);
        }
        catch (error) {
            if (attempt < maxRetries) {
                this.logger.warn(`Notification failed, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
                setTimeout(() => {
                    this.retryNotification(job, attempt + 1);
                }, delay);
            }
            else {
                this.logger.error(`Notification failed after ${maxRetries} attempts`);
                throw error;
            }
        }
    }
};
exports.QueueProcessor = QueueProcessor;
exports.QueueProcessor = QueueProcessor = QueueProcessor_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object, typeof (_b = typeof push_service_1.PushNotificationService !== "undefined" && push_service_1.PushNotificationService) === "function" ? _b : Object, typeof (_c = typeof email_service_1.EmailService !== "undefined" && email_service_1.EmailService) === "function" ? _c : Object])
], QueueProcessor);


/***/ }),
/* 74 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PushNotificationService_1;
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PushNotificationService = void 0;
const common_1 = __webpack_require__(2);
const prisma_service_1 = __webpack_require__(10);
let PushNotificationService = PushNotificationService_1 = class PushNotificationService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(PushNotificationService_1.name);
    }
    async registerToken(userId, token, platform) {
        try {
            const existing = await this.prisma.pushToken.findUnique({
                where: { token },
            });
            if (existing) {
                if (existing.userId !== userId) {
                    await this.prisma.pushToken.update({
                        where: { token },
                        data: { userId },
                    });
                }
                return;
            }
            await this.prisma.pushToken.create({
                data: {
                    userId,
                    token,
                    platform,
                },
            });
            this.logger.log(`Registered push token for user ${userId}`);
        }
        catch (error) {
            this.logger.error(`Failed to register push token: ${error.message}`);
            throw error;
        }
    }
    async unregisterToken(token, userId) {
        try {
            const where = { token };
            if (userId) {
                where.userId = userId;
            }
            await this.prisma.pushToken.deleteMany({ where });
            this.logger.log(`Unregistered push token`);
        }
        catch (error) {
            this.logger.error(`Failed to unregister push token: ${error.message}`);
        }
    }
    async unregisterAllUserTokens(userId) {
        try {
            await this.prisma.pushToken.deleteMany({
                where: { userId },
            });
            this.logger.log(`Unregistered all push tokens for user ${userId}`);
        }
        catch (error) {
            this.logger.error(`Failed to unregister user tokens: ${error.message}`);
        }
    }
    async getPreferences(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { notificationPreferences: true },
        });
        const defaults = {
            messages: true,
            assignments: true,
            grades: true,
            attendance: true,
            announcements: true,
            quietHoursEnabled: false,
            quietHoursStart: '22:00',
            quietHoursEnd: '08:00',
        };
        if (!user?.notificationPreferences) {
            return defaults;
        }
        return { ...defaults, ...user.notificationPreferences };
    }
    async updatePreferences(userId, preferences) {
        const current = await this.getPreferences(userId);
        const updated = { ...current, ...preferences };
        await this.prisma.user.update({
            where: { id: userId },
            data: { notificationPreferences: updated },
        });
        return updated;
    }
    async shouldSendNotification(userId, type) {
        const prefs = await this.getPreferences(userId);
        if (!prefs[type]) {
            return false;
        }
        if (prefs.quietHoursEnabled) {
            const now = new Date();
            const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            const inQuietHours = prefs.quietHoursStart > prefs.quietHoursEnd
                ? currentTime >= prefs.quietHoursStart || currentTime < prefs.quietHoursEnd
                : currentTime >= prefs.quietHoursStart && currentTime < prefs.quietHoursEnd;
            if (inQuietHours) {
                return false;
            }
        }
        return true;
    }
    async sendToUser(userId, title, body, data) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { pushNotificationsEnabled: true },
        });
        if (user?.pushNotificationsEnabled === false) {
            this.logger.debug(`Push notifications disabled for user ${userId}`);
            return null;
        }
        const tokens = await this.prisma.pushToken.findMany({
            where: { userId },
        });
        if (tokens.length === 0) {
            this.logger.debug(`No push tokens found for user ${userId}`);
            return null;
        }
        const payload = {
            to: tokens.map((t) => t.token),
            title,
            body,
            data: {
                ...data,
                userId,
                timestamp: new Date().toISOString(),
            },
            sound: 'default',
            priority: 'high',
        };
        this.logger.log(`Sending notification to user ${userId}: ${title}`);
        this.logger.debug(JSON.stringify(payload));
        try {
            const response = await fetch('https://exp.host/--/api/v2/push/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Accept-Encoding': 'gzip, deflate',
                },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                const errorText = await response.text();
                this.logger.error(`Expo push API error: ${response.status} ${errorText}`);
                return null;
            }
            const result = await response.json();
            if (result.data && Array.isArray(result.data)) {
                for (let i = 0; i < result.data.length; i++) {
                    const ticket = result.data[i];
                    if (ticket.status === 'error') {
                        this.logger.error(`Push error: ${ticket.message}`);
                        if (ticket.details?.error === 'DeviceNotRegistered') {
                            const invalidToken = tokens[i]?.token;
                            if (invalidToken) {
                                this.logger.log(`Unregistering invalid token: ${invalidToken}`);
                                await this.unregisterToken(invalidToken);
                            }
                        }
                    }
                }
            }
            return payload;
        }
        catch (error) {
            this.logger.error(`Failed to send push notification: ${error.message}`);
            return null;
        }
    }
    async sendToMultipleUsers(userIds, title, body, data) {
        await Promise.all(userIds.map((userId) => this.sendToUser(userId, title, body, data)));
    }
    async sendToRole(roleName, title, body, data) {
        const users = await this.prisma.user.findMany({
            where: {
                userRoles: {
                    some: {
                        role: { name: roleName },
                    },
                },
            },
            select: { id: true },
        });
        await this.sendToMultipleUsers(users.map((u) => u.id), title, body, data);
    }
    async sendToChannel(channelId, excludeUserId, title, body, data) {
        const members = await this.prisma.channelMember.findMany({
            where: {
                channelId,
                userId: { not: excludeUserId },
                muted: false,
            },
            select: { userId: true },
        });
        await this.sendToMultipleUsers(members.map((m) => m.userId), title, body, { ...data, channelId });
    }
};
exports.PushNotificationService = PushNotificationService;
exports.PushNotificationService = PushNotificationService = PushNotificationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], PushNotificationService);


/***/ }),
/* 75 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PushNotificationController = void 0;
const common_1 = __webpack_require__(2);
const swagger_1 = __webpack_require__(3);
const push_service_1 = __webpack_require__(74);
const push_dto_1 = __webpack_require__(76);
const jwt_auth_guard_1 = __webpack_require__(29);
let PushNotificationController = class PushNotificationController {
    constructor(pushService) {
        this.pushService = pushService;
    }
    async registerToken(dto, req) {
        return this.pushService.registerToken(req.user.sub, dto.token, dto.deviceType, dto.deviceName);
    }
    async unregisterToken(token, req) {
        return this.pushService.unregisterToken(token, req.user.sub);
    }
    async getUserTokens(req) {
        return this.pushService.getUserTokens(req.user.sub);
    }
    async getPreferences(req) {
        return this.pushService.getNotificationPreferences(req.user.sub);
    }
    async updatePreferences(dto, req) {
        return this.pushService.updateNotificationPreferences(req.user.sub, dto);
    }
    async sendTestNotification(req) {
        return this.pushService.sendTestNotification(req.user.sub);
    }
};
exports.PushNotificationController = PushNotificationController;
__decorate([
    (0, common_1.Post)('register'),
    (0, swagger_1.ApiOperation)({ summary: 'Register a push token for the current user' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof push_dto_1.RegisterPushTokenDto !== "undefined" && push_dto_1.RegisterPushTokenDto) === "function" ? _b : Object, Object]),
    __metadata("design:returntype", Promise)
], PushNotificationController.prototype, "registerToken", null);
__decorate([
    (0, common_1.Delete)('token'),
    (0, swagger_1.ApiOperation)({ summary: 'Unregister/unsubscribe a push token' }),
    __param(0, (0, common_1.Body)('token')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PushNotificationController.prototype, "unregisterToken", null);
__decorate([
    (0, common_1.Get)('tokens'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all registered push tokens for the user' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PushNotificationController.prototype, "getUserTokens", null);
__decorate([
    (0, common_1.Get)('preferences'),
    (0, swagger_1.ApiOperation)({ summary: 'Get notification preferences' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PushNotificationController.prototype, "getPreferences", null);
__decorate([
    (0, common_1.Put)('preferences'),
    (0, swagger_1.ApiOperation)({ summary: 'Update notification preferences' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_c = typeof push_dto_1.UpdateNotificationPreferencesDto !== "undefined" && push_dto_1.UpdateNotificationPreferencesDto) === "function" ? _c : Object, Object]),
    __metadata("design:returntype", Promise)
], PushNotificationController.prototype, "updatePreferences", null);
__decorate([
    (0, common_1.Post)('test'),
    (0, swagger_1.ApiOperation)({ summary: 'Send a test push notification' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PushNotificationController.prototype, "sendTestNotification", null);
exports.PushNotificationController = PushNotificationController = __decorate([
    (0, swagger_1.ApiTags)('Push Notifications'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('notifications/push'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [typeof (_a = typeof push_service_1.PushNotificationService !== "undefined" && push_service_1.PushNotificationService) === "function" ? _a : Object])
], PushNotificationController);


/***/ }),
/* 76 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.NotificationPreferencesResponseDto = exports.UpdateNotificationPreferencesDto = exports.RegisterPushTokenDto = void 0;
const class_validator_1 = __webpack_require__(23);
const swagger_1 = __webpack_require__(3);
class RegisterPushTokenDto {
}
exports.RegisterPushTokenDto = RegisterPushTokenDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterPushTokenDto.prototype, "token", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['ios', 'android', 'web'] }),
    (0, class_validator_1.IsEnum)(['ios', 'android', 'web']),
    __metadata("design:type", String)
], RegisterPushTokenDto.prototype, "deviceType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], RegisterPushTokenDto.prototype, "deviceName", void 0);
class UpdateNotificationPreferencesDto {
}
exports.UpdateNotificationPreferencesDto = UpdateNotificationPreferencesDto;
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateNotificationPreferencesDto.prototype, "enabled", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: '22:00' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateNotificationPreferencesDto.prototype, "quietHoursStart", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: '07:00' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateNotificationPreferencesDto.prototype, "quietHoursEnd", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", typeof (_a = typeof Record !== "undefined" && Record) === "function" ? _a : Object)
], UpdateNotificationPreferencesDto.prototype, "types", void 0);
class NotificationPreferencesResponseDto {
}
exports.NotificationPreferencesResponseDto = NotificationPreferencesResponseDto;


/***/ }),
/* 77 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MentionsModule = void 0;
const common_1 = __webpack_require__(2);
const mentions_service_1 = __webpack_require__(49);
const mentions_controller_1 = __webpack_require__(78);
const prisma_module_1 = __webpack_require__(9);
let MentionsModule = class MentionsModule {
};
exports.MentionsModule = MentionsModule;
exports.MentionsModule = MentionsModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [mentions_controller_1.MentionsController],
        providers: [mentions_service_1.MentionsService],
        exports: [mentions_service_1.MentionsService],
    })
], MentionsModule);


/***/ }),
/* 78 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MentionsController = void 0;
const common_1 = __webpack_require__(2);
const swagger_1 = __webpack_require__(3);
const mentions_service_1 = __webpack_require__(49);
const mentions_dto_1 = __webpack_require__(79);
const jwt_auth_guard_1 = __webpack_require__(29);
let MentionsController = class MentionsController {
    constructor(mentionsService) {
        this.mentionsService = mentionsService;
    }
    async getUserMentions(req, query) {
        return this.mentionsService.getUserMentions(req.user.sub, {
            unreadOnly: query.unreadOnly,
            page: query.page,
            limit: query.limit,
        });
    }
    async getUnreadCount(req) {
        const count = await this.mentionsService.getUnreadMentionCount(req.user.sub);
        return { count };
    }
    async markMentionAsRead(mentionId, req) {
        return this.mentionsService.markMentionAsRead(mentionId, req.user.sub);
    }
    async markAllMentionsAsRead(req) {
        return this.mentionsService.markAllMentionsAsRead(req.user.sub);
    }
    async markMentionsAsRead(dto, req) {
        if (!dto.mentionIds || dto.mentionIds.length === 0) {
            return { success: true, markedCount: 0 };
        }
        return this.mentionsService.markMentionsAsRead(req.user.sub, dto.mentionIds);
    }
};
exports.MentionsController = MentionsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get current user\'s mentions' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns paginated list of mentions' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeof (_b = typeof mentions_dto_1.GetMentionsQueryDto !== "undefined" && mentions_dto_1.GetMentionsQueryDto) === "function" ? _b : Object]),
    __metadata("design:returntype", Promise)
], MentionsController.prototype, "getUserMentions", null);
__decorate([
    (0, common_1.Get)('unread-count'),
    (0, swagger_1.ApiOperation)({ summary: 'Get count of unread mentions for current user' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns unread mention count' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MentionsController.prototype, "getUnreadCount", null);
__decorate([
    (0, common_1.Patch)(':id/read'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Mark a specific mention as read' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Mention marked as read' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Mention not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MentionsController.prototype, "markMentionAsRead", null);
__decorate([
    (0, common_1.Patch)('read-all'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Mark all mentions as read for current user' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'All mentions marked as read' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MentionsController.prototype, "markAllMentionsAsRead", null);
__decorate([
    (0, common_1.Patch)('bulk-read'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Mark specific mentions as read' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Specified mentions marked as read' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_c = typeof mentions_dto_1.MarkMentionsAsReadDto !== "undefined" && mentions_dto_1.MarkMentionsAsReadDto) === "function" ? _c : Object, Object]),
    __metadata("design:returntype", Promise)
], MentionsController.prototype, "markMentionsAsRead", null);
exports.MentionsController = MentionsController = __decorate([
    (0, swagger_1.ApiTags)('Mentions'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('mentions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [typeof (_a = typeof mentions_service_1.MentionsService !== "undefined" && mentions_service_1.MentionsService) === "function" ? _a : Object])
], MentionsController);


/***/ }),
/* 79 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MarkAsReadResponseDto = exports.UnreadMentionCountResponseDto = exports.MentionsListResponseDto = exports.MentionResponseDto = exports.MarkMentionsAsReadDto = exports.GetMentionsQueryDto = exports.CreateMentionDto = void 0;
const class_validator_1 = __webpack_require__(23);
const class_transformer_1 = __webpack_require__(26);
const sanitize_decorator_1 = __webpack_require__(24);
class CreateMentionDto {
}
exports.CreateMentionDto = CreateMentionDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateMentionDto.prototype, "messageId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateMentionDto.prototype, "mentionedUserId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, sanitize_decorator_1.SanitizePlainText)(),
    __metadata("design:type", String)
], CreateMentionDto.prototype, "mentionText", void 0);
class GetMentionsQueryDto {
    constructor() {
        this.unreadOnly = false;
        this.page = 1;
        this.limit = 20;
    }
}
exports.GetMentionsQueryDto = GetMentionsQueryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    (0, class_transformer_1.Type)(() => Boolean),
    __metadata("design:type", Boolean)
], GetMentionsQueryDto.prototype, "unreadOnly", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], GetMentionsQueryDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], GetMentionsQueryDto.prototype, "limit", void 0);
class MarkMentionsAsReadDto {
}
exports.MarkMentionsAsReadDto = MarkMentionsAsReadDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)('4', { each: true }),
    __metadata("design:type", Array)
], MarkMentionsAsReadDto.prototype, "mentionIds", void 0);
class MentionResponseDto {
}
exports.MentionResponseDto = MentionResponseDto;
class MentionsListResponseDto {
}
exports.MentionsListResponseDto = MentionsListResponseDto;
class UnreadMentionCountResponseDto {
}
exports.UnreadMentionCountResponseDto = UnreadMentionCountResponseDto;
class MarkAsReadResponseDto {
}
exports.MarkAsReadResponseDto = MarkAsReadResponseDto;


/***/ }),
/* 80 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ModerationModule = void 0;
const common_1 = __webpack_require__(2);
const moderation_controller_1 = __webpack_require__(81);
const moderation_service_1 = __webpack_require__(82);
let ModerationModule = class ModerationModule {
};
exports.ModerationModule = ModerationModule;
exports.ModerationModule = ModerationModule = __decorate([
    (0, common_1.Module)({
        controllers: [moderation_controller_1.ModerationController],
        providers: [moderation_service_1.ModerationService],
        exports: [moderation_service_1.ModerationService],
    })
], ModerationModule);


/***/ }),
/* 81 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ModerationController = void 0;
const common_1 = __webpack_require__(2);
const swagger_1 = __webpack_require__(3);
const moderation_service_1 = __webpack_require__(82);
const jwt_auth_guard_1 = __webpack_require__(29);
const roles_guard_1 = __webpack_require__(32);
const roles_decorator_1 = __webpack_require__(33);
let ModerationController = class ModerationController {
    constructor(moderationService) {
        this.moderationService = moderationService;
    }
    async getReports(status, page, limit) {
        return this.moderationService.getReports({
            status,
            page: page ? parseInt(page, 10) : 1,
            limit: limit ? parseInt(limit, 10) : 50,
        });
    }
    async getReportStats() {
        return this.moderationService.getReportStats();
    }
    async updateReportStatus(reportId, body, req) {
        return this.moderationService.updateReportStatus(reportId, body, req.user.sub);
    }
    async muteUser(channelId, userId, req) {
        return this.moderationService.muteUser(channelId, userId, req.user.sub);
    }
    async unmuteUser(channelId, userId, req) {
        return this.moderationService.unmuteUser(channelId, userId, req.user.sub);
    }
    async banUser(channelId, userId, req) {
        return this.moderationService.banUser(channelId, userId, req.user.sub);
    }
    async unbanUser(channelId, userId, req) {
        return this.moderationService.unbanUser(channelId, userId, req.user.sub);
    }
    async deleteMessage(messageId, req) {
        return this.moderationService.deleteMessage(messageId, req.user.sub);
    }
    async archiveChannel(channelId, req) {
        return this.moderationService.archiveChannel(channelId, req.user.sub);
    }
    async unarchiveChannel(channelId, req) {
        return this.moderationService.unarchiveChannel(channelId, req.user.sub);
    }
    async getChannelMembers(channelId) {
        return this.moderationService.getChannelMembers(channelId);
    }
    async getAuditLog(channelId, limit, offset) {
        return this.moderationService.getAuditLog(channelId, limit ? (Number.isNaN(parseInt(limit, 10)) ? 100 : parseInt(limit, 10)) : 100, offset ? (Number.isNaN(parseInt(offset, 10)) ? 0 : parseInt(offset, 10)) : 0);
    }
};
exports.ModerationController = ModerationController;
__decorate([
    (0, common_1.Get)('reports'),
    (0, swagger_1.ApiOperation)({ summary: 'Get channel reports' }),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ModerationController.prototype, "getReports", null);
__decorate([
    (0, common_1.Get)('reports/stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get report statistics' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ModerationController.prototype, "getReportStats", null);
__decorate([
    (0, common_1.Patch)('reports/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update report status' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ModerationController.prototype, "updateReportStatus", null);
__decorate([
    (0, common_1.Patch)('channels/:channelId/mute/:userId'),
    __param(0, (0, common_1.Param)('channelId')),
    __param(1, (0, common_1.Param)('userId')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], ModerationController.prototype, "muteUser", null);
__decorate([
    (0, common_1.Patch)('channels/:channelId/unmute/:userId'),
    __param(0, (0, common_1.Param)('channelId')),
    __param(1, (0, common_1.Param)('userId')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], ModerationController.prototype, "unmuteUser", null);
__decorate([
    (0, common_1.Patch)('channels/:channelId/ban/:userId'),
    __param(0, (0, common_1.Param)('channelId')),
    __param(1, (0, common_1.Param)('userId')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], ModerationController.prototype, "banUser", null);
__decorate([
    (0, common_1.Patch)('channels/:channelId/unban/:userId'),
    __param(0, (0, common_1.Param)('channelId')),
    __param(1, (0, common_1.Param)('userId')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], ModerationController.prototype, "unbanUser", null);
__decorate([
    (0, common_1.Delete)('messages/:messageId'),
    __param(0, (0, common_1.Param)('messageId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ModerationController.prototype, "deleteMessage", null);
__decorate([
    (0, common_1.Patch)('channels/:channelId/archive'),
    __param(0, (0, common_1.Param)('channelId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ModerationController.prototype, "archiveChannel", null);
__decorate([
    (0, common_1.Patch)('channels/:channelId/unarchive'),
    __param(0, (0, common_1.Param)('channelId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ModerationController.prototype, "unarchiveChannel", null);
__decorate([
    (0, common_1.Get)('channels/:channelId/members'),
    __param(0, (0, common_1.Param)('channelId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ModerationController.prototype, "getChannelMembers", null);
__decorate([
    (0, common_1.Get)('audit-log'),
    __param(0, (0, common_1.Query)('channelId')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ModerationController.prototype, "getAuditLog", null);
exports.ModerationController = ModerationController = __decorate([
    (0, swagger_1.ApiTags)('Moderation'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('moderation'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __metadata("design:paramtypes", [typeof (_a = typeof moderation_service_1.ModerationService !== "undefined" && moderation_service_1.ModerationService) === "function" ? _a : Object])
], ModerationController);


/***/ }),
/* 82 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ModerationService_1;
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ModerationService = void 0;
const common_1 = __webpack_require__(2);
const prisma_service_1 = __webpack_require__(10);
const audit_helper_1 = __webpack_require__(45);
let ModerationService = ModerationService_1 = class ModerationService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(ModerationService_1.name);
    }
    async muteUser(channelId, targetUserId, actorId) {
        const member = await this.prisma.channelMember.findUnique({
            where: { channelId_userId: { channelId, userId: targetUserId } },
        });
        if (!member)
            throw new common_1.NotFoundException('User is not a member of this channel');
        await this.prisma.channelMember.update({
            where: { channelId_userId: { channelId, userId: targetUserId } },
            data: { isMuted: true },
        });
        await (0, audit_helper_1.createAuditLog)(this.prisma, {
            action: audit_helper_1.AuditActions.MUTE_USER,
            channelId,
            actorId,
            targetId: targetUserId,
        });
        this.logger.log(`User ${targetUserId} muted in channel ${channelId} by ${actorId}`);
        return { muted: true, userId: targetUserId, channelId };
    }
    async unmuteUser(channelId, targetUserId, actorId) {
        const member = await this.prisma.channelMember.findUnique({
            where: { channelId_userId: { channelId, userId: targetUserId } },
        });
        if (!member)
            throw new common_1.NotFoundException('User is not a member of this channel');
        await this.prisma.channelMember.update({
            where: { channelId_userId: { channelId, userId: targetUserId } },
            data: { isMuted: false },
        });
        await (0, audit_helper_1.createAuditLog)(this.prisma, {
            action: audit_helper_1.AuditActions.UNMUTE_USER,
            channelId,
            actorId,
            targetId: targetUserId,
        });
        this.logger.log(`User ${targetUserId} unmuted in channel ${channelId} by ${actorId}`);
        return { muted: false, userId: targetUserId, channelId };
    }
    async banUser(channelId, targetUserId, actorId) {
        const member = await this.prisma.channelMember.findUnique({
            where: { channelId_userId: { channelId, userId: targetUserId } },
        });
        if (!member)
            throw new common_1.NotFoundException('User is not a member of this channel');
        await this.prisma.channelMember.update({
            where: { channelId_userId: { channelId, userId: targetUserId } },
            data: { isBanned: true },
        });
        await (0, audit_helper_1.createAuditLog)(this.prisma, {
            action: audit_helper_1.AuditActions.BAN_USER,
            channelId,
            actorId,
            targetId: targetUserId,
        });
        this.logger.log(`User ${targetUserId} banned from channel ${channelId} by ${actorId}`);
        return { banned: true, userId: targetUserId, channelId };
    }
    async unbanUser(channelId, targetUserId, actorId) {
        const member = await this.prisma.channelMember.findUnique({
            where: { channelId_userId: { channelId, userId: targetUserId } },
        });
        if (!member)
            throw new common_1.NotFoundException('User is not a member of this channel');
        await this.prisma.channelMember.update({
            where: { channelId_userId: { channelId, userId: targetUserId } },
            data: { isBanned: false },
        });
        await (0, audit_helper_1.createAuditLog)(this.prisma, {
            action: audit_helper_1.AuditActions.UNBAN_USER,
            channelId,
            actorId,
            targetId: targetUserId,
        });
        this.logger.log(`User ${targetUserId} unbanned from channel ${channelId} by ${actorId}`);
        return { banned: false, userId: targetUserId, channelId };
    }
    async deleteMessage(messageId, actorId) {
        const message = await this.prisma.message.findUnique({ where: { id: messageId } });
        if (!message)
            throw new common_1.NotFoundException('Message not found');
        await this.prisma.message.update({
            where: { id: messageId },
            data: { isDeleted: true },
        });
        await (0, audit_helper_1.createAuditLog)(this.prisma, {
            action: audit_helper_1.AuditActions.DELETE_MESSAGE,
            messageId,
            channelId: message.channelId,
            actorId,
        });
        this.logger.log(`Message ${messageId} deleted by ${actorId}`);
        return { deleted: true, messageId };
    }
    async archiveChannel(channelId, actorId) {
        const channel = await this.prisma.channel.findUnique({ where: { id: channelId } });
        if (!channel)
            throw new common_1.NotFoundException('Channel not found');
        await this.prisma.channel.update({
            where: { id: channelId },
            data: { isArchived: true },
        });
        await (0, audit_helper_1.createAuditLog)(this.prisma, {
            action: audit_helper_1.AuditActions.ARCHIVE_CHANNEL,
            channelId,
            actorId,
        });
        this.logger.log(`Channel ${channelId} archived by ${actorId}`);
        return { archived: true, channelId };
    }
    async unarchiveChannel(channelId, actorId) {
        const channel = await this.prisma.channel.findUnique({ where: { id: channelId } });
        if (!channel)
            throw new common_1.NotFoundException('Channel not found');
        await this.prisma.channel.update({
            where: { id: channelId },
            data: { isArchived: false },
        });
        await (0, audit_helper_1.createAuditLog)(this.prisma, {
            action: audit_helper_1.AuditActions.UNARCHIVE_CHANNEL,
            channelId,
            actorId,
        });
        this.logger.log(`Channel ${channelId} unarchived by ${actorId}`);
        return { archived: false, channelId };
    }
    async getAuditLog(channelId, limit = 100, offset = 0) {
        const maxLimit = 500;
        const pageSize = Math.min(Math.max(1, limit), maxLimit);
        const [logs, total] = await Promise.all([
            this.prisma.auditLog.findMany({
                where: channelId ? { channelId } : {},
                take: pageSize,
                skip: offset,
                orderBy: { createdAt: 'desc' },
                include: {
                    actor: {
                        select: { id: true, firstName: true, lastName: true, email: true },
                    },
                },
            }),
            this.prisma.auditLog.count({
                where: channelId ? { channelId } : {},
            }),
        ]);
        return {
            data: logs,
            meta: {
                total,
                limit: pageSize,
                offset,
            },
        };
    }
    async getChannelMembers(channelId) {
        return this.prisma.channelMember.findMany({
            where: { channelId },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        avatarUrl: true,
                        status: true,
                    },
                },
            },
        });
    }
    async getReports(params) {
        const { status, page = 1, limit = 50 } = params;
        const skip = (page - 1) * limit;
        const where = status ? { status } : {};
        const [reports, total] = await Promise.all([
            this.prisma.channelReport.findMany({
                where,
                include: {
                    reporter: {
                        select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
                    },
                    channel: {
                        select: { id: true, name: true, type: true },
                    },
                    assignee: {
                        select: { id: true, firstName: true, lastName: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.channelReport.count({ where }),
        ]);
        return { reports, total };
    }
    async getReportStats() {
        const [pending, investigating, resolved, dismissed] = await Promise.all([
            this.prisma.channelReport.count({ where: { status: 'pending' } }),
            this.prisma.channelReport.count({ where: { status: 'investigating' } }),
            this.prisma.channelReport.count({ where: { status: 'resolved' } }),
            this.prisma.channelReport.count({ where: { status: 'dismissed' } }),
        ]);
        return { pending, investigating, resolved, dismissed, total: pending + investigating + resolved + dismissed };
    }
    async updateReportStatus(reportId, data, actorId) {
        const report = await this.prisma.channelReport.findUnique({ where: { id: reportId } });
        if (!report)
            throw new common_1.NotFoundException('Report not found');
        const updateData = {
            status: data.status,
            assignedTo: actorId,
        };
        if (data.resolution)
            updateData.resolution = data.resolution;
        if (data.status === 'resolved' || data.status === 'dismissed') {
            updateData.resolvedAt = new Date();
        }
        const updated = await this.prisma.channelReport.update({
            where: { id: reportId },
            data: updateData,
            include: {
                reporter: { select: { id: true, firstName: true, lastName: true, email: true } },
                channel: { select: { id: true, name: true, type: true } },
            },
        });
        await (0, audit_helper_1.createAuditLog)(this.prisma, {
            action: audit_helper_1.AuditActions.REPORT_UPDATE,
            actorId,
            targetId: reportId,
            metadata: { status: data.status, resolution: data.resolution },
        });
        this.logger.log(`Report ${reportId} updated to ${data.status} by ${actorId}`);
        return updated;
    }
};
exports.ModerationService = ModerationService;
exports.ModerationService = ModerationService = ModerationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], ModerationService);


/***/ }),
/* 83 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CoursesModule = void 0;
const common_1 = __webpack_require__(2);
const courses_service_1 = __webpack_require__(84);
const courses_controller_1 = __webpack_require__(85);
let CoursesModule = class CoursesModule {
};
exports.CoursesModule = CoursesModule;
exports.CoursesModule = CoursesModule = __decorate([
    (0, common_1.Module)({
        controllers: [courses_controller_1.CoursesController, courses_controller_1.ClassesController],
        providers: [courses_service_1.CoursesService],
        exports: [courses_service_1.CoursesService],
    })
], CoursesModule);


/***/ }),
/* 84 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var CoursesService_1;
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CoursesService = void 0;
const common_1 = __webpack_require__(2);
const prisma_service_1 = __webpack_require__(10);
const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;
let CoursesService = CoursesService_1 = class CoursesService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(CoursesService_1.name);
    }
    async createCourse(dto) {
        const existing = await this.prisma.course.findUnique({ where: { code: dto.code.toUpperCase() } });
        if (existing)
            throw new common_1.ConflictException(`Course code ${dto.code} already exists`);
        return this.prisma.course.create({
            data: {
                code: dto.code.toUpperCase(),
                name: dto.name,
                description: dto.description,
                credits: dto.credits ?? 1,
                department: dto.department,
            },
        });
    }
    async findAllCourses(filters, page = 1, limit = DEFAULT_PAGE_SIZE) {
        const pageSize = Math.min(Math.max(1, limit), MAX_PAGE_SIZE);
        const skip = (Math.max(1, page) - 1) * pageSize;
        const where = {};
        if (!filters?.includeDeleted) {
            where.deletedAt = null;
        }
        if (filters?.department)
            where.department = filters.department;
        if (filters?.isActive !== undefined)
            where.isActive = filters.isActive;
        if (filters?.search) {
            where.OR = [
                { name: { contains: filters.search, mode: 'insensitive' } },
                { code: { contains: filters.search, mode: 'insensitive' } },
            ];
        }
        const [courses, total] = await Promise.all([
            this.prisma.course.findMany({
                where,
                include: { classes: { select: { id: true, term: true, section: true } } },
                orderBy: { code: 'asc' },
                skip,
                take: pageSize,
            }),
            this.prisma.course.count({ where }),
        ]);
        return {
            data: courses,
            meta: {
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            },
        };
    }
    async findCourseById(id, includeDeleted = false) {
        const where = { id };
        if (!includeDeleted) {
            where.deletedAt = null;
        }
        const course = await this.prisma.course.findFirst({
            where,
            include: {
                classes: {
                    include: {
                        teacher: { select: { id: true, firstName: true, lastName: true, email: true } },
                        _count: { select: { enrollments: true } },
                        schedules: true,
                    },
                },
            },
        });
        if (!course)
            throw new common_1.NotFoundException('Course not found');
        return course;
    }
    async updateCourse(id, dto) {
        await this.findCourseById(id);
        return this.prisma.course.update({ where: { id }, data: dto });
    }
    async deleteCourse(id, softDelete = true, deletedBy) {
        const course = await this.findCourseById(id, true);
        if (softDelete) {
            return this.prisma.course.update({
                where: { id },
                data: {
                    deletedAt: new Date(),
                    isActive: false,
                },
            });
        }
        else {
            return this.prisma.course.delete({ where: { id } });
        }
    }
    async createClass(dto) {
        const course = await this.prisma.course.findUnique({ where: { id: dto.courseId } });
        if (!course)
            throw new common_1.NotFoundException('Course not found');
        return this.prisma.class.create({
            data: {
                courseId: dto.courseId,
                teacherId: dto.teacherId,
                term: dto.term,
                section: dto.section,
                room: dto.room,
                maxStudents: dto.maxStudents,
            },
            include: {
                course: { select: { code: true, name: true } },
                teacher: { select: { id: true, firstName: true, lastName: true } },
            },
        });
    }
    async findAllClasses(filters, page = 1, limit = DEFAULT_PAGE_SIZE) {
        const pageSize = Math.min(Math.max(1, limit), MAX_PAGE_SIZE);
        const skip = (Math.max(1, page) - 1) * pageSize;
        const where = { isActive: true };
        if (!filters?.includeDeleted) {
            where.deletedAt = null;
        }
        if (filters?.term)
            where.term = filters.term;
        if (filters?.teacherId)
            where.teacherId = filters.teacherId;
        if (filters?.courseId)
            where.courseId = filters.courseId;
        if (filters?.studentId) {
            where.enrollments = { some: { studentId: filters.studentId, status: 'active' } };
        }
        const [classes, total] = await Promise.all([
            this.prisma.class.findMany({
                where,
                include: {
                    course: { select: { code: true, name: true, department: true } },
                    teacher: { select: { id: true, firstName: true, lastName: true, email: true } },
                    schedules: true,
                    _count: { select: { enrollments: true, assignments: true } },
                },
                orderBy: [{ term: 'desc' }, { course: { code: 'asc' } }],
                skip,
                take: pageSize,
            }),
            this.prisma.class.count({ where }),
        ]);
        return {
            data: classes,
            meta: {
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            },
        };
    }
    async findClassById(id, includeDeleted = false) {
        const where = { id };
        if (!includeDeleted) {
            where.deletedAt = null;
        }
        const cls = await this.prisma.class.findFirst({
            where,
            include: {
                course: true,
                teacher: { select: { id: true, firstName: true, lastName: true, email: true } },
                schedules: true,
                enrollments: {
                    where: { status: 'active' },
                    include: {
                        student: { select: { id: true, firstName: true, lastName: true, email: true } },
                    },
                    orderBy: { student: { lastName: 'asc' } },
                },
                _count: { select: { enrollments: true, assignments: true, attendance: true } },
            },
        });
        if (!cls)
            throw new common_1.NotFoundException('Class not found');
        return cls;
    }
    async updateClass(id, dto) {
        await this.findClassById(id);
        return this.prisma.class.update({
            where: { id },
            data: dto,
            include: {
                course: { select: { code: true, name: true } },
                teacher: { select: { id: true, firstName: true, lastName: true } },
            },
        });
    }
    async deleteClass(id, softDelete = true, deletedBy) {
        await this.findClassById(id, true);
        if (softDelete) {
            return this.prisma.class.update({
                where: { id },
                data: {
                    deletedAt: new Date(),
                    isActive: false,
                },
            });
        }
        else {
            return this.prisma.class.delete({ where: { id } });
        }
    }
    async enrollStudent(classId, dto) {
        const cls = await this.prisma.class.findUnique({
            where: { id: classId },
            include: { _count: { select: { enrollments: true } } },
        });
        if (!cls)
            throw new common_1.NotFoundException('Class not found');
        if (cls.maxStudents && cls._count.enrollments >= cls.maxStudents) {
            throw new common_1.ConflictException('Class is full');
        }
        const existing = await this.prisma.classEnrollment.findUnique({
            where: { classId_studentId: { classId, studentId: dto.studentId } },
        });
        if (existing) {
            if (existing.status === 'active')
                throw new common_1.ConflictException('Student already enrolled');
            return this.prisma.classEnrollment.update({
                where: { id: existing.id },
                data: { status: 'active', enrolledAt: new Date() },
                include: { student: { select: { id: true, firstName: true, lastName: true } } },
            });
        }
        return this.prisma.classEnrollment.create({
            data: { classId, studentId: dto.studentId },
            include: { student: { select: { id: true, firstName: true, lastName: true } } },
        });
    }
    async bulkEnroll(classId, studentIds) {
        const MAX_BATCH_SIZE = 100;
        if (studentIds.length > MAX_BATCH_SIZE) {
            throw new common_1.ConflictException(`Cannot enroll more than ${MAX_BATCH_SIZE} students at once`);
        }
        const cls = await this.prisma.class.findUnique({
            where: { id: classId },
            include: { _count: { select: { enrollments: true } } },
        });
        if (!cls)
            throw new common_1.NotFoundException('Class not found');
        const availableSlots = cls.maxStudents ? cls.maxStudents - cls._count.enrollments : Infinity;
        if (availableSlots < studentIds.length) {
            throw new common_1.ConflictException(`Only ${availableSlots} slots available in this class`);
        }
        const results = await this.prisma.$transaction(async (tx) => {
            const processed = [];
            for (const studentId of studentIds) {
                try {
                    const existing = await tx.classEnrollment.findUnique({
                        where: { classId_studentId: { classId, studentId } },
                    });
                    if (existing) {
                        if (existing.status === 'active') {
                            processed.push({ studentId, status: 'already_enrolled' });
                        }
                        else {
                            const enrollment = await tx.classEnrollment.update({
                                where: { id: existing.id },
                                data: { status: 'active', enrolledAt: new Date() },
                            });
                            processed.push({ studentId, status: 're_enrolled', enrollment });
                        }
                    }
                    else {
                        const enrollment = await tx.classEnrollment.create({
                            data: { classId, studentId },
                            include: { student: { select: { id: true, firstName: true, lastName: true } } },
                        });
                        processed.push({ studentId, status: 'enrolled', enrollment });
                    }
                }
                catch (err) {
                    processed.push({ studentId, status: 'failed', error: err.message });
                }
            }
            return processed;
        });
        this.logger.log(`Bulk enrollment completed for class ${classId}: ${results.filter(r => r.status === 'enrolled' || r.status === 're_enrolled').length} enrolled`);
        return results;
    }
    async dropStudent(classId, studentId) {
        const enrollment = await this.prisma.classEnrollment.findUnique({
            where: { classId_studentId: { classId, studentId } },
        });
        if (!enrollment)
            throw new common_1.NotFoundException('Enrollment not found');
        return this.prisma.classEnrollment.update({
            where: { id: enrollment.id },
            data: { status: 'dropped' },
        });
    }
    async getClassRoster(classId, page = 1, limit = DEFAULT_PAGE_SIZE) {
        const pageSize = Math.min(Math.max(1, limit), MAX_PAGE_SIZE);
        const skip = (Math.max(1, page) - 1) * pageSize;
        const [roster, total] = await Promise.all([
            this.prisma.classEnrollment.findMany({
                where: { classId, status: 'active' },
                include: {
                    student: { select: { id: true, firstName: true, lastName: true, email: true } },
                },
                orderBy: { student: { lastName: 'asc' } },
                skip,
                take: pageSize,
            }),
            this.prisma.classEnrollment.count({ where: { classId, status: 'active' } }),
        ]);
        return {
            data: roster,
            meta: {
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            },
        };
    }
    async getStudentClasses(studentId, term, page = 1, limit = DEFAULT_PAGE_SIZE) {
        const pageSize = Math.min(Math.max(1, limit), MAX_PAGE_SIZE);
        const skip = (Math.max(1, page) - 1) * pageSize;
        const where = { studentId, status: 'active' };
        if (term)
            where.class = { term };
        const [enrollments, total] = await Promise.all([
            this.prisma.classEnrollment.findMany({
                where,
                include: {
                    class: {
                        include: {
                            course: { select: { code: true, name: true, department: true } },
                            teacher: { select: { id: true, firstName: true, lastName: true } },
                            schedules: true,
                        },
                    },
                },
                orderBy: { class: { course: { code: 'asc' } } },
                skip,
                take: pageSize,
            }),
            this.prisma.classEnrollment.count({ where }),
        ]);
        return {
            data: enrollments,
            meta: {
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            },
        };
    }
    async addSchedules(classId, schedules) {
        if (schedules.length > 7) {
            throw new common_1.ConflictException('Cannot add more than 7 schedules at once');
        }
        await this.findClassById(classId);
        return this.prisma.$transaction(schedules.map((s) => this.prisma.schedule.create({
            data: {
                classId,
                dayOfWeek: s.dayOfWeek,
                startTime: s.startTime,
                endTime: s.endTime,
            },
        })));
    }
    async getSchedules(classId) {
        return this.prisma.schedule.findMany({
            where: { classId },
            orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        });
    }
    async deleteSchedule(scheduleId) {
        return this.prisma.schedule.delete({ where: { id: scheduleId } });
    }
    async getTeacherClasses(teacherId, term, page = 1, limit = DEFAULT_PAGE_SIZE) {
        const pageSize = Math.min(Math.max(1, limit), MAX_PAGE_SIZE);
        const skip = (Math.max(1, page) - 1) * pageSize;
        const where = { teacherId, isActive: true };
        if (term)
            where.term = term;
        const [classes, total] = await Promise.all([
            this.prisma.class.findMany({
                where,
                include: {
                    course: { select: { code: true, name: true } },
                    schedules: true,
                    _count: { select: { enrollments: true, assignments: true } },
                },
                orderBy: { course: { code: 'asc' } },
                skip,
                take: pageSize,
            }),
            this.prisma.class.count({ where }),
        ]);
        return {
            data: classes,
            meta: {
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            },
        };
    }
    async getAdminClasses() {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);
        const classes = await this.prisma.class.findMany({
            where: { isActive: true },
            include: {
                course: { select: { code: true, name: true } },
                teacher: { select: { firstName: true, lastName: true } },
                _count: { select: { enrollments: true } },
                attendance: {
                    where: {
                        date: {
                            gte: startOfDay,
                            lte: endOfDay,
                        },
                    },
                    include: {
                        records: { select: { status: true, studentId: true } },
                    },
                },
            },
            orderBy: { term: 'desc' },
        });
        const grouped = {};
        for (const cls of classes) {
            const term = cls.term || 'Unknown Term';
            if (!grouped[term])
                grouped[term] = [];
            const presentStudents = new Set();
            cls.attendance.forEach(session => {
                session.records.forEach(r => {
                    if (r.status === 'present' || r.status === 'late') {
                        presentStudents.add(r.studentId);
                    }
                });
            });
            grouped[term].push({
                id: cls.id,
                name: cls.course.name,
                code: cls.course.code,
                teacher: cls.teacher ? `${cls.teacher.firstName} ${cls.teacher.lastName}` : 'Unassigned',
                enrollmentCount: cls._count.enrollments,
                todayPresent: presentStudents.size,
                activeSessions: cls.attendance.length,
            });
        }
        return grouped;
    }
};
exports.CoursesService = CoursesService;
exports.CoursesService = CoursesService = CoursesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], CoursesService);


/***/ }),
/* 85 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c, _d, _e, _f, _g, _h, _j;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ClassesController = exports.CoursesController = void 0;
const common_1 = __webpack_require__(2);
const swagger_1 = __webpack_require__(3);
const courses_service_1 = __webpack_require__(84);
const courses_dto_1 = __webpack_require__(86);
const jwt_auth_guard_1 = __webpack_require__(29);
const roles_guard_1 = __webpack_require__(32);
const roles_decorator_1 = __webpack_require__(33);
const MAX_PAGE_SIZE = 100;
let CoursesController = class CoursesController {
    constructor(coursesService) {
        this.coursesService = coursesService;
    }
    createCourse(dto) {
        return this.coursesService.createCourse(dto);
    }
    findAllCourses(department, active, search, page, limit) {
        const limitNum = Math.min(limit ? parseInt(limit) : 20, MAX_PAGE_SIZE);
        return this.coursesService.findAllCourses({
            department,
            isActive: active !== undefined ? active === 'true' : undefined,
            search,
        }, page ? parseInt(page) : 1, limitNum);
    }
    findCourse(id) {
        return this.coursesService.findCourseById(id);
    }
    updateCourse(id, dto) {
        return this.coursesService.updateCourse(id, dto);
    }
    deleteCourse(id) {
        return this.coursesService.deleteCourse(id);
    }
};
exports.CoursesController = CoursesController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'teacher'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new course' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof courses_dto_1.CreateCourseDto !== "undefined" && courses_dto_1.CreateCourseDto) === "function" ? _b : Object]),
    __metadata("design:returntype", void 0)
], CoursesController.prototype, "createCourse", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all courses' }),
    (0, swagger_1.ApiQuery)({ name: 'department', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'active', required: false, type: Boolean }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    __param(0, (0, common_1.Query)('department')),
    __param(1, (0, common_1.Query)('active')),
    __param(2, (0, common_1.Query)('search')),
    __param(3, (0, common_1.Query)('page')),
    __param(4, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], CoursesController.prototype, "findAllCourses", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get course by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CoursesController.prototype, "findCourse", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Update course' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_c = typeof courses_dto_1.UpdateCourseDto !== "undefined" && courses_dto_1.UpdateCourseDto) === "function" ? _c : Object]),
    __metadata("design:returntype", void 0)
], CoursesController.prototype, "updateCourse", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete course' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CoursesController.prototype, "deleteCourse", null);
exports.CoursesController = CoursesController = __decorate([
    (0, swagger_1.ApiTags)('Courses'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('courses'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [typeof (_a = typeof courses_service_1.CoursesService !== "undefined" && courses_service_1.CoursesService) === "function" ? _a : Object])
], CoursesController);
let ClassesController = class ClassesController {
    constructor(coursesService) {
        this.coursesService = coursesService;
    }
    createClass(dto) {
        return this.coursesService.createClass(dto);
    }
    getAdminClasses() {
        return this.coursesService.getAdminClasses();
    }
    findAllClasses(term, teacherId, courseId, studentId, page, limit) {
        const limitNum = Math.min(limit ? parseInt(limit) : 20, MAX_PAGE_SIZE);
        return this.coursesService.findAllClasses({ term, teacherId, courseId, studentId }, page ? parseInt(page) : 1, limitNum);
    }
    getMyClasses(req, term) {
        const roles = req.user.roles || [];
        if (roles.includes('teacher')) {
            return this.coursesService.getTeacherClasses(req.user.sub, term);
        }
        return this.coursesService.getStudentClasses(req.user.sub, term);
    }
    findClass(id) {
        return this.coursesService.findClassById(id);
    }
    updateClass(id, dto) {
        return this.coursesService.updateClass(id, dto);
    }
    deleteClass(id) {
        return this.coursesService.deleteClass(id);
    }
    enrollStudent(classId, dto) {
        return this.coursesService.enrollStudent(classId, dto);
    }
    bulkEnroll(classId, dto) {
        return this.coursesService.bulkEnroll(classId, dto.studentIds);
    }
    dropStudent(classId, studentId) {
        return this.coursesService.dropStudent(classId, studentId);
    }
    getRoster(classId, page, limit) {
        const limitNum = Math.min(limit ? parseInt(limit) : 20, MAX_PAGE_SIZE);
        return this.coursesService.getClassRoster(classId, page ? parseInt(page) : 1, limitNum);
    }
    addSchedules(classId, dto) {
        return this.coursesService.addSchedules(classId, dto.schedules);
    }
    getSchedules(classId) {
        return this.coursesService.getSchedules(classId);
    }
    deleteSchedule(scheduleId) {
        return this.coursesService.deleteSchedule(scheduleId);
    }
};
exports.ClassesController = ClassesController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'teacher'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new class' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_e = typeof courses_dto_1.CreateClassDto !== "undefined" && courses_dto_1.CreateClassDto) === "function" ? _e : Object]),
    __metadata("design:returntype", void 0)
], ClassesController.prototype, "createClass", null);
__decorate([
    (0, common_1.Get)('admin/summary'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Get classes summary for admin' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ClassesController.prototype, "getAdminClasses", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all classes' }),
    (0, swagger_1.ApiQuery)({ name: 'term', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'teacherId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'courseId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'studentId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    __param(0, (0, common_1.Query)('term')),
    __param(1, (0, common_1.Query)('teacherId')),
    __param(2, (0, common_1.Query)('courseId')),
    __param(3, (0, common_1.Query)('studentId')),
    __param(4, (0, common_1.Query)('page')),
    __param(5, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], ClassesController.prototype, "findAllClasses", null);
__decorate([
    (0, common_1.Get)('my'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current user\'s classes' }),
    (0, swagger_1.ApiQuery)({ name: 'term', required: false }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('term')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ClassesController.prototype, "getMyClasses", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get class by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ClassesController.prototype, "findClass", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'teacher'),
    (0, swagger_1.ApiOperation)({ summary: 'Update class' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_f = typeof courses_dto_1.UpdateClassDto !== "undefined" && courses_dto_1.UpdateClassDto) === "function" ? _f : Object]),
    __metadata("design:returntype", void 0)
], ClassesController.prototype, "updateClass", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete class' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ClassesController.prototype, "deleteClass", null);
__decorate([
    (0, common_1.Post)(':id/enroll'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'teacher'),
    (0, swagger_1.ApiOperation)({ summary: 'Enroll a student' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_g = typeof courses_dto_1.EnrollStudentDto !== "undefined" && courses_dto_1.EnrollStudentDto) === "function" ? _g : Object]),
    __metadata("design:returntype", void 0)
], ClassesController.prototype, "enrollStudent", null);
__decorate([
    (0, common_1.Post)(':id/enroll/bulk'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'teacher'),
    (0, swagger_1.ApiOperation)({ summary: 'Bulk enroll students' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_h = typeof courses_dto_1.BulkEnrollDto !== "undefined" && courses_dto_1.BulkEnrollDto) === "function" ? _h : Object]),
    __metadata("design:returntype", void 0)
], ClassesController.prototype, "bulkEnroll", null);
__decorate([
    (0, common_1.Delete)(':id/students/:studentId'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'teacher'),
    (0, swagger_1.ApiOperation)({ summary: 'Drop a student' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('studentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ClassesController.prototype, "dropStudent", null);
__decorate([
    (0, common_1.Get)(':id/roster'),
    (0, swagger_1.ApiOperation)({ summary: 'Get class roster' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], ClassesController.prototype, "getRoster", null);
__decorate([
    (0, common_1.Post)(':id/schedules'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'teacher'),
    (0, swagger_1.ApiOperation)({ summary: 'Add schedules to class' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_j = typeof courses_dto_1.AddSchedulesDto !== "undefined" && courses_dto_1.AddSchedulesDto) === "function" ? _j : Object]),
    __metadata("design:returntype", void 0)
], ClassesController.prototype, "addSchedules", null);
__decorate([
    (0, common_1.Get)(':id/schedules'),
    (0, swagger_1.ApiOperation)({ summary: 'Get class schedules' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ClassesController.prototype, "getSchedules", null);
__decorate([
    (0, common_1.Delete)('schedules/:scheduleId'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'teacher'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete schedule' }),
    __param(0, (0, common_1.Param)('scheduleId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ClassesController.prototype, "deleteSchedule", null);
exports.ClassesController = ClassesController = __decorate([
    (0, swagger_1.ApiTags)('Classes'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('classes'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [typeof (_d = typeof courses_service_1.CoursesService !== "undefined" && courses_service_1.CoursesService) === "function" ? _d : Object])
], ClassesController);


/***/ }),
/* 86 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AddSchedulesDto = exports.CreateScheduleDto = exports.BulkEnrollDto = exports.EnrollStudentDto = exports.UpdateClassDto = exports.CreateClassDto = exports.UpdateCourseDto = exports.CreateCourseDto = void 0;
const class_validator_1 = __webpack_require__(23);
const class_transformer_1 = __webpack_require__(26);
const sanitize_decorator_1 = __webpack_require__(24);
class CreateCourseDto {
}
exports.CreateCourseDto = CreateCourseDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(20, { message: 'Course code cannot exceed 20 characters' }),
    (0, sanitize_decorator_1.SanitizePlainText)(),
    __metadata("design:type", String)
], CreateCourseDto.prototype, "code", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200, { message: 'Course name cannot exceed 200 characters' }),
    (0, sanitize_decorator_1.SanitizePlainText)(),
    __metadata("design:type", String)
], CreateCourseDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(5000, { message: 'Description cannot exceed 5000 characters' }),
    (0, sanitize_decorator_1.SanitizeHtml)(),
    __metadata("design:type", String)
], CreateCourseDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(20, { message: 'Credits cannot exceed 20' }),
    __metadata("design:type", Number)
], CreateCourseDto.prototype, "credits", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100, { message: 'Department cannot exceed 100 characters' }),
    (0, sanitize_decorator_1.SanitizePlainText)(),
    __metadata("design:type", String)
], CreateCourseDto.prototype, "department", void 0);
class UpdateCourseDto {
}
exports.UpdateCourseDto = UpdateCourseDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200, { message: 'Course name cannot exceed 200 characters' }),
    (0, sanitize_decorator_1.SanitizePlainText)(),
    __metadata("design:type", String)
], UpdateCourseDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(5000, { message: 'Description cannot exceed 5000 characters' }),
    (0, sanitize_decorator_1.SanitizeHtml)(),
    __metadata("design:type", String)
], UpdateCourseDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(20),
    __metadata("design:type", Number)
], UpdateCourseDto.prototype, "credits", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100, { message: 'Department cannot exceed 100 characters' }),
    (0, sanitize_decorator_1.SanitizePlainText)(),
    __metadata("design:type", String)
], UpdateCourseDto.prototype, "department", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateCourseDto.prototype, "isActive", void 0);
class CreateClassDto {
}
exports.CreateClassDto = CreateClassDto;
__decorate([
    (0, class_validator_1.IsUUID)('4', { message: 'Invalid course ID' }),
    __metadata("design:type", String)
], CreateClassDto.prototype, "courseId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)('4', { message: 'Invalid teacher ID' }),
    __metadata("design:type", String)
], CreateClassDto.prototype, "teacherId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50, { message: 'Term cannot exceed 50 characters' }),
    (0, sanitize_decorator_1.SanitizePlainText)(),
    __metadata("design:type", String)
], CreateClassDto.prototype, "term", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(20, { message: 'Section cannot exceed 20 characters' }),
    (0, sanitize_decorator_1.SanitizePlainText)(),
    __metadata("design:type", String)
], CreateClassDto.prototype, "section", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50, { message: 'Room cannot exceed 50 characters' }),
    (0, sanitize_decorator_1.SanitizePlainText)(),
    __metadata("design:type", String)
], CreateClassDto.prototype, "room", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(1000, { message: 'Max students cannot exceed 1000' }),
    __metadata("design:type", Number)
], CreateClassDto.prototype, "maxStudents", void 0);
class UpdateClassDto {
}
exports.UpdateClassDto = UpdateClassDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)('4', { message: 'Invalid teacher ID' }),
    __metadata("design:type", String)
], UpdateClassDto.prototype, "teacherId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50, { message: 'Term cannot exceed 50 characters' }),
    (0, sanitize_decorator_1.SanitizePlainText)(),
    __metadata("design:type", String)
], UpdateClassDto.prototype, "term", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(20, { message: 'Section cannot exceed 20 characters' }),
    (0, sanitize_decorator_1.SanitizePlainText)(),
    __metadata("design:type", String)
], UpdateClassDto.prototype, "section", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50, { message: 'Room cannot exceed 50 characters' }),
    (0, sanitize_decorator_1.SanitizePlainText)(),
    __metadata("design:type", String)
], UpdateClassDto.prototype, "room", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(1000),
    __metadata("design:type", Number)
], UpdateClassDto.prototype, "maxStudents", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateClassDto.prototype, "isActive", void 0);
class EnrollStudentDto {
}
exports.EnrollStudentDto = EnrollStudentDto;
__decorate([
    (0, class_validator_1.IsUUID)('4', { message: 'Invalid student ID' }),
    __metadata("design:type", String)
], EnrollStudentDto.prototype, "studentId", void 0);
class BulkEnrollDto {
}
exports.BulkEnrollDto = BulkEnrollDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(100, { message: 'Cannot enroll more than 100 students at once' }),
    (0, class_validator_1.IsUUID)('4', { each: true }),
    __metadata("design:type", Array)
], BulkEnrollDto.prototype, "studentIds", void 0);
class CreateScheduleDto {
}
exports.CreateScheduleDto = CreateScheduleDto;
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(6, { message: 'Day of week must be between 0 (Sunday) and 6 (Saturday)' }),
    __metadata("design:type", Number)
], CreateScheduleDto.prototype, "dayOfWeek", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(10, { message: 'Time format is invalid' }),
    (0, sanitize_decorator_1.SanitizePlainText)(),
    __metadata("design:type", String)
], CreateScheduleDto.prototype, "startTime", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(10, { message: 'Time format is invalid' }),
    (0, sanitize_decorator_1.SanitizePlainText)(),
    __metadata("design:type", String)
], CreateScheduleDto.prototype, "endTime", void 0);
class AddSchedulesDto {
}
exports.AddSchedulesDto = AddSchedulesDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(7, { message: 'Cannot add more than 7 schedules at once' }),
    (0, class_transformer_1.Type)(() => CreateScheduleDto),
    __metadata("design:type", Array)
], AddSchedulesDto.prototype, "schedules", void 0);


/***/ }),
/* 87 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GradingModule = void 0;
const common_1 = __webpack_require__(2);
const grading_service_1 = __webpack_require__(88);
const grading_controller_1 = __webpack_require__(89);
let GradingModule = class GradingModule {
};
exports.GradingModule = GradingModule;
exports.GradingModule = GradingModule = __decorate([
    (0, common_1.Module)({
        controllers: [grading_controller_1.GradingController],
        providers: [grading_service_1.GradingService],
        exports: [grading_service_1.GradingService],
    })
], GradingModule);


/***/ }),
/* 88 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var GradingService_1;
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GradingService = void 0;
const common_1 = __webpack_require__(2);
const prisma_service_1 = __webpack_require__(10);
const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;
let GradingService = GradingService_1 = class GradingService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(GradingService_1.name);
    }
    async getPendingAssignmentsCount(studentId) {
        const count = await this.prisma.assignment.count({
            where: {
                isPublished: true,
                class: {
                    enrollments: {
                        some: {
                            studentId,
                            status: 'active',
                        },
                    },
                },
                submissions: {
                    none: {
                        studentId,
                    },
                },
            },
        });
        return { count };
    }
    async createAssignment(classId, teacherId, dto) {
        const cls = await this.prisma.class.findUnique({ where: { id: classId } });
        if (!cls)
            throw new common_1.NotFoundException('Class not found');
        return this.prisma.assignment.create({
            data: {
                classId,
                title: dto.title,
                description: dto.description,
                dueDate: new Date(dto.dueDate),
                maxPoints: dto.maxPoints ?? 100,
                type: dto.type ?? 'homework',
                createdById: teacherId,
            },
            include: {
                class: { select: { id: true, course: { select: { code: true, name: true } } } },
            },
        });
    }
    async getClassAssignments(classId, filters, page = 1, limit = DEFAULT_PAGE_SIZE) {
        const pageSize = Math.min(Math.max(1, limit), MAX_PAGE_SIZE);
        const skip = (Math.max(1, page) - 1) * pageSize;
        const where = { classId };
        if (filters?.type)
            where.type = filters.type;
        const [assignments, total] = await Promise.all([
            this.prisma.assignment.findMany({
                where,
                include: {
                    _count: { select: { submissions: true, grades: true } },
                    createdBy: { select: { firstName: true, lastName: true } },
                },
                orderBy: { dueDate: 'asc' },
                skip,
                take: pageSize,
            }),
            this.prisma.assignment.count({ where }),
        ]);
        return {
            data: assignments,
            meta: {
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            },
        };
    }
    async getAssignment(id) {
        const assignment = await this.prisma.assignment.findUnique({
            where: { id },
            include: {
                class: {
                    select: {
                        id: true,
                        teacherId: true,
                        course: { select: { code: true, name: true } },
                    },
                },
                submissions: {
                    include: {
                        student: { select: { id: true, firstName: true, lastName: true } },
                        grade: true,
                    },
                    orderBy: { student: { lastName: 'asc' } },
                },
                _count: { select: { submissions: true, grades: true } },
            },
        });
        if (!assignment)
            throw new common_1.NotFoundException('Assignment not found');
        return assignment;
    }
    async updateAssignment(id, teacherId, dto) {
        const assignment = await this.getAssignment(id);
        if (assignment.class.teacherId !== teacherId) {
            throw new common_1.ForbiddenException('Only the class teacher can update assignments');
        }
        const data = { ...dto };
        if (dto.dueDate)
            data.dueDate = new Date(dto.dueDate);
        return this.prisma.assignment.update({ where: { id }, data });
    }
    async deleteAssignment(id, teacherId, roles) {
        const assignment = await this.getAssignment(id);
        if (assignment.class.teacherId !== teacherId && !roles.includes('admin')) {
            throw new common_1.ForbiddenException('Only the class teacher or admin can delete assignments');
        }
        return this.prisma.assignment.delete({ where: { id } });
    }
    async submitAssignment(assignmentId, studentId, dto) {
        const assignment = await this.prisma.assignment.findUnique({
            where: { id: assignmentId },
            include: { class: { include: { enrollments: { where: { studentId, status: 'active' } } } } },
        });
        if (!assignment)
            throw new common_1.NotFoundException('Assignment not found');
        if (assignment.class.enrollments.length === 0) {
            throw new common_1.ForbiddenException('You are not enrolled in this class');
        }
        const isLate = new Date() > assignment.dueDate;
        const existing = await this.prisma.submission.findUnique({
            where: { assignmentId_studentId: { assignmentId, studentId } },
        });
        if (existing) {
            return this.prisma.submission.update({
                where: { id: existing.id },
                data: {
                    content: dto.content,
                    fileIds: dto.fileIds || [],
                    isLate,
                    submittedAt: new Date(),
                },
                include: { grade: true },
            });
        }
        return this.prisma.submission.create({
            data: {
                assignmentId,
                studentId,
                content: dto.content,
                fileIds: dto.fileIds || [],
                isLate,
            },
            include: { grade: true },
        });
    }
    async getSubmissions(assignmentId, page = 1, limit = DEFAULT_PAGE_SIZE) {
        const pageSize = Math.min(Math.max(1, limit), MAX_PAGE_SIZE);
        const skip = (Math.max(1, page) - 1) * pageSize;
        const [submissions, total] = await Promise.all([
            this.prisma.submission.findMany({
                where: { assignmentId },
                include: {
                    student: { select: { id: true, firstName: true, lastName: true, email: true } },
                    grade: true,
                },
                orderBy: { student: { lastName: 'asc' } },
                skip,
                take: pageSize,
            }),
            this.prisma.submission.count({ where: { assignmentId } }),
        ]);
        return {
            data: submissions,
            meta: {
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            },
        };
    }
    async getStudentSubmission(assignmentId, studentId) {
        const submission = await this.prisma.submission.findUnique({
            where: { assignmentId_studentId: { assignmentId, studentId } },
            include: { grade: true, assignment: true },
        });
        if (!submission)
            throw new common_1.NotFoundException('Submission not found');
        return submission;
    }
    async gradeSubmission(submissionId, graderId, dto) {
        const submission = await this.prisma.submission.findUnique({
            where: { id: submissionId },
            include: { assignment: true, grade: true },
        });
        if (!submission)
            throw new common_1.NotFoundException('Submission not found');
        if (dto.score > submission.assignment.maxPoints) {
            throw new common_1.ConflictException(`Score cannot exceed maximum points (${submission.assignment.maxPoints})`);
        }
        const letterGrade = dto.letterGrade || this.calculateLetterGrade(dto.score, submission.assignment.maxPoints);
        if (submission.grade) {
            return this.prisma.grade.update({
                where: { id: submission.grade.id },
                data: {
                    score: dto.score,
                    maxScore: submission.assignment.maxPoints,
                    feedback: dto.feedback,
                    letterGrade,
                    gradedById: graderId,
                    gradedAt: new Date(),
                },
                include: {
                    student: { select: { id: true, firstName: true, lastName: true } },
                },
            });
        }
        return this.prisma.grade.create({
            data: {
                assignmentId: submission.assignmentId,
                studentId: submission.studentId,
                submissionId: submission.id,
                score: dto.score,
                maxScore: submission.assignment.maxPoints,
                feedback: dto.feedback,
                letterGrade,
                gradedById: graderId,
            },
            include: {
                student: { select: { id: true, firstName: true, lastName: true } },
            },
        });
    }
    async bulkGrade(assignmentId, graderId, dto) {
        const assignment = await this.prisma.assignment.findUnique({ where: { id: assignmentId } });
        if (!assignment)
            throw new common_1.NotFoundException('Assignment not found');
        const results = await this.prisma.$transaction(async (tx) => {
            const processed = [];
            for (const g of dto.grades) {
                if (g.score > assignment.maxPoints) {
                    processed.push({
                        studentId: g.studentId,
                        status: 'failed',
                        error: `Score cannot exceed maximum points (${assignment.maxPoints})`,
                    });
                    continue;
                }
                const letterGrade = g.letterGrade || this.calculateLetterGrade(g.score, assignment.maxPoints);
                try {
                    const grade = await tx.grade.upsert({
                        where: { assignmentId_studentId: { assignmentId, studentId: g.studentId } },
                        create: {
                            assignmentId,
                            studentId: g.studentId,
                            score: g.score,
                            maxScore: assignment.maxPoints,
                            feedback: g.feedback,
                            letterGrade,
                            gradedById: graderId,
                        },
                        update: {
                            score: g.score,
                            feedback: g.feedback,
                            letterGrade,
                            gradedById: graderId,
                            gradedAt: new Date(),
                        },
                        include: {
                            student: { select: { id: true, firstName: true, lastName: true } },
                        },
                    });
                    processed.push({ studentId: g.studentId, status: 'graded', grade });
                }
                catch (err) {
                    processed.push({ studentId: g.studentId, status: 'failed', error: err.message });
                }
            }
            return processed;
        });
        this.logger.log(`Bulk grading completed for assignment ${assignmentId}: ${results.filter(r => r.status === 'graded').length} graded, ${results.filter(r => r.status === 'failed').length} failed`);
        return results;
    }
    async getClassGradebook(classId) {
        const assignments = await this.prisma.assignment.findMany({
            where: { classId },
            orderBy: { dueDate: 'asc' },
            select: { id: true, title: true, maxPoints: true, type: true, dueDate: true },
        });
        const enrollments = await this.prisma.classEnrollment.findMany({
            where: { classId, status: 'active' },
            include: {
                student: { select: { id: true, firstName: true, lastName: true, email: true } },
            },
            orderBy: { student: { lastName: 'asc' } },
        });
        const grades = await this.prisma.grade.findMany({
            where: { assignmentId: { in: assignments.map((a) => a.id) } },
        });
        const gradeMap = new Map();
        for (const g of grades) {
            if (!gradeMap.has(g.studentId))
                gradeMap.set(g.studentId, new Map());
            gradeMap.get(g.studentId).set(g.assignmentId, {
                score: g.score,
                maxScore: g.maxScore,
                letterGrade: g.letterGrade,
                percentage: Math.round((g.score / g.maxScore) * 100),
            });
        }
        const students = enrollments.map((e) => {
            const studentGrades = gradeMap.get(e.studentId) || new Map();
            const assignmentGrades = assignments.map((a) => ({
                assignmentId: a.id,
                ...(studentGrades.get(a.id) || { score: null, maxScore: a.maxPoints, letterGrade: null, percentage: null }),
            }));
            const scored = assignmentGrades.filter((g) => g.score !== null);
            const totalScore = scored.reduce((sum, g) => sum + g.score, 0);
            const totalMax = scored.reduce((sum, g) => sum + g.maxScore, 0);
            const overallPercentage = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : null;
            const overallGrade = overallPercentage !== null ? this.calculateLetterGrade(totalScore, totalMax) : null;
            return {
                student: e.student,
                grades: assignmentGrades,
                overall: { totalScore, totalMax, percentage: overallPercentage, letterGrade: overallGrade },
            };
        });
        return { assignments, students };
    }
    async getStudentGrades(studentId, classId, page = 1, limit = DEFAULT_PAGE_SIZE) {
        const pageSize = Math.min(Math.max(1, limit), MAX_PAGE_SIZE);
        let assignmentIds = [];
        if (classId) {
            const assignments = await this.prisma.assignment.findMany({
                where: { classId },
                select: { id: true },
            });
            assignmentIds = assignments.map((a) => a.id);
        }
        const where = { studentId };
        if (classId)
            where.assignmentId = { in: assignmentIds };
        const [grades, total] = await Promise.all([
            this.prisma.grade.findMany({
                where,
                include: {
                    assignment: {
                        include: {
                            class: { select: { id: true, course: { select: { code: true, name: true } } } },
                        },
                    },
                    gradedBy: { select: { firstName: true, lastName: true } },
                },
                orderBy: { gradedAt: 'desc' },
                take: pageSize,
                skip: (page - 1) * pageSize,
            }),
            this.prisma.grade.count({ where }),
        ]);
        return {
            data: grades,
            meta: {
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            },
        };
    }
    calculateLetterGrade(score, maxScore) {
        const pct = (score / maxScore) * 100;
        if (pct >= 93)
            return 'A';
        if (pct >= 90)
            return 'A-';
        if (pct >= 87)
            return 'B+';
        if (pct >= 83)
            return 'B';
        if (pct >= 80)
            return 'B-';
        if (pct >= 77)
            return 'C+';
        if (pct >= 73)
            return 'C';
        if (pct >= 70)
            return 'C-';
        if (pct >= 67)
            return 'D+';
        if (pct >= 63)
            return 'D';
        if (pct >= 60)
            return 'D-';
        return 'F';
    }
};
exports.GradingService = GradingService;
exports.GradingService = GradingService = GradingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], GradingService);


/***/ }),
/* 89 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c, _d, _e, _f;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GradingController = void 0;
const common_1 = __webpack_require__(2);
const swagger_1 = __webpack_require__(3);
const grading_service_1 = __webpack_require__(88);
const grading_dto_1 = __webpack_require__(90);
const jwt_auth_guard_1 = __webpack_require__(29);
const roles_guard_1 = __webpack_require__(32);
const roles_decorator_1 = __webpack_require__(33);
let GradingController = class GradingController {
    constructor(gradingService) {
        this.gradingService = gradingService;
    }
    createAssignment(classId, dto, req) {
        return this.gradingService.createAssignment(classId, req.user.sub, dto);
    }
    getPendingAssignmentsCount(req) {
        return this.gradingService.getPendingAssignmentsCount(req.user.sub);
    }
    getClassAssignments(classId, type) {
        return this.gradingService.getClassAssignments(classId, { type });
    }
    getAssignment(id) {
        return this.gradingService.getAssignment(id);
    }
    updateAssignment(id, dto, req) {
        return this.gradingService.updateAssignment(id, req.user.sub, dto);
    }
    deleteAssignment(id, req) {
        return this.gradingService.deleteAssignment(id, req.user.sub, req.user.roles);
    }
    submitAssignment(assignmentId, dto, req) {
        return this.gradingService.submitAssignment(assignmentId, req.user.sub, dto);
    }
    getSubmissions(assignmentId) {
        return this.gradingService.getSubmissions(assignmentId);
    }
    getMySubmission(assignmentId, req) {
        return this.gradingService.getStudentSubmission(assignmentId, req.user.sub);
    }
    gradeSubmission(submissionId, dto, req) {
        return this.gradingService.gradeSubmission(submissionId, req.user.sub, dto);
    }
    bulkGrade(assignmentId, dto, req) {
        return this.gradingService.bulkGrade(assignmentId, req.user.sub, dto);
    }
    getClassGradebook(classId) {
        return this.gradingService.getClassGradebook(classId);
    }
    getStudentGrades(studentId, classId) {
        return this.gradingService.getStudentGrades(studentId, classId);
    }
    getMyGrades(req, classId) {
        return this.gradingService.getStudentGrades(req.user.sub, classId);
    }
};
exports.GradingController = GradingController;
__decorate([
    (0, common_1.Post)('classes/:classId/assignments'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'teacher'),
    __param(0, (0, common_1.Param)('classId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_b = typeof grading_dto_1.CreateAssignmentDto !== "undefined" && grading_dto_1.CreateAssignmentDto) === "function" ? _b : Object, Object]),
    __metadata("design:returntype", void 0)
], GradingController.prototype, "createAssignment", null);
__decorate([
    (0, common_1.Get)('assignments/pending/count'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], GradingController.prototype, "getPendingAssignmentsCount", null);
__decorate([
    (0, common_1.Get)('classes/:classId/assignments'),
    __param(0, (0, common_1.Param)('classId')),
    __param(1, (0, common_1.Query)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], GradingController.prototype, "getClassAssignments", null);
__decorate([
    (0, common_1.Get)('assignments/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], GradingController.prototype, "getAssignment", null);
__decorate([
    (0, common_1.Put)('assignments/:id'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'teacher'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_c = typeof grading_dto_1.UpdateAssignmentDto !== "undefined" && grading_dto_1.UpdateAssignmentDto) === "function" ? _c : Object, Object]),
    __metadata("design:returntype", void 0)
], GradingController.prototype, "updateAssignment", null);
__decorate([
    (0, common_1.Delete)('assignments/:id'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'teacher'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], GradingController.prototype, "deleteAssignment", null);
__decorate([
    (0, common_1.Post)('assignments/:id/submit'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('student'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_d = typeof grading_dto_1.CreateSubmissionDto !== "undefined" && grading_dto_1.CreateSubmissionDto) === "function" ? _d : Object, Object]),
    __metadata("design:returntype", void 0)
], GradingController.prototype, "submitAssignment", null);
__decorate([
    (0, common_1.Get)('assignments/:id/submissions'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'teacher'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], GradingController.prototype, "getSubmissions", null);
__decorate([
    (0, common_1.Get)('assignments/:assignmentId/submissions/my'),
    __param(0, (0, common_1.Param)('assignmentId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], GradingController.prototype, "getMySubmission", null);
__decorate([
    (0, common_1.Post)('submissions/:id/grade'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'teacher'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_e = typeof grading_dto_1.GradeSubmissionDto !== "undefined" && grading_dto_1.GradeSubmissionDto) === "function" ? _e : Object, Object]),
    __metadata("design:returntype", void 0)
], GradingController.prototype, "gradeSubmission", null);
__decorate([
    (0, common_1.Post)('assignments/:id/grades/bulk'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'teacher'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_f = typeof grading_dto_1.BulkGradeDto !== "undefined" && grading_dto_1.BulkGradeDto) === "function" ? _f : Object, Object]),
    __metadata("design:returntype", void 0)
], GradingController.prototype, "bulkGrade", null);
__decorate([
    (0, common_1.Get)('classes/:classId/gradebook'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'teacher'),
    __param(0, (0, common_1.Param)('classId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], GradingController.prototype, "getClassGradebook", null);
__decorate([
    (0, common_1.Get)('students/:studentId/grades'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'teacher'),
    __param(0, (0, common_1.Param)('studentId')),
    __param(1, (0, common_1.Query)('classId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], GradingController.prototype, "getStudentGrades", null);
__decorate([
    (0, common_1.Get)('grades/my'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('classId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], GradingController.prototype, "getMyGrades", null);
exports.GradingController = GradingController = __decorate([
    (0, swagger_1.ApiTags)('Grading'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [typeof (_a = typeof grading_service_1.GradingService !== "undefined" && grading_service_1.GradingService) === "function" ? _a : Object])
], GradingController);


/***/ }),
/* 90 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BulkGradeDto = exports.GradeSubmissionDto = exports.CreateSubmissionDto = exports.UpdateAssignmentDto = exports.CreateAssignmentDto = exports.AssignmentType = void 0;
const class_validator_1 = __webpack_require__(23);
const class_transformer_1 = __webpack_require__(26);
const sanitize_decorator_1 = __webpack_require__(24);
var AssignmentType;
(function (AssignmentType) {
    AssignmentType["HOMEWORK"] = "homework";
    AssignmentType["QUIZ"] = "quiz";
    AssignmentType["EXAM"] = "exam";
    AssignmentType["PROJECT"] = "project";
})(AssignmentType || (exports.AssignmentType = AssignmentType = {}));
class CreateAssignmentDto {
}
exports.CreateAssignmentDto = CreateAssignmentDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200, { message: 'Title cannot exceed 200 characters' }),
    (0, sanitize_decorator_1.SanitizePlainText)(),
    __metadata("design:type", String)
], CreateAssignmentDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(5000, { message: 'Description cannot exceed 5000 characters' }),
    (0, sanitize_decorator_1.SanitizeHtml)(),
    __metadata("design:type", String)
], CreateAssignmentDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsDateString)({}, { message: 'Due date must be a valid ISO date string' }),
    __metadata("design:type", String)
], CreateAssignmentDto.prototype, "dueDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1, { message: 'Max points must be at least 1' }),
    (0, class_validator_1.Max)(10000, { message: 'Max points cannot exceed 10000' }),
    __metadata("design:type", Number)
], CreateAssignmentDto.prototype, "maxPoints", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsEnum)(AssignmentType),
    __metadata("design:type", String)
], CreateAssignmentDto.prototype, "type", void 0);
class UpdateAssignmentDto {
}
exports.UpdateAssignmentDto = UpdateAssignmentDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200, { message: 'Title cannot exceed 200 characters' }),
    (0, sanitize_decorator_1.SanitizePlainText)(),
    __metadata("design:type", String)
], UpdateAssignmentDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(5000, { message: 'Description cannot exceed 5000 characters' }),
    (0, sanitize_decorator_1.SanitizeHtml)(),
    __metadata("design:type", String)
], UpdateAssignmentDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)({}, { message: 'Due date must be a valid ISO date string' }),
    __metadata("design:type", String)
], UpdateAssignmentDto.prototype, "dueDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1, { message: 'Max points must be at least 1' }),
    (0, class_validator_1.Max)(10000, { message: 'Max points cannot exceed 10000' }),
    __metadata("design:type", Number)
], UpdateAssignmentDto.prototype, "maxPoints", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsEnum)(AssignmentType),
    __metadata("design:type", String)
], UpdateAssignmentDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateAssignmentDto.prototype, "isPublished", void 0);
class CreateSubmissionDto {
}
exports.CreateSubmissionDto = CreateSubmissionDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(10000, { message: 'Content cannot exceed 10000 characters' }),
    (0, sanitize_decorator_1.SanitizeHtml)(),
    __metadata("design:type", String)
], CreateSubmissionDto.prototype, "content", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(10, { message: 'Cannot attach more than 10 files' }),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateSubmissionDto.prototype, "fileIds", void 0);
class GradeSubmissionDto {
}
exports.GradeSubmissionDto = GradeSubmissionDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0, { message: 'Score cannot be negative' }),
    (0, class_validator_1.Max)(10000, { message: 'Score cannot exceed 10000' }),
    __metadata("design:type", Number)
], GradeSubmissionDto.prototype, "score", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000, { message: 'Feedback cannot exceed 2000 characters' }),
    (0, sanitize_decorator_1.SanitizeHtml)(),
    __metadata("design:type", String)
], GradeSubmissionDto.prototype, "feedback", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(5, { message: 'Letter grade cannot exceed 5 characters' }),
    (0, sanitize_decorator_1.SanitizePlainText)(),
    __metadata("design:type", String)
], GradeSubmissionDto.prototype, "letterGrade", void 0);
class SingleGradeDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsUUID)('4'),
    __metadata("design:type", String)
], SingleGradeDto.prototype, "studentId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(10000),
    __metadata("design:type", Number)
], SingleGradeDto.prototype, "score", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    (0, sanitize_decorator_1.SanitizeHtml)(),
    __metadata("design:type", String)
], SingleGradeDto.prototype, "feedback", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(5),
    (0, sanitize_decorator_1.SanitizePlainText)(),
    __metadata("design:type", String)
], SingleGradeDto.prototype, "letterGrade", void 0);
class BulkGradeDto {
}
exports.BulkGradeDto = BulkGradeDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(100, { message: 'Cannot grade more than 100 students at once' }),
    (0, class_transformer_1.Type)(() => SingleGradeDto),
    __metadata("design:type", Array)
], BulkGradeDto.prototype, "grades", void 0);


/***/ }),
/* 91 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AttendanceModule = void 0;
const common_1 = __webpack_require__(2);
const attendance_service_1 = __webpack_require__(92);
const attendance_controller_1 = __webpack_require__(94);
let AttendanceModule = class AttendanceModule {
};
exports.AttendanceModule = AttendanceModule;
exports.AttendanceModule = AttendanceModule = __decorate([
    (0, common_1.Module)({
        controllers: [attendance_controller_1.AttendanceController],
        providers: [attendance_service_1.AttendanceService],
        exports: [attendance_service_1.AttendanceService],
    })
], AttendanceModule);


/***/ }),
/* 92 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AttendanceService_1;
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AttendanceService = void 0;
const common_1 = __webpack_require__(2);
const prisma_service_1 = __webpack_require__(10);
const attendance_dto_1 = __webpack_require__(93);
const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;
let AttendanceService = AttendanceService_1 = class AttendanceService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(AttendanceService_1.name);
    }
    async createSession(classId, teacherId, dto) {
        const cls = await this.prisma.class.findUnique({ where: { id: classId } });
        if (!cls)
            throw new common_1.NotFoundException('Class not found');
        const date = new Date(dto.date);
        date.setHours(0, 0, 0, 0);
        const period = dto.period || 1;
        const existing = await this.prisma.attendanceSession.findUnique({
            where: { classId_date_period: { classId, date, period } },
        });
        if (existing)
            throw new common_1.ConflictException(`Attendance session already exists for this date and period ${period}`);
        return this.prisma.attendanceSession.create({
            data: {
                classId,
                date,
                period,
                notes: dto.notes,
                createdById: teacherId,
            },
            include: {
                records: {
                    include: {
                        student: { select: { id: true, firstName: true, lastName: true } },
                    },
                },
            },
        });
    }
    async getClassSessions(classId, startDate, endDate, page = 1, limit = DEFAULT_PAGE_SIZE) {
        const pageSize = Math.min(Math.max(1, limit), MAX_PAGE_SIZE);
        const skip = (Math.max(1, page) - 1) * pageSize;
        const where = { classId };
        if (startDate || endDate) {
            where.date = {};
            if (startDate)
                where.date.gte = new Date(startDate);
            if (endDate)
                where.date.lte = new Date(endDate);
        }
        const [sessions, total] = await Promise.all([
            this.prisma.attendanceSession.findMany({
                where,
                include: {
                    records: {
                        include: {
                            student: { select: { id: true, firstName: true, lastName: true } },
                        },
                    },
                    _count: { select: { records: true } },
                },
                orderBy: [{ date: 'desc' }, { period: 'asc' }],
                skip,
                take: pageSize,
            }),
            this.prisma.attendanceSession.count({ where }),
        ]);
        return {
            data: sessions,
            meta: {
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            },
        };
    }
    async getSession(sessionId) {
        const session = await this.prisma.attendanceSession.findUnique({
            where: { id: sessionId },
            include: {
                class: {
                    include: {
                        course: { select: { code: true, name: true } },
                        enrollments: {
                            where: { status: 'active' },
                            include: {
                                student: { select: { id: true, firstName: true, lastName: true, email: true } },
                            },
                        },
                    },
                },
                records: {
                    include: {
                        student: { select: { id: true, firstName: true, lastName: true } },
                        markedBy: { select: { firstName: true, lastName: true } },
                    },
                    orderBy: { student: { lastName: 'asc' } },
                },
            },
        });
        if (!session)
            throw new common_1.NotFoundException('Attendance session not found');
        return session;
    }
    async markAttendance(sessionId, studentId, teacherId, dto) {
        const session = await this.prisma.attendanceSession.findUnique({ where: { id: sessionId } });
        if (!session)
            throw new common_1.NotFoundException('Session not found');
        const validStatuses = Object.values(attendance_dto_1.AttendanceStatus);
        if (!validStatuses.includes(dto.status)) {
            throw new common_1.ConflictException(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
        }
        return this.prisma.attendanceRecord.upsert({
            where: { sessionId_studentId: { sessionId, studentId } },
            create: {
                sessionId,
                studentId,
                status: dto.status,
                notes: dto.notes,
                markedById: teacherId,
            },
            update: {
                status: dto.status,
                notes: dto.notes,
                markedById: teacherId,
                markedAt: new Date(),
            },
            include: {
                student: { select: { id: true, firstName: true, lastName: true } },
            },
        });
    }
    async bulkMarkAttendance(classId, teacherId, dto) {
        const date = new Date(dto.date);
        date.setHours(0, 0, 0, 0);
        const period = dto.period || 1;
        return this.prisma.$transaction(async (tx) => {
            let session = await tx.attendanceSession.findUnique({
                where: { classId_date_period: { classId, date, period } },
            });
            if (!session) {
                session = await tx.attendanceSession.create({
                    data: {
                        classId,
                        date,
                        period,
                        notes: dto.sessionNotes,
                        createdById: teacherId,
                    },
                });
            }
            const validStatuses = Object.values(attendance_dto_1.AttendanceStatus);
            for (const record of dto.records) {
                if (!validStatuses.includes(record.status)) {
                    throw new common_1.ConflictException(`Invalid status '${record.status}' for student ${record.studentId}. Must be one of: ${validStatuses.join(', ')}`);
                }
            }
            const results = await Promise.all(dto.records.map((record) => tx.attendanceRecord.upsert({
                where: { sessionId_studentId: { sessionId: session.id, studentId: record.studentId } },
                create: {
                    sessionId: session.id,
                    studentId: record.studentId,
                    status: record.status,
                    notes: record.notes,
                    markedById: teacherId,
                },
                update: {
                    status: record.status,
                    notes: record.notes,
                    markedById: teacherId,
                    markedAt: new Date(),
                },
                include: {
                    student: { select: { id: true, firstName: true, lastName: true } },
                },
            })));
            const summary = {
                total: results.length,
                present: results.filter((r) => r.status === attendance_dto_1.AttendanceStatus.PRESENT).length,
                absent: results.filter((r) => r.status === attendance_dto_1.AttendanceStatus.ABSENT).length,
                late: results.filter((r) => r.status === attendance_dto_1.AttendanceStatus.LATE).length,
                excused: results.filter((r) => r.status === attendance_dto_1.AttendanceStatus.EXCUSED).length,
            };
            this.logger.log(`Bulk attendance marked for class ${classId} on ${date.toISOString()} period ${period}: ${summary.total} records`);
            return {
                session,
                records: results,
                summary,
            };
        });
    }
    async getClassWeeklyAttendance(classId, startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        const sessions = await this.prisma.attendanceSession.findMany({
            where: {
                classId,
                date: {
                    gte: start,
                    lte: end,
                },
            },
            include: {
                records: {
                    include: {
                        student: { select: { id: true, firstName: true, lastName: true } },
                    },
                },
            },
            orderBy: [{ date: 'asc' }, { period: 'asc' }],
        });
        const weeklyData = new Map();
        const enrollments = await this.prisma.classEnrollment.findMany({
            where: { classId, status: 'active' },
            include: { student: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
            orderBy: { student: { lastName: 'asc' } }
        });
        for (const enrollment of enrollments) {
            weeklyData.set(enrollment.studentId, {
                student: enrollment.student,
                attendance: {}
            });
        }
        for (const session of sessions) {
            const dateStr = session.date.toISOString().split('T')[0];
            const period = session.period;
            for (const record of session.records) {
                if (!weeklyData.has(record.studentId)) {
                    weeklyData.set(record.studentId, {
                        student: record.student,
                        attendance: {}
                    });
                }
                const studentEntry = weeklyData.get(record.studentId);
                if (!studentEntry.attendance[dateStr]) {
                    studentEntry.attendance[dateStr] = {};
                }
                studentEntry.attendance[dateStr][period] = record.status;
            }
        }
        return {
            startDate,
            endDate,
            students: Array.from(weeklyData.values()),
        };
    }
    async getStudentAttendance(studentId, classId, startDate, endDate, page = 1, limit = DEFAULT_PAGE_SIZE) {
        const pageSize = Math.min(Math.max(1, limit), MAX_PAGE_SIZE);
        const skip = (Math.max(1, page) - 1) * pageSize;
        const where = { studentId };
        if (classId)
            where.session = { classId };
        if (startDate || endDate) {
            where.session = where.session || {};
            where.session.date = {};
            if (startDate)
                where.session.date.gte = new Date(startDate);
            if (endDate)
                where.session.date.lte = new Date(endDate);
        }
        const [records, total] = await Promise.all([
            this.prisma.attendanceRecord.findMany({
                where,
                include: {
                    session: {
                        include: {
                            class: {
                                select: { id: true, course: { select: { code: true, name: true } } },
                            },
                        },
                    },
                },
                orderBy: { session: { date: 'desc' } },
                skip,
                take: pageSize,
            }),
            this.prisma.attendanceRecord.count({ where }),
        ]);
        const allRecordsForSummary = await this.prisma.attendanceRecord.findMany({
            where,
            select: { status: true },
        });
        const summary = this.calculateSummary(allRecordsForSummary);
        return {
            data: records,
            summary,
            meta: {
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            },
        };
    }
    async getClassAttendanceSummary(classId, startDate, endDate) {
        const dateFilter = {};
        if (startDate)
            dateFilter.gte = new Date(startDate);
        if (endDate)
            dateFilter.lte = new Date(endDate);
        const sessions = await this.prisma.attendanceSession.findMany({
            where: {
                classId,
                ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
            },
            include: {
                records: {
                    include: {
                        student: { select: { id: true, firstName: true, lastName: true } },
                    },
                },
            },
            orderBy: { date: 'desc' },
        });
        const studentMap = new Map();
        for (const session of sessions) {
            for (const record of session.records) {
                const key = record.studentId;
                if (!studentMap.has(key)) {
                    studentMap.set(key, {
                        name: `${record.student.firstName} ${record.student.lastName}`,
                        present: 0, absent: 0, late: 0, excused: 0, total: 0,
                    });
                }
                const stats = studentMap.get(key);
                stats.total++;
                switch (record.status) {
                    case attendance_dto_1.AttendanceStatus.PRESENT:
                        stats.present++;
                        break;
                    case attendance_dto_1.AttendanceStatus.ABSENT:
                        stats.absent++;
                        break;
                    case attendance_dto_1.AttendanceStatus.LATE:
                        stats.late++;
                        break;
                    case attendance_dto_1.AttendanceStatus.EXCUSED:
                        stats.excused++;
                        break;
                }
            }
        }
        const studentSummaries = Array.from(studentMap.entries()).map(([id, stats]) => ({
            studentId: id,
            ...stats,
            attendanceRate: stats.total > 0 ? Math.round(((stats.present + stats.late) / stats.total) * 100) : 0,
        }));
        return {
            totalSessions: sessions.length,
            students: studentSummaries.sort((a, b) => a.name.localeCompare(b.name)),
        };
    }
    async getAttendanceReport(filters) {
        if (filters?.classId) {
            return this.getClassAttendanceSummary(filters.classId, filters?.startDate, filters?.endDate);
        }
        const dateFilter = {};
        if (filters?.startDate)
            dateFilter.gte = new Date(filters.startDate);
        if (filters?.endDate)
            dateFilter.lte = new Date(filters.endDate);
        const [sessions, totalRecords] = await Promise.all([
            this.prisma.attendanceSession.findMany({
                where: Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {},
                include: {
                    class: { select: { id: true, course: { select: { code: true, name: true } } } },
                    _count: { select: { records: true } },
                },
                orderBy: { date: 'desc' },
                take: 20,
            }),
            this.prisma.attendanceRecord.groupBy({
                by: ['status'],
                where: Object.keys(dateFilter).length > 0 ? { session: { date: dateFilter } } : {},
                _count: true,
            }),
        ]);
        return {
            totalSessions: await this.prisma.attendanceSession.count({
                where: Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {},
            }),
            breakdown: totalRecords.map((r) => ({ status: r.status, count: r._count })),
            recentSessions: sessions,
        };
    }
    calculateSummary(records) {
        const total = records.length;
        const present = records.filter((r) => r.status === attendance_dto_1.AttendanceStatus.PRESENT).length;
        const absent = records.filter((r) => r.status === attendance_dto_1.AttendanceStatus.ABSENT).length;
        const late = records.filter((r) => r.status === attendance_dto_1.AttendanceStatus.LATE).length;
        const excused = records.filter((r) => r.status === attendance_dto_1.AttendanceStatus.EXCUSED).length;
        return {
            total,
            present,
            absent,
            late,
            excused,
            attendanceRate: total > 0 ? Math.round(((present + late) / total) * 100) : 0,
        };
    }
};
exports.AttendanceService = AttendanceService;
exports.AttendanceService = AttendanceService = AttendanceService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], AttendanceService);


/***/ }),
/* 93 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AttendanceReportQuery = exports.BulkAttendanceDto = exports.BulkAttendanceEntry = exports.MarkAttendanceDto = exports.CreateAttendanceSessionDto = exports.AttendanceStatus = void 0;
const class_validator_1 = __webpack_require__(23);
const class_transformer_1 = __webpack_require__(26);
const sanitize_decorator_1 = __webpack_require__(24);
var AttendanceStatus;
(function (AttendanceStatus) {
    AttendanceStatus["PRESENT"] = "present";
    AttendanceStatus["ABSENT"] = "absent";
    AttendanceStatus["LATE"] = "late";
    AttendanceStatus["EXCUSED"] = "excused";
})(AttendanceStatus || (exports.AttendanceStatus = AttendanceStatus = {}));
class CreateAttendanceSessionDto {
}
exports.CreateAttendanceSessionDto = CreateAttendanceSessionDto;
__decorate([
    (0, class_validator_1.IsDateString)({}, { message: 'Date must be a valid ISO date string' }),
    __metadata("design:type", String)
], CreateAttendanceSessionDto.prototype, "date", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)({ message: 'Period must be an integer (1-3)' }),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(3),
    __metadata("design:type", Number)
], CreateAttendanceSessionDto.prototype, "period", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000, { message: 'Notes cannot exceed 1000 characters' }),
    (0, sanitize_decorator_1.SanitizePlainText)(),
    __metadata("design:type", String)
], CreateAttendanceSessionDto.prototype, "notes", void 0);
class MarkAttendanceDto {
}
exports.MarkAttendanceDto = MarkAttendanceDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsEnum)(AttendanceStatus, { message: 'Status must be one of: present, absent, late, excused' }),
    __metadata("design:type", String)
], MarkAttendanceDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500, { message: 'Notes cannot exceed 500 characters' }),
    (0, sanitize_decorator_1.SanitizePlainText)(),
    __metadata("design:type", String)
], MarkAttendanceDto.prototype, "notes", void 0);
class BulkAttendanceEntry {
}
exports.BulkAttendanceEntry = BulkAttendanceEntry;
__decorate([
    (0, class_validator_1.IsUUID)('4', { message: 'Invalid student ID' }),
    __metadata("design:type", String)
], BulkAttendanceEntry.prototype, "studentId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsEnum)(AttendanceStatus, { message: 'Status must be one of: present, absent, late, excused' }),
    __metadata("design:type", String)
], BulkAttendanceEntry.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500, { message: 'Notes cannot exceed 500 characters' }),
    (0, sanitize_decorator_1.SanitizePlainText)(),
    __metadata("design:type", String)
], BulkAttendanceEntry.prototype, "notes", void 0);
class BulkAttendanceDto {
}
exports.BulkAttendanceDto = BulkAttendanceDto;
__decorate([
    (0, class_validator_1.IsDateString)({}, { message: 'Date must be a valid ISO date string' }),
    __metadata("design:type", String)
], BulkAttendanceDto.prototype, "date", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)({ message: 'Period must be an integer (1-3)' }),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(3),
    __metadata("design:type", Number)
], BulkAttendanceDto.prototype, "period", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(200, { message: 'Cannot mark attendance for more than 200 students at once' }),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => BulkAttendanceEntry),
    __metadata("design:type", Array)
], BulkAttendanceDto.prototype, "records", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000, { message: 'Session notes cannot exceed 1000 characters' }),
    (0, sanitize_decorator_1.SanitizePlainText)(),
    __metadata("design:type", String)
], BulkAttendanceDto.prototype, "sessionNotes", void 0);
class AttendanceReportQuery {
}
exports.AttendanceReportQuery = AttendanceReportQuery;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)({}, { message: 'Start date must be a valid ISO date string' }),
    __metadata("design:type", String)
], AttendanceReportQuery.prototype, "startDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)({}, { message: 'End date must be a valid ISO date string' }),
    __metadata("design:type", String)
], AttendanceReportQuery.prototype, "endDate", void 0);


/***/ }),
/* 94 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AttendanceController = void 0;
const common_1 = __webpack_require__(2);
const swagger_1 = __webpack_require__(3);
const attendance_service_1 = __webpack_require__(92);
const attendance_dto_1 = __webpack_require__(93);
const jwt_auth_guard_1 = __webpack_require__(29);
const roles_guard_1 = __webpack_require__(32);
const roles_decorator_1 = __webpack_require__(33);
let AttendanceController = class AttendanceController {
    constructor(attendanceService) {
        this.attendanceService = attendanceService;
    }
    createSession(classId, dto, req) {
        return this.attendanceService.createSession(classId, req.user.sub, dto);
    }
    getClassSessions(classId, startDate, endDate) {
        return this.attendanceService.getClassSessions(classId, startDate, endDate);
    }
    getSession(sessionId) {
        return this.attendanceService.getSession(sessionId);
    }
    markAttendance(sessionId, studentId, dto, req) {
        return this.attendanceService.markAttendance(sessionId, studentId, req.user.sub, dto);
    }
    bulkMarkAttendance(classId, dto, req) {
        return this.attendanceService.bulkMarkAttendance(classId, req.user.sub, dto);
    }
    getStudentAttendance(studentId, classId, startDate, endDate) {
        return this.attendanceService.getStudentAttendance(studentId, classId, startDate, endDate);
    }
    getMyAttendance(req, classId, startDate, endDate) {
        return this.attendanceService.getStudentAttendance(req.user.sub, classId, startDate, endDate);
    }
    getWeeklyAttendance(classId, startDate, endDate) {
        return this.attendanceService.getClassWeeklyAttendance(classId, startDate, endDate);
    }
    getClassSummary(classId, startDate, endDate) {
        return this.attendanceService.getClassAttendanceSummary(classId, startDate, endDate);
    }
    getReports(classId, startDate, endDate) {
        return this.attendanceService.getAttendanceReport({ classId, startDate, endDate });
    }
};
exports.AttendanceController = AttendanceController;
__decorate([
    (0, common_1.Post)('classes/:classId/attendance'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'teacher'),
    __param(0, (0, common_1.Param)('classId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_b = typeof attendance_dto_1.CreateAttendanceSessionDto !== "undefined" && attendance_dto_1.CreateAttendanceSessionDto) === "function" ? _b : Object, Object]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "createSession", null);
__decorate([
    (0, common_1.Get)('classes/:classId/attendance'),
    __param(0, (0, common_1.Param)('classId')),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "getClassSessions", null);
__decorate([
    (0, common_1.Get)('attendance/sessions/:sessionId'),
    __param(0, (0, common_1.Param)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "getSession", null);
__decorate([
    (0, common_1.Put)('attendance/:sessionId/students/:studentId'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'teacher'),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Param)('studentId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, typeof (_c = typeof attendance_dto_1.MarkAttendanceDto !== "undefined" && attendance_dto_1.MarkAttendanceDto) === "function" ? _c : Object, Object]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "markAttendance", null);
__decorate([
    (0, common_1.Post)('classes/:classId/attendance/bulk'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'teacher'),
    __param(0, (0, common_1.Param)('classId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_d = typeof attendance_dto_1.BulkAttendanceDto !== "undefined" && attendance_dto_1.BulkAttendanceDto) === "function" ? _d : Object, Object]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "bulkMarkAttendance", null);
__decorate([
    (0, common_1.Get)('students/:studentId/attendance'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'teacher', 'parent'),
    __param(0, (0, common_1.Param)('studentId')),
    __param(1, (0, common_1.Query)('classId')),
    __param(2, (0, common_1.Query)('startDate')),
    __param(3, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "getStudentAttendance", null);
__decorate([
    (0, common_1.Get)('attendance/my'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('classId')),
    __param(2, (0, common_1.Query)('startDate')),
    __param(3, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "getMyAttendance", null);
__decorate([
    (0, common_1.Get)('classes/:classId/attendance/weekly'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'teacher'),
    __param(0, (0, common_1.Param)('classId')),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "getWeeklyAttendance", null);
__decorate([
    (0, common_1.Get)('classes/:classId/attendance/summary'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'teacher'),
    __param(0, (0, common_1.Param)('classId')),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "getClassSummary", null);
__decorate([
    (0, common_1.Get)('attendance/reports'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Query)('classId')),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "getReports", null);
exports.AttendanceController = AttendanceController = __decorate([
    (0, swagger_1.ApiTags)('Attendance'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [typeof (_a = typeof attendance_service_1.AttendanceService !== "undefined" && attendance_service_1.AttendanceService) === "function" ? _a : Object])
], AttendanceController);


/***/ }),
/* 95 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FilesModule = void 0;
const common_1 = __webpack_require__(2);
const files_service_1 = __webpack_require__(96);
const files_controller_1 = __webpack_require__(104);
const storage_service_1 = __webpack_require__(107);
const throttler_1 = __webpack_require__(6);
const core_1 = __webpack_require__(1);
let FilesModule = class FilesModule {
};
exports.FilesModule = FilesModule;
exports.FilesModule = FilesModule = __decorate([
    (0, common_1.Module)({
        controllers: [files_controller_1.FilesController],
        providers: [
            files_service_1.FilesService,
            storage_service_1.StorageService,
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_1.ThrottlerGuard,
            },
        ],
        exports: [files_service_1.FilesService, storage_service_1.StorageService],
    })
], FilesModule);


/***/ }),
/* 96 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var FilesService_1;
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FilesService = void 0;
const common_1 = __webpack_require__(2);
const prisma_service_1 = __webpack_require__(10);
const file_upload_dto_1 = __webpack_require__(97);
const path_1 = __webpack_require__(98);
const path = __importStar(__webpack_require__(98));
const fs = __importStar(__webpack_require__(99));
const fs_1 = __webpack_require__(100);
const uuid_1 = __webpack_require__(20);
const child_process_1 = __webpack_require__(101);
const nest_winston_1 = __webpack_require__(7);
const common_2 = __webpack_require__(2);
const crypto = __importStar(__webpack_require__(102));
const ioredis_1 = __importDefault(__webpack_require__(21));
const files_validation_1 = __webpack_require__(103);
const UPLOAD_QUOTAS = {
    'admin': 50 * 1024 * 1024 * 1024,
    'teacher': 10 * 1024 * 1024 * 1024,
    'parent': 2 * 1024 * 1024 * 1024,
    'student': 1 * 1024 * 1024 * 1024,
};
const DEFAULT_QUOTA = 1 * 1024 * 1024 * 1024;
const UPLOAD_RATE_LIMIT = 5;
const VIRUS_SCAN_TIMEOUT = 60000;
const THUMBNAIL_WIDTH = 200;
const THUMBNAIL_HEIGHT = 200;
const PREVIEW_MAX_WIDTH = 1200;
const PREVIEW_MAX_HEIGHT = 800;
let FilesService = FilesService_1 = class FilesService {
    constructor(prisma, winstonLogger) {
        this.prisma = prisma;
        this.winstonLogger = winstonLogger;
        this.logger = new common_1.Logger(FilesService_1.name);
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        this.redis = new ioredis_1.default(redisUrl);
        this.uploadsDir = path.resolve(process.cwd(), 'uploads');
        this.thumbnailsDir = path.join(this.uploadsDir, 'thumbnails');
        this.previewsDir = path.join(this.uploadsDir, 'previews');
        this.ensureDirectories();
    }
    async ensureDirectories() {
        try {
            await fs.mkdir(this.uploadsDir, { recursive: true });
            await fs.mkdir(this.thumbnailsDir, { recursive: true });
            await fs.mkdir(this.previewsDir, { recursive: true });
        }
        catch (error) {
            this.logger.error('Failed to create upload directories:', error.message);
        }
    }
    async checkRateLimit(userId) {
        const key = `ratelimit:upload:${userId}`;
        const now = Date.now();
        const windowMs = 60000;
        const pipeline = this.redis.pipeline();
        pipeline.get(key);
        pipeline.pttl(key);
        const results = await pipeline.exec();
        if (!results || results[0][0]) {
            await this.redis.setex(key, Math.ceil(windowMs / 1000), '1');
            return { allowed: true, remaining: UPLOAD_RATE_LIMIT - 1, resetTime: now + windowMs };
        }
        const current = results[0][1];
        const ttl = results[1][1];
        if (!current) {
            await this.redis.setex(key, Math.ceil(windowMs / 1000), '1');
            return { allowed: true, remaining: UPLOAD_RATE_LIMIT - 1, resetTime: now + windowMs };
        }
        const count = parseInt(current, 10);
        if (count >= UPLOAD_RATE_LIMIT) {
            return { allowed: false, remaining: 0, resetTime: now + (ttl || windowMs) };
        }
        await this.redis.incr(key);
        return { allowed: true, remaining: UPLOAD_RATE_LIMIT - count - 1, resetTime: now + (ttl || windowMs) };
    }
    async getRateLimitStatus(userId) {
        const key = `ratelimit:upload:${userId}`;
        const pipeline = this.redis.pipeline();
        pipeline.get(key);
        pipeline.pttl(key);
        const results = await pipeline.exec();
        if (!results || results[0][0]) {
            return { remaining: UPLOAD_RATE_LIMIT, resetTime: Date.now() + 60000 };
        }
        const current = results[0][1];
        const ttl = results[1][1];
        if (!current) {
            return { remaining: UPLOAD_RATE_LIMIT, resetTime: Date.now() + 60000 };
        }
        const count = parseInt(current, 10);
        return {
            remaining: Math.max(0, UPLOAD_RATE_LIMIT - count),
            resetTime: Date.now() + (ttl || 60000)
        };
    }
    async scanFile(filePath) {
        const isClamAvAvailable = await this.isClamAvAvailable();
        if (!isClamAvAvailable) {
            this.logger.warn('ClamAV not available, skipping virus scan');
            return { clean: true, status: 'skipped', message: 'Virus scanning not available' };
        }
        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                resolve({
                    clean: false,
                    status: 'error',
                    message: 'Virus scan timeout'
                });
            }, VIRUS_SCAN_TIMEOUT);
            try {
                const scanner = (0, child_process_1.spawn)('clamdscan', ['--fdpass', '--no-summary', '--', filePath]);
                let stdout = '';
                let stderr = '';
                scanner.stdout.on('data', (data) => {
                    stdout += data.toString();
                });
                scanner.stderr.on('data', (data) => {
                    stderr += data.toString();
                });
                scanner.on('close', (code) => {
                    clearTimeout(timeout);
                    if (code === 0) {
                        resolve({ clean: true, status: 'clean' });
                    }
                    else if (code === 1) {
                        const threats = this.parseThreats(stdout);
                        resolve({
                            clean: false,
                            status: 'infected',
                            message: 'File contains malware',
                            threats
                        });
                    }
                    else {
                        resolve({
                            clean: false,
                            status: 'error',
                            message: stderr || 'Scan failed'
                        });
                    }
                });
                scanner.on('error', (error) => {
                    clearTimeout(timeout);
                    this.scanWithClamscan(filePath).then(resolve);
                });
            }
            catch (error) {
                clearTimeout(timeout);
                resolve({
                    clean: false,
                    status: 'error',
                    message: error.message
                });
            }
        });
    }
    async scanWithClamscan(filePath) {
        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                resolve({
                    clean: false,
                    status: 'error',
                    message: 'Virus scan timeout'
                });
            }, VIRUS_SCAN_TIMEOUT);
            try {
                const scanner = (0, child_process_1.spawn)('clamscan', ['--no-summary', '--', filePath]);
                let stdout = '';
                let stderr = '';
                scanner.stdout.on('data', (data) => {
                    stdout += data.toString();
                });
                scanner.stderr.on('data', (data) => {
                    stderr += data.toString();
                });
                scanner.on('close', (code) => {
                    clearTimeout(timeout);
                    if (code === 0) {
                        resolve({ clean: true, status: 'clean' });
                    }
                    else if (code === 1) {
                        const threats = this.parseThreats(stdout);
                        resolve({
                            clean: false,
                            status: 'infected',
                            message: 'File contains malware',
                            threats
                        });
                    }
                    else {
                        resolve({
                            clean: false,
                            status: 'error',
                            message: stderr || 'Scan failed'
                        });
                    }
                });
                scanner.on('error', () => {
                    clearTimeout(timeout);
                    resolve({
                        clean: true,
                        status: 'skipped',
                        message: 'Virus scanner not available'
                    });
                });
            }
            catch (error) {
                clearTimeout(timeout);
                resolve({
                    clean: true,
                    status: 'skipped',
                    message: 'Virus scanner not available'
                });
            }
        });
    }
    async isClamAvAvailable() {
        return new Promise((resolve) => {
            const check = (0, child_process_1.spawn)('which', ['clamdscan']);
            check.on('close', (code) => resolve(code === 0));
            check.on('error', () => resolve(false));
        });
    }
    parseThreats(output) {
        const threats = [];
        const lines = output.split('\n');
        for (const line of lines) {
            if (line.includes('FOUND')) {
                const match = line.match(/: ([^:]+) FOUND/);
                if (match) {
                    threats.push(match[1]);
                }
            }
        }
        return threats;
    }
    async generateThumbnail(filePath, mimeType, width = THUMBNAIL_WIDTH, height = THUMBNAIL_HEIGHT) {
        if (!(0, files_validation_1.isPreviewableImage)(mimeType)) {
            return null;
        }
        const thumbnailId = (0, uuid_1.v4)();
        const thumbnailName = `thumb-${thumbnailId}.jpg`;
        const thumbnailPath = path.join(this.thumbnailsDir, thumbnailName);
        return new Promise((resolve) => {
            const convert = (0, child_process_1.spawn)('convert', [
                filePath,
                '-resize', `${width}x${height}>`,
                '-background', 'white',
                '-flatten',
                '-quality', '85',
                thumbnailPath
            ]);
            convert.on('close', (code) => {
                if (code === 0) {
                    resolve(thumbnailPath);
                }
                else {
                    this.logger.warn(`Thumbnail generation failed for ${filePath}`);
                    resolve(null);
                }
            });
            convert.on('error', () => {
                resolve(null);
            });
        });
    }
    async generatePreview(filePath, mimeType, options = {}) {
        if (!(0, files_validation_1.isPreviewableImage)(mimeType)) {
            return null;
        }
        const width = options.width || PREVIEW_MAX_WIDTH;
        const height = options.height || PREVIEW_MAX_HEIGHT;
        const format = options.format || 'jpeg';
        const previewId = (0, uuid_1.v4)();
        const previewName = `preview-${previewId}.${format}`;
        const previewPath = path.join(this.previewsDir, previewName);
        return new Promise((resolve) => {
            const convert = (0, child_process_1.spawn)('convert', [
                filePath,
                '-resize', `${width}x${height}>`,
                '-quality', '90',
                previewPath
            ]);
            convert.on('close', (code) => {
                if (code === 0) {
                    resolve(previewPath);
                }
                else {
                    resolve(null);
                }
            });
            convert.on('error', () => {
                resolve(null);
            });
        });
    }
    async getUserQuota(userId, userRoles) {
        let quota = DEFAULT_QUOTA;
        for (const role of userRoles) {
            const roleQuota = UPLOAD_QUOTAS[role];
            if (roleQuota && roleQuota > quota) {
                quota = roleQuota;
            }
        }
        const userFiles = await this.prisma.file.findMany({
            where: {
                uploaderId: userId,
                isDeleted: false
            },
            select: { size: true },
        });
        const usedStorage = userFiles.reduce((sum, file) => sum + file.size, 0);
        return {
            totalQuota: quota,
            usedStorage,
            availableStorage: quota - usedStorage,
            fileCount: userFiles.length,
        };
    }
    async checkUploadQuota(userId, userRoles, fileSize) {
        const quota = await this.getUserQuota(userId, userRoles);
        if (fileSize > quota.availableStorage) {
            return {
                allowed: false,
                quota,
                message: `Insufficient storage. Available: ${(0, files_validation_1.formatFileSize)(quota.availableStorage)}, ` +
                    `Required: ${(0, files_validation_1.formatFileSize)(fileSize)}`,
            };
        }
        return { allowed: true, quota };
    }
    async uploadFile(file, uploaderId, metadata, userRoles = []) {
        const warnings = [];
        if (!file) {
            throw new common_1.BadRequestException('No file provided');
        }
        const rateLimit = await this.checkRateLimit(uploaderId);
        if (!rateLimit.allowed) {
            const resetSeconds = Math.ceil((rateLimit.resetTime - Date.now()) / 1000);
            throw new common_1.BadRequestException(`Upload rate limit exceeded. Try again in ${resetSeconds} seconds.`);
        }
        const primaryRole = userRoles.find(r => ['admin', 'teacher', 'parent', 'student'].includes(r)) || 'student';
        const validation = await (0, files_validation_1.validateFile)(file, primaryRole);
        if (!validation.valid) {
            await this.cleanupTempFile(file.path);
            throw new common_1.BadRequestException(validation.errors.join('; '));
        }
        const quotaCheck = await this.checkUploadQuota(uploaderId, userRoles, file.size);
        if (!quotaCheck.allowed) {
            await this.cleanupTempFile(file.path);
            throw new common_1.BadRequestException(quotaCheck.message);
        }
        let virusScanStatus = 'pending';
        if (!metadata.skipVirusScan || !userRoles.includes('admin')) {
            if ((0, files_validation_1.requiresVirusScan)(file.mimetype)) {
                const scanResult = await this.scanFile(file.path);
                virusScanStatus = scanResult.status;
                if (scanResult.status === 'infected') {
                    await this.cleanupTempFile(file.path);
                    this.logger.warn(`Malware detected in upload by ${uploaderId}: ${scanResult.threats?.join(', ')}`);
                    throw new common_1.BadRequestException(`File rejected: ${scanResult.message}. Threats: ${scanResult.threats?.join(', ')}`);
                }
                if (scanResult.status === 'error' || scanResult.status === 'skipped') {
                    warnings.push(`Virus scan: ${scanResult.message}`);
                }
            }
            else {
                virusScanStatus = 'skipped';
            }
        }
        else {
            virusScanStatus = 'skipped';
            warnings.push('Virus scan skipped (admin override)');
        }
        const ext = (0, path_1.extname)(file.originalname).toLowerCase();
        const secureFilename = `${(0, uuid_1.v4)()}${ext}`;
        const rawCategory = metadata.category || file_upload_dto_1.FileUploadCategory.GENERAL;
        const allowedCategories = Object.values(file_upload_dto_1.FileUploadCategory);
        if (!allowedCategories.includes(rawCategory)) {
            throw new common_1.BadRequestException(`Invalid file category: ${rawCategory}`);
        }
        const category = rawCategory;
        const sanitizedCategory = path.basename(category);
        const categoryDir = path.join(this.uploadsDir, sanitizedCategory);
        const finalPath = path.join(categoryDir, secureFilename);
        const relativePath = path.join('uploads', sanitizedCategory, secureFilename);
        let thumbnailPath = null;
        try {
            await fs.mkdir(categoryDir, { recursive: true });
            await fs.rename(file.path, finalPath);
            if (metadata.generateThumbnail !== false && (0, files_validation_1.isPreviewableImage)(file.mimetype)) {
                thumbnailPath = await this.generateThumbnail(finalPath, file.mimetype, metadata.thumbnailWidth, metadata.thumbnailHeight);
            }
            const fileRecord = await this.prisma.file.create({
                data: {
                    filename: secureFilename,
                    originalName: (0, files_validation_1.getSafeFilename)(metadata.originalName || file.originalname),
                    mimeType: file.mimetype,
                    size: file.size,
                    path: relativePath,
                    category: category.toString(),
                    uploaderId,
                    relatedId: metadata.relatedId,
                    relatedType: metadata.relatedType,
                },
            });
            this.logger.log(`File uploaded: ${fileRecord.id} (${file.originalname}) by ${uploaderId}`);
            await this.prisma.filePermission.create({
                data: {
                    fileId: fileRecord.id,
                    userId: uploaderId,
                    canView: true,
                    canEdit: true,
                    canDelete: true,
                },
            });
            const result = {
                ...fileRecord,
                virusScanStatus,
                warnings: warnings.length > 0 ? warnings : undefined,
            };
            if (thumbnailPath) {
                result.thumbnailUrl = `/files/${fileRecord.id}/thumbnail`;
                await this.storeThumbnailMetadata(fileRecord.id, thumbnailPath);
            }
            return result;
        }
        catch (error) {
            await this.cleanupTempFile(file.path);
            await this.cleanupFinalFile(finalPath);
            if (thumbnailPath) {
                await this.cleanupFinalFile(thumbnailPath);
            }
            throw error;
        }
    }
    async storeThumbnailMetadata(fileId, thumbnailPath) {
        try {
            const metadataPath = path.join(this.thumbnailsDir, `${fileId}.meta.json`);
            await fs.writeFile(metadataPath, JSON.stringify({ thumbnailPath, createdAt: new Date() }));
        }
        catch (error) {
            this.logger.warn(`Failed to store thumbnail metadata for ${fileId}`);
        }
    }
    async getThumbnailMetadata(fileId) {
        try {
            const metadataPath = path.join(this.thumbnailsDir, `${fileId}.meta.json`);
            const content = await fs.readFile(metadataPath, 'utf-8');
            const metadata = JSON.parse(content);
            return metadata.thumbnailPath;
        }
        catch {
            return null;
        }
    }
    async calculateFileHash(filePath) {
        return new Promise((resolve, reject) => {
            const hash = crypto.createHash('sha256');
            const stream = (0, fs_1.createReadStream)(filePath);
            stream.on('data', (data) => hash.update(data));
            stream.on('end', () => resolve(hash.digest('hex')));
            stream.on('error', reject);
        });
    }
    async cleanupTempFile(filePath) {
        if (!filePath)
            return;
        try {
            await fs.access(filePath);
            await fs.unlink(filePath);
        }
        catch {
        }
    }
    async cleanupFinalFile(filePath) {
        if (!filePath)
            return;
        try {
            await fs.access(filePath);
            await fs.unlink(filePath);
        }
        catch {
        }
    }
    async findAll(params) {
        const { category, uploaderId, relatedId, relatedType, search, visibility } = params;
        const page = Math.max(1, params.page || 1);
        const limit = Math.min(100, Math.max(1, params.limit || 20));
        const skip = (page - 1) * limit;
        const where = {
            isDeleted: false,
        };
        if (category)
            where.category = category;
        if (uploaderId)
            where.uploaderId = uploaderId;
        if (relatedId)
            where.relatedId = relatedId;
        if (relatedType)
            where.relatedType = relatedType;
        if (search) {
            where.OR = [
                { originalName: { contains: search, mode: 'insensitive' } },
                { filename: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [files, total] = await Promise.all([
            this.prisma.file.findMany({
                where,
                include: {
                    uploader: {
                        select: { id: true, email: true, firstName: true, lastName: true },
                    },
                    _count: {
                        select: { permissions: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.file.count({ where }),
        ]);
        return {
            data: files,
            meta: {
                total,
                page,
                pageSize: limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async findById(id) {
        const file = await this.prisma.file.findUnique({
            where: { id, isDeleted: false },
            include: {
                uploader: {
                    select: { id: true, email: true, firstName: true, lastName: true },
                },
                permissions: {
                    include: {
                        user: {
                            select: { id: true, email: true },
                        },
                    },
                },
            },
        });
        if (!file) {
            throw new common_1.NotFoundException('File not found');
        }
        return file;
    }
    async getFileForDownload(id, userId, userRoles) {
        const file = await this.findById(id);
        const hasAccess = file.uploaderId === userId ||
            userRoles.includes('admin') ||
            (await this.prisma.filePermission.findFirst({
                where: {
                    fileId: id,
                    userId,
                    canView: true,
                },
            }));
        if (!hasAccess) {
            throw new common_1.ForbiddenException('You do not have permission to download this file');
        }
        const absolutePath = path.isAbsolute(file.path)
            ? file.path
            : path.join(process.cwd(), file.path);
        try {
            await fs.access(absolutePath);
        }
        catch {
            throw new common_1.NotFoundException('Physical file not found');
        }
        return { ...file, path: absolutePath };
    }
    async getFileThumbnail(id, userId, userRoles) {
        const file = await this.findById(id);
        const hasAccess = file.uploaderId === userId ||
            userRoles.includes('admin') ||
            (await this.prisma.filePermission.findFirst({
                where: { fileId: id, userId, canView: true },
            }));
        if (!hasAccess) {
            throw new common_1.ForbiddenException('You do not have permission to view this file');
        }
        const thumbnailPath = await this.getThumbnailMetadata(id);
        if (!thumbnailPath) {
            throw new common_1.NotFoundException('Thumbnail not available for this file');
        }
        const absoluteThumbPath = path.isAbsolute(thumbnailPath)
            ? thumbnailPath
            : path.join(process.cwd(), thumbnailPath);
        try {
            await fs.access(absoluteThumbPath);
        }
        catch {
            throw new common_1.NotFoundException('Thumbnail file not found');
        }
        return { path: absoluteThumbPath, mimeType: 'image/jpeg' };
    }
    async streamFile(file, res) {
        const absolutePath = path.isAbsolute(file.path)
            ? file.path
            : path.join(process.cwd(), file.path);
        const stream = (0, fs_1.createReadStream)(absolutePath);
        return new Promise((resolve, reject) => {
            stream.on('error', (err) => {
                this.logger.error(`Error streaming file ${file.id}:`, err.message);
                reject(new Error('Error reading file'));
            });
            stream.on('end', () => {
                resolve();
            });
            res.setHeader('Content-Type', file.mimeType);
            res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalName)}"`);
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('Content-Security-Policy', "default-src 'none'");
            stream.pipe(res);
        });
    }
    async deleteFile(id, userId, userRoles) {
        const file = await this.findById(id);
        const canDelete = file.uploaderId === userId || userRoles.includes('admin');
        if (!canDelete) {
            const hasDeletePermission = await this.prisma.filePermission.findFirst({
                where: { fileId: id, userId, canDelete: true },
            });
            if (!hasDeletePermission) {
                throw new common_1.ForbiddenException('You do not have permission to delete this file');
            }
        }
        await this.prisma.file.update({
            where: { id },
            data: {
                isDeleted: true,
                deletedAt: new Date(),
            },
        });
        this.logger.log(`File soft deleted: ${id} by ${userId}`);
        return { message: 'File deleted successfully' };
    }
    async setPermission(fileId, dto) {
        const file = await this.prisma.file.findUnique({
            where: { id: fileId },
        });
        if (!file)
            throw new common_1.NotFoundException('File not found');
        return this.prisma.filePermission.create({
            data: {
                fileId,
                userId: dto.userId,
                roleId: dto.roleId,
                canView: dto.canView ?? true,
                canEdit: dto.canEdit ?? false,
                canDelete: dto.canDelete ?? false,
            },
        });
    }
    async getPermissions(fileId) {
        const file = await this.prisma.file.findUnique({
            where: { id: fileId },
        });
        if (!file)
            throw new common_1.NotFoundException('File not found');
        return this.prisma.filePermission.findMany({
            where: { fileId },
            include: {
                user: {
                    select: { id: true, email: true, firstName: true, lastName: true },
                },
            },
        });
    }
    async removePermission(permissionId) {
        const permission = await this.prisma.filePermission.findUnique({
            where: { id: permissionId },
        });
        if (!permission)
            throw new common_1.NotFoundException('Permission not found');
        await this.prisma.filePermission.delete({
            where: { id: permissionId },
        });
    }
    async getStorageStats(userId) {
        const where = { isDeleted: false };
        if (userId)
            where.uploaderId = userId;
        const files = await this.prisma.file.findMany({
            where,
            select: {
                category: true,
                size: true,
            },
        });
        const byCategory = {};
        let totalSize = 0;
        for (const file of files) {
            if (!byCategory[file.category]) {
                byCategory[file.category] = { count: 0, size: 0 };
            }
            byCategory[file.category].count++;
            byCategory[file.category].size += file.size;
            totalSize += file.size;
        }
        return {
            totalFiles: files.length,
            totalSize,
            byCategory,
        };
    }
    async deleteFilesByRelatedEntity(relatedType, relatedId) {
        const files = await this.prisma.file.findMany({
            where: { relatedType, relatedId },
        });
        await this.prisma.file.updateMany({
            where: { relatedType, relatedId },
            data: { isDeleted: true, deletedAt: new Date() },
        });
        return { deleted: files.length };
    }
    async cleanupDeletedFiles(olderThanDays = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
        const deletedFiles = await this.prisma.file.findMany({
            where: {
                isDeleted: true,
                deletedAt: { lt: cutoffDate },
            },
        });
        let freedSpace = 0;
        for (const file of deletedFiles) {
            const filePath = path.isAbsolute(file.path)
                ? file.path
                : path.join(process.cwd(), file.path);
            try {
                await fs.unlink(filePath);
                freedSpace += file.size;
            }
            catch (err) {
                this.logger.warn(`Failed to delete physical file: ${filePath}`);
            }
            const thumbnailPath = await this.getThumbnailMetadata(file.id);
            if (thumbnailPath) {
                try {
                    await fs.unlink(thumbnailPath);
                }
                catch {
                }
                try {
                    const metadataPath = path.join(this.thumbnailsDir, `${file.id}.meta.json`);
                    await fs.unlink(metadataPath);
                }
                catch {
                }
            }
        }
        await this.prisma.file.deleteMany({
            where: {
                isDeleted: true,
                deletedAt: { lt: cutoffDate },
            },
        });
        this.logger.log(`Cleaned up ${deletedFiles.length} deleted files, freed ${freedSpace} bytes`);
        return {
            cleaned: deletedFiles.length,
            freedSpace,
        };
    }
    async validateFileMetadata(fileId) {
        const file = await this.prisma.file.findUnique({
            where: { id: fileId },
        });
        if (!file) {
            return {
                valid: false,
                fileExists: false,
                hashValid: false,
                sizeValid: false,
                issues: ['File record not found']
            };
        }
        const issues = [];
        const filePath = path.isAbsolute(file.path)
            ? file.path
            : path.join(process.cwd(), file.path);
        let fileExists = false;
        try {
            await fs.access(filePath);
            fileExists = true;
        }
        catch {
            issues.push('Physical file not found');
        }
        let sizeValid = true;
        if (fileExists) {
            try {
                const stats = await fs.stat(filePath);
                if (stats.size !== file.size) {
                    sizeValid = false;
                    issues.push(`Size mismatch: expected ${file.size}, got ${stats.size}`);
                }
            }
            catch {
                sizeValid = false;
            }
        }
        return {
            valid: fileExists && sizeValid,
            fileExists,
            hashValid: true,
            sizeValid,
            issues,
        };
    }
};
exports.FilesService = FilesService;
exports.FilesService = FilesService = FilesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(nest_winston_1.WINSTON_MODULE_NEST_PROVIDER)),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object, typeof (_b = typeof common_2.LoggerService !== "undefined" && common_2.LoggerService) === "function" ? _b : Object])
], FilesService);


/***/ }),
/* 97 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FilePreviewDto = exports.UploadQuotaDto = exports.FileUploadResponseDto = exports.BatchFileOperationDto = exports.UpdateFileMetadataDto = exports.FileUploadDto = exports.FileVisibility = exports.FileUploadCategory = void 0;
const class_validator_1 = __webpack_require__(23);
const swagger_1 = __webpack_require__(3);
var FileUploadCategory;
(function (FileUploadCategory) {
    FileUploadCategory["ASSIGNMENT_SUBMISSION"] = "assignment_submission";
    FileUploadCategory["COURSE_MATERIAL"] = "course_material";
    FileUploadCategory["SHARED_DOCUMENT"] = "shared_document";
    FileUploadCategory["PROFILE_PICTURE"] = "profile_picture";
    FileUploadCategory["ANNOUNCEMENT_ATTACHMENT"] = "announcement_attachment";
    FileUploadCategory["MESSAGE_ATTACHMENT"] = "message_attachment";
    FileUploadCategory["GENERAL"] = "general";
})(FileUploadCategory || (exports.FileUploadCategory = FileUploadCategory = {}));
var FileVisibility;
(function (FileVisibility) {
    FileVisibility["PRIVATE"] = "private";
    FileVisibility["PUBLIC"] = "public";
    FileVisibility["RESTRICTED"] = "restricted";
})(FileVisibility || (exports.FileVisibility = FileVisibility = {}));
class FileUploadDto {
    constructor() {
        this.visibility = FileVisibility.PRIVATE;
        this.generateThumbnail = true;
        this.thumbnailWidth = 200;
        this.thumbnailHeight = 200;
        this.skipVirusScan = false;
    }
}
exports.FileUploadDto = FileUploadDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Original filename',
        example: 'homework.pdf',
        maxLength: 255,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255, { message: 'Original name cannot exceed 255 characters' }),
    __metadata("design:type", String)
], FileUploadDto.prototype, "originalName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'MIME type of the file',
        example: 'application/pdf',
        maxLength: 100,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100, { message: 'MIME type cannot exceed 100 characters' }),
    __metadata("design:type", String)
], FileUploadDto.prototype, "mimeType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'File category for organization',
        enum: FileUploadCategory,
        example: FileUploadCategory.ASSIGNMENT_SUBMISSION,
    }),
    (0, class_validator_1.IsEnum)(FileUploadCategory, {
        message: `Category must be one of: ${Object.values(FileUploadCategory).join(', ')}`
    }),
    __metadata("design:type", String)
], FileUploadDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Visibility level for the file',
        enum: FileVisibility,
        default: FileVisibility.PRIVATE,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(FileVisibility, {
        message: `Visibility must be one of: ${Object.values(FileVisibility).join(', ')}`
    }),
    __metadata("design:type", String)
], FileUploadDto.prototype, "visibility", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'ID of related entity (assignment, course, etc.)',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsUUID)('4', { message: 'Invalid related ID format' }),
    __metadata("design:type", String)
], FileUploadDto.prototype, "relatedId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Type of related entity',
        example: 'assignment',
        maxLength: 50,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50, { message: 'Related type cannot exceed 50 characters' }),
    __metadata("design:type", String)
], FileUploadDto.prototype, "relatedType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Description or notes about the file',
        example: 'Student assignment submission for Week 3',
        maxLength: 1000,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000, { message: 'Description cannot exceed 1000 characters' }),
    __metadata("design:type", String)
], FileUploadDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Whether to generate a thumbnail for this file (images only)',
        default: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], FileUploadDto.prototype, "generateThumbnail", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Custom thumbnail dimensions (width)',
        minimum: 50,
        maximum: 1024,
        default: 200,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(50, { message: 'Thumbnail width must be at least 50px' }),
    (0, class_validator_1.Max)(1024, { message: 'Thumbnail width cannot exceed 1024px' }),
    __metadata("design:type", Number)
], FileUploadDto.prototype, "thumbnailWidth", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Custom thumbnail dimensions (height)',
        minimum: 50,
        maximum: 1024,
        default: 200,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(50, { message: 'Thumbnail height must be at least 50px' }),
    (0, class_validator_1.Max)(1024, { message: 'Thumbnail height cannot exceed 1024px' }),
    __metadata("design:type", Number)
], FileUploadDto.prototype, "thumbnailHeight", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Whether to skip virus scanning (admin only)',
        default: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], FileUploadDto.prototype, "skipVirusScan", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Tags for file organization (comma-separated)',
        example: 'math, homework, grade-5',
        maxLength: 500,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500, { message: 'Tags cannot exceed 500 characters' }),
    __metadata("design:type", String)
], FileUploadDto.prototype, "tags", void 0);
class UpdateFileMetadataDto {
}
exports.UpdateFileMetadataDto = UpdateFileMetadataDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Updated filename',
        example: 'renamed-document.pdf',
        maxLength: 255,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255, { message: 'Original name cannot exceed 255 characters' }),
    __metadata("design:type", String)
], UpdateFileMetadataDto.prototype, "originalName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Updated file category',
        enum: FileUploadCategory,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(FileUploadCategory, {
        message: `Category must be one of: ${Object.values(FileUploadCategory).join(', ')}`
    }),
    __metadata("design:type", String)
], UpdateFileMetadataDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Updated visibility level',
        enum: FileVisibility,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(FileVisibility, {
        message: `Visibility must be one of: ${Object.values(FileVisibility).join(', ')}`
    }),
    __metadata("design:type", String)
], UpdateFileMetadataDto.prototype, "visibility", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Updated description',
        maxLength: 1000,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000, { message: 'Description cannot exceed 1000 characters' }),
    __metadata("design:type", String)
], UpdateFileMetadataDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Updated tags',
        maxLength: 500,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500, { message: 'Tags cannot exceed 500 characters' }),
    __metadata("design:type", String)
], UpdateFileMetadataDto.prototype, "tags", void 0);
class BatchFileOperationDto {
}
exports.BatchFileOperationDto = BatchFileOperationDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Array of file IDs to operate on',
        type: [String],
        example: ['550e8400-e29b-41d4-a716-446655440000'],
    }),
    (0, class_validator_1.IsUUID)('4', { each: true, message: 'Invalid file ID format' }),
    __metadata("design:type", Array)
], BatchFileOperationDto.prototype, "fileIds", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Target category for batch move operation',
        enum: FileUploadCategory,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(FileUploadCategory),
    __metadata("design:type", String)
], BatchFileOperationDto.prototype, "targetCategory", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'New visibility for batch update',
        enum: FileVisibility,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(FileVisibility),
    __metadata("design:type", String)
], BatchFileOperationDto.prototype, "visibility", void 0);
class FileUploadResponseDto {
}
exports.FileUploadResponseDto = FileUploadResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'File ID' }),
    __metadata("design:type", String)
], FileUploadResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Original filename' }),
    __metadata("design:type", String)
], FileUploadResponseDto.prototype, "originalName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'MIME type' }),
    __metadata("design:type", String)
], FileUploadResponseDto.prototype, "mimeType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'File size in bytes' }),
    __metadata("design:type", Number)
], FileUploadResponseDto.prototype, "size", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'File category' }),
    __metadata("design:type", String)
], FileUploadResponseDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Upload timestamp' }),
    __metadata("design:type", typeof (_a = typeof Date !== "undefined" && Date) === "function" ? _a : Object)
], FileUploadResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Thumbnail URL if generated' }),
    __metadata("design:type", String)
], FileUploadResponseDto.prototype, "thumbnailUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Virus scan status' }),
    __metadata("design:type", String)
], FileUploadResponseDto.prototype, "virusScanStatus", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Warning messages if any' }),
    __metadata("design:type", Array)
], FileUploadResponseDto.prototype, "warnings", void 0);
class UploadQuotaDto {
}
exports.UploadQuotaDto = UploadQuotaDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total storage quota in bytes' }),
    __metadata("design:type", Number)
], UploadQuotaDto.prototype, "totalQuota", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Used storage in bytes' }),
    __metadata("design:type", Number)
], UploadQuotaDto.prototype, "usedStorage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Available storage in bytes' }),
    __metadata("design:type", Number)
], UploadQuotaDto.prototype, "availableStorage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Uploads allowed per minute' }),
    __metadata("design:type", Number)
], UploadQuotaDto.prototype, "uploadsPerMinute", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Current uploads in last minute' }),
    __metadata("design:type", Number)
], UploadQuotaDto.prototype, "currentUploads", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Maximum file size allowed in bytes' }),
    __metadata("design:type", Number)
], UploadQuotaDto.prototype, "maxFileSize", void 0);
class FilePreviewDto {
    constructor() {
        this.width = 800;
        this.height = 600;
        this.format = 'jpeg';
    }
}
exports.FilePreviewDto = FilePreviewDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Preview width in pixels',
        minimum: 50,
        maximum: 2048,
        default: 800,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(50),
    (0, class_validator_1.Max)(2048),
    __metadata("design:type", Number)
], FilePreviewDto.prototype, "width", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Preview height in pixels',
        minimum: 50,
        maximum: 2048,
        default: 600,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(50),
    (0, class_validator_1.Max)(2048),
    __metadata("design:type", Number)
], FilePreviewDto.prototype, "height", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Output format for image previews',
        enum: ['jpeg', 'png', 'webp'],
        default: 'jpeg',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['jpeg', 'png', 'webp']),
    __metadata("design:type", String)
], FilePreviewDto.prototype, "format", void 0);


/***/ }),
/* 98 */
/***/ ((module) => {

module.exports = require("path");

/***/ }),
/* 99 */
/***/ ((module) => {

module.exports = require("fs/promises");

/***/ }),
/* 100 */
/***/ ((module) => {

module.exports = require("fs");

/***/ }),
/* 101 */
/***/ ((module) => {

module.exports = require("child_process");

/***/ }),
/* 102 */
/***/ ((module) => {

module.exports = require("crypto");

/***/ }),
/* 103 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ROLE_SIZE_MULTIPLIERS = exports.DEFAULT_MAX_FILE_SIZE = exports.MAX_FILE_SIZES = exports.MIME_TO_CATEGORY = exports.FileCategory = exports.ALLOWED_MIME_TYPES = void 0;
exports.getFileCategory = getFileCategory;
exports.getMaxFileSize = getMaxFileSize;
exports.validateFileExtension = validateFileExtension;
exports.validateMimeType = validateMimeType;
exports.readMagicBytes = readMagicBytes;
exports.validateMagicNumber = validateMagicNumber;
exports.validateSvgFile = validateSvgFile;
exports.validateFileSize = validateFileSize;
exports.validateFile = validateFile;
exports.isPreviewableImage = isPreviewableImage;
exports.requiresVirusScan = requiresVirusScan;
exports.getSafeFilename = getSafeFilename;
exports.formatFileSize = formatFileSize;
const path_1 = __webpack_require__(98);
const fs_1 = __webpack_require__(100);
exports.ALLOWED_MIME_TYPES = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'image/webp': ['.webp'],
    'image/svg+xml': ['.svg'],
    'image/bmp': ['.bmp'],
    'image/tiff': ['.tiff', '.tif'],
    'application/pdf': ['.pdf'],
    'text/plain': ['.txt'],
    'text/csv': ['.csv'],
    'text/markdown': ['.md'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/vnd.ms-excel': ['.xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    'application/vnd.ms-powerpoint': ['.ppt'],
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
    'application/rtf': ['.rtf'],
    'application/json': ['.json'],
    'application/xml': ['.xml'],
    'text/xml': ['.xml'],
    'audio/mpeg': ['.mp3'],
    'audio/wav': ['.wav'],
    'audio/ogg': ['.ogg'],
    'audio/aac': ['.aac'],
    'audio/m4a': ['.m4a'],
    'audio/flac': ['.flac'],
    'video/mp4': ['.mp4'],
    'video/mpeg': ['.mpeg', '.mpg'],
    'video/quicktime': ['.mov'],
    'video/x-msvideo': ['.avi'],
    'video/x-matroska': ['.mkv'],
    'video/webm': ['.webm'],
    'video/x-flv': ['.flv'],
    'application/zip': ['.zip'],
    'application/x-7z-compressed': ['.7z'],
};
var FileCategory;
(function (FileCategory) {
    FileCategory["IMAGE"] = "image";
    FileCategory["DOCUMENT"] = "document";
    FileCategory["AUDIO"] = "audio";
    FileCategory["VIDEO"] = "video";
    FileCategory["ARCHIVE"] = "archive";
    FileCategory["UNKNOWN"] = "unknown";
})(FileCategory || (exports.FileCategory = FileCategory = {}));
exports.MIME_TO_CATEGORY = {
    'image/jpeg': FileCategory.IMAGE,
    'image/png': FileCategory.IMAGE,
    'image/gif': FileCategory.IMAGE,
    'image/webp': FileCategory.IMAGE,
    'image/svg+xml': FileCategory.IMAGE,
    'image/bmp': FileCategory.IMAGE,
    'image/tiff': FileCategory.IMAGE,
    'application/pdf': FileCategory.DOCUMENT,
    'text/plain': FileCategory.DOCUMENT,
    'text/csv': FileCategory.DOCUMENT,
    'text/markdown': FileCategory.DOCUMENT,
    'application/msword': FileCategory.DOCUMENT,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': FileCategory.DOCUMENT,
    'application/vnd.ms-excel': FileCategory.DOCUMENT,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': FileCategory.DOCUMENT,
    'application/vnd.ms-powerpoint': FileCategory.DOCUMENT,
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': FileCategory.DOCUMENT,
    'application/rtf': FileCategory.DOCUMENT,
    'application/json': FileCategory.DOCUMENT,
    'application/xml': FileCategory.DOCUMENT,
    'text/xml': FileCategory.DOCUMENT,
    'audio/mpeg': FileCategory.AUDIO,
    'audio/wav': FileCategory.AUDIO,
    'audio/ogg': FileCategory.AUDIO,
    'audio/aac': FileCategory.AUDIO,
    'audio/m4a': FileCategory.AUDIO,
    'audio/flac': FileCategory.AUDIO,
    'video/mp4': FileCategory.VIDEO,
    'video/mpeg': FileCategory.VIDEO,
    'video/quicktime': FileCategory.VIDEO,
    'video/x-msvideo': FileCategory.VIDEO,
    'video/x-matroska': FileCategory.VIDEO,
    'video/webm': FileCategory.VIDEO,
    'video/x-flv': FileCategory.VIDEO,
    'application/zip': FileCategory.ARCHIVE,
    'application/x-7z-compressed': FileCategory.ARCHIVE,
};
exports.MAX_FILE_SIZES = {
    [FileCategory.IMAGE]: 5 * 1024 * 1024,
    [FileCategory.DOCUMENT]: 10 * 1024 * 1024,
    [FileCategory.AUDIO]: 50 * 1024 * 1024,
    [FileCategory.VIDEO]: 100 * 1024 * 1024,
    [FileCategory.ARCHIVE]: 50 * 1024 * 1024,
    [FileCategory.UNKNOWN]: 10 * 1024 * 1024,
};
exports.DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024;
exports.ROLE_SIZE_MULTIPLIERS = {
    'admin': 2.0,
    'teacher': 1.5,
    'parent': 1.0,
    'student': 1.0,
};
const MAGIC_NUMBERS = {
    'image/jpeg': [Buffer.from([0xFF, 0xD8, 0xFF])],
    'image/png': [Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])],
    'image/gif': [Buffer.from([0x47, 0x49, 0x46, 0x38, 0x37, 0x61]), Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61])],
    'image/webp': [Buffer.from([0x52, 0x49, 0x46, 0x46])],
    'image/bmp': [Buffer.from([0x42, 0x4D])],
    'image/tiff': [Buffer.from([0x49, 0x49, 0x2A, 0x00]), Buffer.from([0x4D, 0x4D, 0x00, 0x2A])],
    'application/pdf': [Buffer.from([0x25, 0x50, 0x44, 0x46])],
    'application/zip': [
        Buffer.from([0x50, 0x4B, 0x03, 0x04]),
        Buffer.from([0x50, 0x4B, 0x05, 0x06]),
        Buffer.from([0x50, 0x4B, 0x07, 0x08]),
    ],
    'application/x-7z-compressed': [Buffer.from([0x37, 0x7A, 0xBC, 0xAF, 0x27, 0x1C])],
};
const SVG_PATTERNS = [
    /<svg/i,
    /<\?xml[^>]*>\s*<svg/i,
];
const DANGEROUS_SVG_PATTERNS = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /xlink:href/i,
    /\shref\s*=/i,
    /<use[\s>]/i,
    /data:/i,
    /foreignObject/i,
    /\.xml/i,
];
function getFileCategory(mimeType) {
    return exports.MIME_TO_CATEGORY[mimeType] || FileCategory.UNKNOWN;
}
function getMaxFileSize(category, role) {
    const baseSize = exports.MAX_FILE_SIZES[category] || exports.DEFAULT_MAX_FILE_SIZE;
    const multiplier = role ? (exports.ROLE_SIZE_MULTIPLIERS[role] || 1.0) : 1.0;
    return Math.floor(baseSize * multiplier);
}
function validateFileExtension(mimeType, filename) {
    const allowedExts = exports.ALLOWED_MIME_TYPES[mimeType];
    if (!allowedExts) {
        return false;
    }
    const ext = (0, path_1.extname)(filename).toLowerCase();
    return allowedExts.includes(ext);
}
function validateMimeType(mimeType) {
    return mimeType in exports.ALLOWED_MIME_TYPES;
}
async function readMagicBytes(filePath, bytesToRead = 8) {
    return new Promise((resolve, reject) => {
        const stream = (0, fs_1.createReadStream)(filePath, { start: 0, end: bytesToRead - 1 });
        const chunks = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
    });
}
async function validateMagicNumber(filePath, mimeType) {
    if (mimeType === 'image/svg+xml') {
        return validateSvgFile(filePath);
    }
    const magicNumbers = MAGIC_NUMBERS[mimeType];
    if (!magicNumbers || magicNumbers.length === 0) {
        return true;
    }
    try {
        const fileHeader = await readMagicBytes(filePath, Math.max(...magicNumbers.map(m => m.length)));
        return magicNumbers.some(magic => {
            return fileHeader.slice(0, magic.length).equals(magic);
        });
    }
    catch (error) {
        return false;
    }
}
async function validateSvgFile(filePath) {
    try {
        const content = await new Promise((resolve, reject) => {
            const chunks = [];
            const stream = (0, fs_1.createReadStream)(filePath, { encoding: 'utf-8', highWaterMark: 64 * 1024 });
            stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
            stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
            stream.on('error', reject);
        });
        const isSvg = SVG_PATTERNS.some(pattern => pattern.test(content));
        if (!isSvg) {
            return false;
        }
        const hasDangerousContent = DANGEROUS_SVG_PATTERNS.some(pattern => pattern.test(content));
        if (hasDangerousContent) {
            return false;
        }
        return true;
    }
    catch (error) {
        return false;
    }
}
function validateFileSize(size, category, role) {
    const maxSize = getMaxFileSize(category, role);
    return size <= maxSize;
}
async function validateFile(file, userRole) {
    const errors = [];
    if (!validateMimeType(file.mimetype)) {
        errors.push(`File type '${file.mimetype}' is not allowed`);
        return {
            valid: false,
            errors,
            category: FileCategory.UNKNOWN,
            maxSize: exports.DEFAULT_MAX_FILE_SIZE,
        };
    }
    const category = getFileCategory(file.mimetype);
    if (!validateFileExtension(file.mimetype, file.originalname)) {
        errors.push(`File extension does not match MIME type '${file.mimetype}'`);
    }
    const maxSize = getMaxFileSize(category, userRole);
    if (file.size > maxSize) {
        const maxSizeMB = (maxSize / 1024 / 1024).toFixed(1);
        errors.push(`File size exceeds limit of ${maxSizeMB}MB for ${category} files`);
    }
    const magicValid = await validateMagicNumber(file.path, file.mimetype);
    if (!magicValid) {
        errors.push('File content does not match the declared file type');
    }
    return {
        valid: errors.length === 0,
        errors,
        category,
        maxSize,
    };
}
function isPreviewableImage(mimeType) {
    return [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/bmp',
    ].includes(mimeType);
}
function requiresVirusScan(mimeType) {
    const highRiskTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/zip',
        'application/x-7z-compressed',
        'application/json',
        'application/xml',
        'text/plain',
        'text/csv',
    ];
    return highRiskTypes.includes(mimeType);
}
function getSafeFilename(originalName) {
    return originalName
        .replace(/\\/g, '/')
        .replace(/\.\.\//g, '')
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .substring(0, 255);
}
function formatFileSize(bytes) {
    if (bytes === 0)
        return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}


/***/ }),
/* 104 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FilesController = void 0;
const common_1 = __webpack_require__(2);
const platform_express_1 = __webpack_require__(105);
const multer_1 = __webpack_require__(106);
const path_1 = __webpack_require__(98);
const express_1 = __webpack_require__(16);
const fs_1 = __webpack_require__(100);
const swagger_1 = __webpack_require__(3);
const files_service_1 = __webpack_require__(96);
const storage_service_1 = __webpack_require__(107);
const metrics_service_1 = __webpack_require__(30);
const files_dto_1 = __webpack_require__(110);
const file_upload_dto_1 = __webpack_require__(97);
const jwt_auth_guard_1 = __webpack_require__(29);
const roles_guard_1 = __webpack_require__(32);
const roles_decorator_1 = __webpack_require__(33);
const fs = __importStar(__webpack_require__(99));
const nest_winston_1 = __webpack_require__(7);
const throttler_1 = __webpack_require__(6);
const files_validation_1 = __webpack_require__(103);
const MAX_FILE_SIZE_LIMITS = {
    image: 5 * 1024 * 1024,
    document: 10 * 1024 * 1024,
    audio: 50 * 1024 * 1024,
    video: 100 * 1024 * 1024,
    archive: 50 * 1024 * 1024,
    default: 10 * 1024 * 1024,
};
const UPLOAD_CONFIG = {
    tempDir: './uploads/temp',
    maxFiles: 1,
};
let FilesController = class FilesController {
    constructor(filesService, storageService, metricsService, logger) {
        this.filesService = filesService;
        this.storageService = storageService;
        this.metricsService = metricsService;
        this.logger = logger;
    }
    async uploadFile(file, dto, req) {
        if (!file) {
            throw new common_1.BadRequestException('File is required');
        }
        const rateLimit = await this.filesService.getRateLimitStatus(req.user.sub);
        if (rateLimit.remaining <= 0) {
            const resetSeconds = Math.ceil((rateLimit.resetTime - Date.now()) / 1000);
            throw new common_1.BadRequestException(`Upload rate limit exceeded. Maximum 5 uploads per minute. Try again in ${resetSeconds} seconds.`);
        }
        try {
            const userRoles = req.user.roles || [];
            const category = (0, files_validation_1.getFileCategory)(file.mimetype);
            const maxSize = (0, files_validation_1.getMaxFileSize)(category, userRoles[0]);
            if (file.size > maxSize) {
                await this.cleanupTempFile(file.path);
                throw new common_1.BadRequestException(`File size ${(0, files_validation_1.formatFileSize)(file.size)} exceeds the limit of ${(0, files_validation_1.formatFileSize)(maxSize)} ` +
                    `for ${category} files with your role.`);
            }
            const result = await this.filesService.uploadFile(file, req.user.sub, dto, userRoles);
            try {
                const storageResult = await this.storageService.uploadFile(file, category, {
                    uploaderId: req.user.sub,
                    fileId: result.id,
                    originalName: file.originalname,
                });
                this.logger.log(`File stored to ${this.storageService.getProvider()}: ${storageResult.key}`);
                this.metricsService.recordFileUpload(category, file.size, true);
            }
            catch (storageError) {
                this.logger.error(`Storage upload failed: ${storageError.message}`);
                this.metricsService.recordFileUploadError(category, storageError.message);
            }
            await this.cleanupTempFile(file.path);
            return {
                id: result.id,
                originalName: result.originalName,
                mimeType: result.mimeType,
                size: result.size,
                category: result.category,
                createdAt: result.createdAt,
                thumbnailUrl: result.thumbnailUrl,
                virusScanStatus: result.virusScanStatus,
                warnings: result.warnings,
            };
        }
        catch (error) {
            await this.cleanupTempFile(file.path);
            throw error;
        }
    }
    async getQuota(req) {
        const userRoles = req.user.roles || [];
        const quota = await this.filesService.getUserQuota(req.user.sub, userRoles);
        const rateLimit = await this.filesService.getRateLimitStatus(req.user.sub);
        const maxFileSize = Math.max(...Object.values({
            image: (0, files_validation_1.getMaxFileSize)((0, files_validation_1.getFileCategory)('image/jpeg'), userRoles[0]),
            document: (0, files_validation_1.getMaxFileSize)((0, files_validation_1.getFileCategory)('application/pdf'), userRoles[0]),
            video: (0, files_validation_1.getMaxFileSize)((0, files_validation_1.getFileCategory)('video/mp4'), userRoles[0]),
        }));
        return {
            totalQuota: quota.totalQuota,
            usedStorage: quota.usedStorage,
            availableStorage: quota.availableStorage,
            uploadsPerMinute: 5,
            currentUploads: 5 - rateLimit.remaining,
            maxFileSize,
        };
    }
    getAllowedTypes() {
        return {
            message: 'Allowed file types for upload',
            categories: {
                image: {
                    mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp', 'image/tiff'],
                    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.tiff', '.tif'],
                    maxSize: (0, files_validation_1.formatFileSize)(MAX_FILE_SIZE_LIMITS.image),
                },
                document: {
                    mimeTypes: [
                        'application/pdf', 'text/plain', 'text/csv', 'text/markdown',
                        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                        'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                        'application/rtf', 'application/json', 'application/xml', 'text/xml',
                    ],
                    extensions: ['.pdf', '.txt', '.csv', '.md', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.rtf', '.json', '.xml'],
                    maxSize: (0, files_validation_1.formatFileSize)(MAX_FILE_SIZE_LIMITS.document),
                },
                audio: {
                    mimeTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/m4a', 'audio/flac'],
                    extensions: ['.mp3', '.wav', '.ogg', '.aac', '.m4a', '.flac'],
                    maxSize: (0, files_validation_1.formatFileSize)(MAX_FILE_SIZE_LIMITS.audio),
                },
                video: {
                    mimeTypes: ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/webm', 'video/x-flv'],
                    extensions: ['.mp4', '.mpeg', '.mpg', '.mov', '.avi', '.mkv', '.webm', '.flv'],
                    maxSize: (0, files_validation_1.formatFileSize)(MAX_FILE_SIZE_LIMITS.video),
                },
                archive: {
                    mimeTypes: ['application/zip', 'application/x-7z-compressed'],
                    extensions: ['.zip', '.7z'],
                    maxSize: (0, files_validation_1.formatFileSize)(MAX_FILE_SIZE_LIMITS.archive),
                },
            },
            notes: [
                'File content is verified using magic numbers to prevent type spoofing',
                'All documents and archives are scanned for viruses when ClamAV is available',
                'Images are automatically processed for thumbnail generation',
                'File size limits may vary based on user role',
            ],
        };
    }
    findAll(req, category, uploaderId, relatedId, relatedType, search) {
        const isAdmin = req.user.roles?.includes('admin');
        const scopedUploaderId = isAdmin ? uploaderId : req.user.sub;
        return this.filesService.findAll({ category, uploaderId: scopedUploaderId, relatedId, relatedType, search });
    }
    getStats(req, userId) {
        const isAdmin = req.user.roles?.includes('admin');
        const scopedUserId = isAdmin ? userId : req.user.sub;
        return this.filesService.getStorageStats(scopedUserId);
    }
    getMyFiles(req) {
        return this.filesService.findAll({ uploaderId: req.user.sub });
    }
    async findOne(id, req) {
        const file = await this.filesService.findById(id);
        if (!file)
            throw new common_1.NotFoundException('File not found');
        const isOwner = file.uploaderId === req.user.sub;
        const isAdmin = req.user.roles?.includes('admin');
        if (!isOwner && !isAdmin) {
            const permissions = await this.filesService.getPermissions(id);
            const hasPermission = permissions.some((p) => p.userId === req.user.sub && p.canView);
            if (!hasPermission) {
                throw new common_1.ForbiddenException('You do not have permission to view this file');
            }
        }
        return file;
    }
    async download(id, req, res, ifNoneMatch) {
        const file = await this.filesService.getFileForDownload(id, req.user.sub, req.user.roles);
        try {
            await fs.access(file.path);
        }
        catch {
            return res.status(404).json({ message: 'Physical file not found' });
        }
        const contentType = file.mimeType === 'image/svg+xml'
            ? 'application/octet-stream'
            : file.mimeType;
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalName)}"`);
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Content-Security-Policy', "default-src 'none'");
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-Download-Options', 'noopen');
        const stream = (0, fs_1.createReadStream)(file.path);
        stream.on('error', (err) => {
            this.logger.error(`Error streaming file: ${err.message}`, err.stack);
            if (!res.headersSent) {
                res.status(500).json({ message: 'Error reading file' });
            }
        });
        stream.pipe(res);
    }
    async getPreview(id, req, res, width, height) {
        const MAX_DIMENSION = 2000;
        if (width && (width < 1 || width > MAX_DIMENSION)) {
            return res.status(400).json({ message: `Width must be between 1 and ${MAX_DIMENSION}px` });
        }
        if (height && (height < 1 || height > MAX_DIMENSION)) {
            return res.status(400).json({ message: `Height must be between 1 and ${MAX_DIMENSION}px` });
        }
        const file = await this.filesService.findById(id);
        const isOwner = file.uploaderId === req.user.sub;
        const isAdmin = req.user.roles?.includes('admin');
        if (!isOwner && !isAdmin) {
            const permissions = await this.filesService.getPermissions(id);
            const userPermission = permissions.find(p => p.userId === req.user.sub && p.canView);
            if (!userPermission) {
                return res.status(403).json({ message: 'You do not have permission to view this file' });
            }
        }
        if (!(0, files_validation_1.isPreviewableImage)(file.mimeType)) {
            return res.status(400).json({
                message: 'Preview not available for this file type',
                supportedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'],
            });
        }
        const filePath = file.path.startsWith('/')
            ? file.path
            : (__webpack_require__(98).join)(process.cwd(), file.path);
        const previewPath = await this.filesService.generatePreview(filePath, file.mimeType, { width, height });
        if (!previewPath) {
            return res.status(500).json({ message: 'Failed to generate preview' });
        }
        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        const stream = (0, fs_1.createReadStream)(previewPath);
        stream.on('error', () => {
            if (!res.headersSent) {
                res.status(500).json({ message: 'Error reading preview' });
            }
        });
        stream.pipe(res);
    }
    async getThumbnail(id, req, res) {
        try {
            const thumbnail = await this.filesService.getFileThumbnail(id, req.user.sub, req.user.roles || []);
            res.setHeader('Content-Type', thumbnail.mimeType);
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('Cache-Control', 'public, max-age=86400');
            const stream = (0, fs_1.createReadStream)(thumbnail.path);
            stream.on('error', () => {
                if (!res.headersSent) {
                    res.status(500).json({ message: 'Error reading thumbnail' });
                }
            });
            stream.pipe(res);
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                return res.status(404).json({ message: error.message });
            }
            if (error instanceof common_1.ForbiddenException) {
                return res.status(403).json({ message: error.message });
            }
            throw error;
        }
    }
    deleteFile(id, req) {
        return this.filesService.deleteFile(id, req.user.sub, req.user.roles);
    }
    setPermission(fileId, dto) {
        return this.filesService.setPermission(fileId, dto);
    }
    async getPermissions(fileId, req) {
        const file = await this.filesService.findById(fileId);
        if (!file)
            throw new common_1.NotFoundException('File not found');
        const isOwner = file.uploaderId === req.user.sub;
        const isAdmin = req.user.roles?.includes('admin');
        if (!isOwner && !isAdmin) {
            throw new common_1.ForbiddenException('Only the file owner or an admin can view permissions');
        }
        return this.filesService.getPermissions(fileId);
    }
    removePermission(permissionId) {
        return this.filesService.removePermission(permissionId);
    }
    async validateFile(id) {
        return this.filesService.validateFileMetadata(id);
    }
    async cleanup(olderThanDays) {
        const days = olderThanDays ? parseInt(olderThanDays, 10) : 30;
        if (isNaN(days) || days < 1) {
            throw new common_1.BadRequestException('olderThanDays must be a positive number');
        }
        return this.filesService.cleanupDeletedFiles(days);
    }
    async cleanupTempFile(filePath) {
        if (!filePath)
            return;
        try {
            await fs.access(filePath);
            await fs.unlink(filePath);
        }
        catch {
        }
    }
};
exports.FilesController = FilesController;
__decorate([
    (0, common_1.Post)('upload'),
    (0, swagger_1.ApiOperation)({
        summary: 'Upload a file',
        description: 'Upload a file with security validation including virus scanning, type verification, and rate limiting. Limited to 5 uploads per minute per user.',
    }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'File uploaded successfully',
        type: file_upload_dto_1.FileUploadResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid file or validation failed' }),
    (0, swagger_1.ApiResponse)({ status: 429, description: 'Rate limit exceeded' }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({
            destination: UPLOAD_CONFIG.tempDir,
            filename: (req, file, cb) => {
                const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
                const ext = (0, path_1.extname)(file.originalname).toLowerCase();
                cb(null, `temp-${uniqueSuffix}${ext}`);
            }
        }),
        limits: {
            fileSize: MAX_FILE_SIZE_LIMITS.video,
            files: UPLOAD_CONFIG.maxFiles,
        },
        fileFilter: (req, file, cb) => {
            if (!(0, files_validation_1.validateMimeType)(file.mimetype)) {
                cb(new common_1.BadRequestException(`File type '${file.mimetype}' is not allowed. Allowed types: images, documents, audio, video, archives.`), false);
                return;
            }
            if (!(0, files_validation_1.validateFileExtension)(file.mimetype, file.originalname)) {
                cb(new common_1.BadRequestException(`File extension '${(0, path_1.extname)(file.originalname)}' does not match MIME type '${file.mimetype}'`), false);
                return;
            }
            cb(null, true);
        },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_f = typeof Express !== "undefined" && (_e = Express.Multer) !== void 0 && _e.File) === "function" ? _f : Object, typeof (_g = typeof file_upload_dto_1.FileUploadDto !== "undefined" && file_upload_dto_1.FileUploadDto) === "function" ? _g : Object, Object]),
    __metadata("design:returntype", typeof (_h = typeof Promise !== "undefined" && Promise) === "function" ? _h : Object)
], FilesController.prototype, "uploadFile", null);
__decorate([
    (0, common_1.Get)('quota'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get upload quota information',
        description: 'Returns current storage quota, usage, and rate limit status for the authenticated user.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Quota information', type: file_upload_dto_1.UploadQuotaDto }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", typeof (_j = typeof Promise !== "undefined" && Promise) === "function" ? _j : Object)
], FilesController.prototype, "getQuota", null);
__decorate([
    (0, common_1.Get)('allowed-types'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get allowed file types',
        description: 'Returns list of allowed MIME types and file extensions for upload.',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], FilesController.prototype, "getAllowedTypes", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List files (scoped to current user unless admin)' }),
    (0, swagger_1.ApiQuery)({ name: 'category', required: false, description: 'Filter by file category' }),
    (0, swagger_1.ApiQuery)({ name: 'uploaderId', required: false, description: 'Filter by uploader ID (admin only)' }),
    (0, swagger_1.ApiQuery)({ name: 'relatedId', required: false, description: 'Filter by related entity ID' }),
    (0, swagger_1.ApiQuery)({ name: 'relatedType', required: false, description: 'Filter by related entity type' }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false, description: 'Search in filename and description' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('category')),
    __param(2, (0, common_1.Query)('uploaderId')),
    __param(3, (0, common_1.Query)('relatedId')),
    __param(4, (0, common_1.Query)('relatedType')),
    __param(5, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], FilesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get storage statistics (own stats, or any user if admin)' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], FilesController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('my'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current user\'s files' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FilesController.prototype, "getMyFiles", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get file metadata' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/download'),
    (0, swagger_1.ApiOperation)({ summary: 'Download a file' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Res)()),
    __param(3, (0, common_1.Headers)('if-none-match')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, typeof (_k = typeof express_1.Response !== "undefined" && express_1.Response) === "function" ? _k : Object, String]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "download", null);
__decorate([
    (0, common_1.Get)(':id/preview'),
    (0, common_1.UseGuards)(throttler_1.ThrottlerGuard),
    (0, throttler_1.Throttle)({ default: { limit: 10, ttl: 60000 } }),
    (0, swagger_1.ApiOperation)({
        summary: 'Get file preview (for images)',
        description: 'Returns a preview image for supported file types (JPEG, PNG, GIF, WebP, BMP)',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Res)()),
    __param(3, (0, common_1.Query)('width', new common_1.DefaultValuePipe(200), common_1.ParseIntPipe)),
    __param(4, (0, common_1.Query)('height', new common_1.DefaultValuePipe(200), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, typeof (_l = typeof express_1.Response !== "undefined" && express_1.Response) === "function" ? _l : Object, Number, Number]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "getPreview", null);
__decorate([
    (0, common_1.Get)(':id/thumbnail'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get file thumbnail',
        description: 'Returns the thumbnail image for supported file types',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, typeof (_m = typeof express_1.Response !== "undefined" && express_1.Response) === "function" ? _m : Object]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "getThumbnail", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a file' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], FilesController.prototype, "deleteFile", null);
__decorate([
    (0, common_1.Post)(':id/permissions'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'teacher'),
    (0, swagger_1.ApiOperation)({ summary: 'Set file permission' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_o = typeof files_dto_1.SetFilePermissionDto !== "undefined" && files_dto_1.SetFilePermissionDto) === "function" ? _o : Object]),
    __metadata("design:returntype", void 0)
], FilesController.prototype, "setPermission", null);
__decorate([
    (0, common_1.Get)(':id/permissions'),
    (0, swagger_1.ApiOperation)({ summary: 'Get file permissions (owner or admin only)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "getPermissions", null);
__decorate([
    (0, common_1.Delete)('permissions/:permissionId'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'teacher'),
    (0, swagger_1.ApiOperation)({ summary: 'Remove file permission' }),
    __param(0, (0, common_1.Param)('permissionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FilesController.prototype, "removePermission", null);
__decorate([
    (0, common_1.Post)(':id/validate'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiOperation)({
        summary: 'Validate file integrity (admin only)',
        description: 'Validates file metadata, hash, and physical file integrity',
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "validateFile", null);
__decorate([
    (0, common_1.Post)('cleanup'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Clean up deleted files (admin only)',
        description: 'Permanently removes files soft-deleted more than specified days ago',
    }),
    __param(0, (0, common_1.Query)('olderThanDays')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "cleanup", null);
exports.FilesController = FilesController = __decorate([
    (0, swagger_1.ApiTags)('Files'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('files'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(3, (0, common_1.Inject)(nest_winston_1.WINSTON_MODULE_NEST_PROVIDER)),
    __metadata("design:paramtypes", [typeof (_a = typeof files_service_1.FilesService !== "undefined" && files_service_1.FilesService) === "function" ? _a : Object, typeof (_b = typeof storage_service_1.StorageService !== "undefined" && storage_service_1.StorageService) === "function" ? _b : Object, typeof (_c = typeof metrics_service_1.MetricsService !== "undefined" && metrics_service_1.MetricsService) === "function" ? _c : Object, typeof (_d = typeof common_1.LoggerService !== "undefined" && common_1.LoggerService) === "function" ? _d : Object])
], FilesController);


/***/ }),
/* 105 */
/***/ ((module) => {

module.exports = require("@nestjs/platform-express");

/***/ }),
/* 106 */
/***/ ((module) => {

module.exports = require("multer");

/***/ }),
/* 107 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var StorageService_1;
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.StorageService = void 0;
const common_1 = __webpack_require__(2);
const config_1 = __webpack_require__(5);
const client_s3_1 = __webpack_require__(108);
const s3_request_presigner_1 = __webpack_require__(109);
const fs_1 = __webpack_require__(100);
const path = __importStar(__webpack_require__(98));
const uuid_1 = __webpack_require__(20);
let StorageService = StorageService_1 = class StorageService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(StorageService_1.name);
        this.s3Client = null;
    }
    onModuleInit() {
        this.initializeConfig();
        if (this.config.provider === 's3') {
            this.initializeS3Client();
        }
        this.ensureLocalDirectory();
    }
    initializeConfig() {
        const provider = this.configService.get('STORAGE_PROVIDER', 'local');
        if (provider === 's3') {
            const endpoint = this.configService.get('S3_ENDPOINT');
            const region = this.configService.get('S3_REGION', 'us-east-1');
            const bucket = this.configService.get('S3_BUCKET');
            const accessKeyId = this.configService.get('S3_ACCESS_KEY_ID');
            const secretAccessKey = this.configService.get('S3_SECRET_ACCESS_KEY');
            if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
                this.logger.warn('S3 configuration incomplete, falling back to local storage');
                this.config = { provider: 'local' };
            }
            else {
                const isMinIO = endpoint.includes('minio') || endpoint.includes(':9000');
                this.config = {
                    provider: 's3',
                    s3: {
                        endpoint,
                        region,
                        bucket,
                        accessKeyId,
                        secretAccessKey,
                        forcePathStyle: isMinIO || endpoint.includes('localhost') || endpoint.includes('127.0.0.1'),
                    },
                };
                this.logger.log(`S3 storage configured: ${endpoint}, bucket: ${bucket}`);
            }
        }
        else {
            this.config = { provider: 'local' };
            this.logger.log('Local storage configured');
        }
        this.localStoragePath = this.configService.get('LOCAL_STORAGE_PATH', './uploads');
    }
    initializeS3Client() {
        if (!this.config.s3)
            return;
        const { endpoint, region, accessKeyId, secretAccessKey, forcePathStyle } = this.config.s3;
        this.s3Client = new client_s3_1.S3Client({
            endpoint,
            region,
            credentials: {
                accessKeyId,
                secretAccessKey,
            },
            forcePathStyle,
        });
        this.logger.log(`S3 client initialized with endpoint: ${endpoint}`);
    }
    async ensureLocalDirectory() {
        try {
            await fs_1.promises.mkdir(this.localStoragePath, { recursive: true });
        }
        catch (error) {
            this.logger.error(`Failed to create local storage directory: ${error.message}`);
        }
    }
    async uploadFile(file, category = 'general', metadata) {
        const key = this.generateKey(category, file.originalname);
        if (this.config.provider === 's3' && this.s3Client) {
            return this.uploadToS3(file, key, metadata);
        }
        return this.uploadToLocal(file, key);
    }
    async uploadToS3(file, key, metadata) {
        const bucket = this.config.s3.bucket;
        try {
            const command = new client_s3_1.PutObjectCommand({
                Bucket: bucket,
                Key: key,
                Body: file.buffer || (0, fs_1.createReadStream)(file.path),
                ContentType: file.mimetype,
                Metadata: metadata,
            });
            await this.s3Client.send(command);
            this.logger.log(`File uploaded to S3: ${key}`);
            return {
                key,
                url: `${this.config.s3.endpoint}/${bucket}/${key}`,
                size: file.size,
                mimeType: file.mimetype,
            };
        }
        catch (error) {
            this.logger.error(`S3 upload failed: ${error.message}`);
            this.logger.warn('Falling back to local storage');
            return this.uploadToLocal(file, key);
        }
    }
    async uploadToLocal(file, key) {
        const filePath = path.join(this.localStoragePath, key);
        const dir = path.dirname(filePath);
        try {
            await fs_1.promises.mkdir(dir, { recursive: true });
            if (file.buffer) {
                await fs_1.promises.writeFile(filePath, file.buffer);
            }
            else if (file.path) {
                await fs_1.promises.copyFile(file.path, filePath);
            }
            else {
                throw new Error('No file content available');
            }
            this.logger.log(`File uploaded to local storage: ${filePath}`);
            return {
                key,
                url: `/uploads/${key}`,
                size: file.size,
                mimeType: file.mimetype,
            };
        }
        catch (error) {
            this.logger.error(`Local upload failed: ${error.message}`);
            throw error;
        }
    }
    async getSignedDownloadUrl(key, expiresIn = 3600) {
        if (this.config.provider === 's3' && this.s3Client && this.config.s3) {
            try {
                const command = new client_s3_1.GetObjectCommand({
                    Bucket: this.config.s3.bucket,
                    Key: key,
                });
                const signedUrl = await (0, s3_request_presigner_1.getSignedUrl)(this.s3Client, command, { expiresIn });
                return { url: signedUrl, isLocal: false };
            }
            catch (error) {
                this.logger.error(`Failed to generate S3 signed URL: ${error.message}`);
            }
        }
        const filePath = path.join(this.localStoragePath, key);
        try {
            await fs_1.promises.access(filePath);
            return { url: filePath, isLocal: true };
        }
        catch {
            throw new Error(`File not found: ${key}`);
        }
    }
    async deleteFile(key) {
        if (this.config.provider === 's3' && this.s3Client && this.config.s3) {
            try {
                const command = new client_s3_1.DeleteObjectCommand({
                    Bucket: this.config.s3.bucket,
                    Key: key,
                });
                await this.s3Client.send(command);
                this.logger.log(`File deleted from S3: ${key}`);
                return;
            }
            catch (error) {
                this.logger.error(`S3 delete failed: ${error.message}`);
            }
        }
        const filePath = path.join(this.localStoragePath, key);
        try {
            await fs_1.promises.unlink(filePath);
            this.logger.log(`File deleted from local storage: ${filePath}`);
        }
        catch (error) {
            if (error.code !== 'ENOENT') {
                this.logger.error(`Failed to delete local file: ${error.message}`);
                throw error;
            }
        }
    }
    async fileExists(key) {
        if (this.config.provider === 's3' && this.s3Client && this.config.s3) {
            try {
                const command = new client_s3_1.HeadObjectCommand({
                    Bucket: this.config.s3.bucket,
                    Key: key,
                });
                await this.s3Client.send(command);
                return true;
            }
            catch {
                return false;
            }
        }
        const filePath = path.join(this.localStoragePath, key);
        try {
            await fs_1.promises.access(filePath);
            return true;
        }
        catch {
            return false;
        }
    }
    async getFileStream(key) {
        if (this.config.provider === 's3' && this.s3Client && this.config.s3) {
            try {
                const command = new client_s3_1.GetObjectCommand({
                    Bucket: this.config.s3.bucket,
                    Key: key,
                });
                const response = await this.s3Client.send(command);
                return response.Body;
            }
            catch (error) {
                this.logger.error(`S3 stream failed: ${error.message}`);
                throw error;
            }
        }
        const filePath = path.join(this.localStoragePath, key);
        return (0, fs_1.createReadStream)(filePath);
    }
    generateKey(category, originalName) {
        const ext = path.extname(originalName);
        const timestamp = Date.now();
        const uuid = (0, uuid_1.v4)();
        return `${category}/${timestamp}-${uuid}${ext}`;
    }
    getProvider() {
        return this.config.provider;
    }
    async getStats() {
        return {
            provider: this.config.provider,
            localPath: this.localStoragePath,
            bucket: this.config.s3?.bucket,
        };
    }
};
exports.StorageService = StorageService;
exports.StorageService = StorageService = StorageService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object])
], StorageService);


/***/ }),
/* 108 */
/***/ ((module) => {

module.exports = require("@aws-sdk/client-s3");

/***/ }),
/* 109 */
/***/ ((module) => {

module.exports = require("@aws-sdk/s3-request-presigner");

/***/ }),
/* 110 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FilePreviewDto = exports.UploadQuotaDto = exports.FileUploadResponseDto = exports.BatchFileOperationDto = exports.UpdateFileMetadataDto = exports.FileVisibility = exports.FileUploadCategory = exports.FileUploadDto = exports.SetFilePermissionDto = exports.UploadFileDto = void 0;
const class_validator_1 = __webpack_require__(23);
class UploadFileDto {
}
exports.UploadFileDto = UploadFileDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255, { message: 'Original name cannot exceed 255 characters' }),
    __metadata("design:type", String)
], UploadFileDto.prototype, "originalName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100, { message: 'MIME type cannot exceed 100 characters' }),
    __metadata("design:type", String)
], UploadFileDto.prototype, "mimeType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50, { message: 'Category cannot exceed 50 characters' }),
    __metadata("design:type", String)
], UploadFileDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsUUID)('4', { message: 'Invalid related ID' }),
    __metadata("design:type", String)
], UploadFileDto.prototype, "relatedId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50, { message: 'Related type cannot exceed 50 characters' }),
    __metadata("design:type", String)
], UploadFileDto.prototype, "relatedType", void 0);
class SetFilePermissionDto {
}
exports.SetFilePermissionDto = SetFilePermissionDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)('4', { message: 'Invalid user ID' }),
    __metadata("design:type", String)
], SetFilePermissionDto.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)('4', { message: 'Invalid role ID' }),
    __metadata("design:type", String)
], SetFilePermissionDto.prototype, "roleId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SetFilePermissionDto.prototype, "canView", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SetFilePermissionDto.prototype, "canEdit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SetFilePermissionDto.prototype, "canDelete", void 0);
var file_upload_dto_1 = __webpack_require__(97);
Object.defineProperty(exports, "FileUploadDto", ({ enumerable: true, get: function () { return file_upload_dto_1.FileUploadDto; } }));
Object.defineProperty(exports, "FileUploadCategory", ({ enumerable: true, get: function () { return file_upload_dto_1.FileUploadCategory; } }));
Object.defineProperty(exports, "FileVisibility", ({ enumerable: true, get: function () { return file_upload_dto_1.FileVisibility; } }));
Object.defineProperty(exports, "UpdateFileMetadataDto", ({ enumerable: true, get: function () { return file_upload_dto_1.UpdateFileMetadataDto; } }));
Object.defineProperty(exports, "BatchFileOperationDto", ({ enumerable: true, get: function () { return file_upload_dto_1.BatchFileOperationDto; } }));
Object.defineProperty(exports, "FileUploadResponseDto", ({ enumerable: true, get: function () { return file_upload_dto_1.FileUploadResponseDto; } }));
Object.defineProperty(exports, "UploadQuotaDto", ({ enumerable: true, get: function () { return file_upload_dto_1.UploadQuotaDto; } }));
Object.defineProperty(exports, "FilePreviewDto", ({ enumerable: true, get: function () { return file_upload_dto_1.FilePreviewDto; } }));


/***/ }),
/* 111 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.HealthModule = exports.HealthController = void 0;
const common_1 = __webpack_require__(2);
const prisma_service_1 = __webpack_require__(10);
const swagger_1 = __webpack_require__(3);
let HealthController = class HealthController {
    constructor(prisma) {
        this.prisma = prisma;
    }
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
};
exports.HealthController = HealthController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Check system health' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "check", null);
exports.HealthController = HealthController = __decorate([
    (0, swagger_1.ApiTags)('Health'),
    (0, common_1.Controller)('health'),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], HealthController);
let HealthModule = class HealthModule {
};
exports.HealthModule = HealthModule;
exports.HealthModule = HealthModule = __decorate([
    (0, common_1.Module)({
        controllers: [HealthController],
    })
], HealthModule);


/***/ }),
/* 112 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AdminModule = void 0;
const common_1 = __webpack_require__(2);
const jwt_1 = __webpack_require__(13);
const admin_service_1 = __webpack_require__(113);
const admin_controller_1 = __webpack_require__(114);
const admin_gateway_1 = __webpack_require__(119);
const prisma_module_1 = __webpack_require__(9);
const schedule_1 = __webpack_require__(8);
let AdminModule = class AdminModule {
};
exports.AdminModule = AdminModule;
exports.AdminModule = AdminModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, schedule_1.ScheduleModule.forRoot(), jwt_1.JwtModule.register({})],
        controllers: [admin_controller_1.AdminController],
        providers: [admin_service_1.AdminService, admin_gateway_1.AdminGateway],
        exports: [admin_service_1.AdminService],
    })
], AdminModule);


/***/ }),
/* 113 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AdminService_1;
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AdminService = void 0;
const common_1 = __webpack_require__(2);
const prisma_service_1 = __webpack_require__(10);
const client_1 = __webpack_require__(11);
const user_sanitizer_1 = __webpack_require__(18);
var UserStatus;
(function (UserStatus) {
    UserStatus["ACTIVE"] = "active";
    UserStatus["PENDING"] = "pending";
    UserStatus["SUSPENDED"] = "suspended";
})(UserStatus || (UserStatus = {}));
var AuditAction;
(function (AuditAction) {
    AuditAction["USER_UPDATE"] = "user_update";
    AuditAction["USER_APPROVE"] = "user_approve";
    AuditAction["USER_SUSPEND"] = "user_suspend";
    AuditAction["USER_REACTIVATE"] = "user_reactivate";
    AuditAction["USER_DELETE"] = "user_delete";
    AuditAction["MESSAGE_DELETE"] = "message_delete";
    AuditAction["MESSAGE_EDIT"] = "message_edit";
    AuditAction["COURSE_ACTIVATE"] = "course_activate";
    AuditAction["COURSE_DEACTIVATE"] = "course_deactivate";
    AuditAction["SETTINGS_UPDATE"] = "settings_update";
})(AuditAction || (AuditAction = {}));
const crypto = __importStar(__webpack_require__(102));
const bcrypt = __importStar(__webpack_require__(19));
let AdminService = AdminService_1 = class AdminService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(AdminService_1.name);
        this.metricsCache = null;
        this.CACHE_TTL = 60000;
    }
    async createUser(dto, actorId) {
        const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (existing)
            throw new common_1.ConflictException('Email already registered');
        const role = await this.prisma.role.findUnique({ where: { name: dto.role } });
        if (!role)
            throw new common_1.BadRequestException(`Role ${dto.role} does not exist`);
        const password = dto.password || crypto.randomBytes(8).toString('hex');
        const passwordHash = await bcrypt.hash(password, 12);
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                firstName: dto.firstName,
                lastName: dto.lastName,
                passwordHash,
                status: UserStatus.ACTIVE,
                userRoles: {
                    create: { roleId: role.id },
                },
            },
        });
        await this.prisma.auditLog.create({
            data: {
                actorId,
                action: 'user_create_manual',
                targetId: user.id,
                metadata: { role: dto.role, email: dto.email },
            },
        });
        return user;
    }
    async linkParentToChild(dto, actorId) {
        const parent = await this.prisma.user.findUnique({
            where: { id: dto.parentId },
            include: { userRoles: { include: { role: true } } },
        });
        const student = await this.prisma.user.findUnique({
            where: { id: dto.studentId },
            include: { userRoles: { include: { role: true } } },
        });
        if (!parent || !student)
            throw new common_1.NotFoundException('Parent or Student not found');
        const isParent = parent.userRoles.some(r => r.role.name === 'parent');
        const isStudent = student.userRoles.some(r => r.role.name === 'student');
        if (!isParent)
            throw new common_1.BadRequestException('Selected parent user does not have Parent role');
        if (!isStudent)
            throw new common_1.BadRequestException('Selected student user does not have Student role');
        const existing = await this.prisma.parentStudent.findUnique({
            where: {
                parentId_studentId: {
                    parentId: dto.parentId,
                    studentId: dto.studentId,
                },
            },
        });
        if (existing)
            throw new common_1.ConflictException('Link already exists');
        await this.prisma.parentStudent.create({
            data: {
                parentId: dto.parentId,
                studentId: dto.studentId,
            },
        });
        await this.prisma.auditLog.create({
            data: {
                actorId,
                action: 'parent_student_link',
                targetId: dto.studentId,
                metadata: { parentId: dto.parentId },
            },
        });
        return { success: true };
    }
    async getUsers(params) {
        const result = await this.getAllUsers({
            ...params,
            status: params.status,
        });
        return {
            users: (0, user_sanitizer_1.sanitizeUsers)(result.users),
            total: result.total,
        };
    }
    async updateUserStatus(userId, dto, actorId) {
        const { status, reason } = dto;
        switch (status) {
            case 'active':
                return this.approveUser(userId, actorId);
            case 'suspended':
                return this.suspendUser(userId, reason, actorId);
            default:
                throw new common_1.BadRequestException(`Unsupported status: ${status}`);
        }
    }
    async getAllUsers(params) {
        const { page = 1, limit = 20, search, status, role, sortBy = 'createdAt', sortOrder = 'desc', includeDeleted = false, } = params;
        const where = {};
        if (!includeDeleted) {
            where.deletedAt = null;
        }
        if (search) {
            const sanitizedSearch = search.replace(/[%_\\]/g, '\\$&');
            where.OR = [
                { email: { contains: sanitizedSearch, mode: 'insensitive' } },
                { firstName: { contains: sanitizedSearch, mode: 'insensitive' } },
                { lastName: { contains: sanitizedSearch, mode: 'insensitive' } },
            ];
        }
        if (status) {
            where.status = status;
        }
        if (role) {
            where.userRoles = {
                some: {
                    role: {
                        name: role,
                    },
                },
            };
        }
        const skip = (page - 1) * limit;
        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                include: {
                    userRoles: {
                        include: {
                            role: true,
                        },
                    },
                    _count: {
                        select: {
                            uploadedFiles: true,
                            sentMessages: true,
                        },
                    },
                },
                orderBy: { [sortBy]: sortOrder },
                skip,
                take: limit,
            }),
            this.prisma.user.count({ where }),
        ]);
        return { users, total };
    }
    async getUserById(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                userRoles: {
                    include: { role: true },
                },
                enrollments: {
                    include: { class: { include: { course: true } } },
                },
                parentOf: {
                    include: {
                        student: true,
                    },
                },
                childOf: {
                    include: {
                        parent: true,
                    },
                },
                _count: {
                    select: {
                        uploadedFiles: true,
                    },
                },
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return user;
    }
    async updateUser(userId, updateData, actorId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const updatedUser = await this.prisma.user.update({
            where: { id: userId },
            data: {
                ...updateData,
                updatedAt: new Date(),
            },
        });
        await this.prisma.auditLog.create({
            data: {
                actorId: actorId,
                action: AuditAction.USER_UPDATE,
                targetId: userId,
                metadata: { changes: updateData },
            },
        });
        return updatedUser;
    }
    async approveUser(userId, actorId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        if (user.status !== UserStatus.PENDING) {
            throw new common_1.BadRequestException('User is not pending approval');
        }
        const updatedUser = await this.prisma.user.update({
            where: { id: userId },
            data: { status: UserStatus.ACTIVE, updatedAt: new Date() },
        });
        await this.prisma.auditLog.create({
            data: {
                actorId: actorId,
                action: AuditAction.USER_APPROVE,
                targetId: userId,
                metadata: { previousStatus: user.status, newStatus: UserStatus.ACTIVE },
            },
        });
        return updatedUser;
    }
    async suspendUser(userId, reason, actorId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        if (user.id === actorId) {
            throw new common_1.BadRequestException('Cannot suspend yourself');
        }
        const updatedUser = await this.prisma.user.update({
            where: { id: userId },
            data: { status: UserStatus.SUSPENDED, updatedAt: new Date() },
        });
        await this.prisma.auditLog.create({
            data: {
                actorId: actorId,
                action: AuditAction.USER_SUSPEND,
                targetId: userId,
                metadata: { reason, previousStatus: user.status },
            },
        });
        return updatedUser;
    }
    async reactivateUser(userId, actorId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const updatedUser = await this.prisma.user.update({
            where: { id: userId },
            data: { status: UserStatus.ACTIVE, updatedAt: new Date() },
        });
        await this.prisma.auditLog.create({
            data: {
                actorId: actorId,
                action: AuditAction.USER_REACTIVATE,
                targetId: userId,
                metadata: { previousStatus: user.status },
            },
        });
        return updatedUser;
    }
    async deleteUser(userId, actorId, permanent = false) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        if (user.id === actorId) {
            throw new common_1.BadRequestException('Cannot delete yourself');
        }
        if (permanent) {
            if (!user.deletedAt) {
                throw new common_1.BadRequestException('User must be soft deleted first before permanent deletion');
            }
            await this.prisma.$transaction([
                this.prisma.auditLog.create({
                    data: {
                        actorId: actorId,
                        action: AuditAction.USER_DELETE,
                        targetId: userId,
                        metadata: { deletedUserEmail: user.email, permanent: true },
                    },
                }),
                this.prisma.user.delete({ where: { id: userId } }),
            ]);
        }
        else {
            await this.prisma.$transaction([
                this.prisma.auditLog.create({
                    data: {
                        actorId: actorId,
                        action: AuditAction.USER_DELETE,
                        targetId: userId,
                        metadata: { deletedUserEmail: user.email, softDelete: true },
                    },
                }),
                this.prisma.user.update({
                    where: { id: userId },
                    data: {
                        deletedAt: new Date(),
                        status: 'suspended',
                    }
                }),
            ]);
        }
    }
    async getSystemMetrics() {
        if (this.metricsCache && Date.now() - this.metricsCache.timestamp < this.CACHE_TTL) {
            return this.metricsCache.data;
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        const [userCounts, totalCourses, activeCourses, totalClasses, totalMessages, messagesToday, messagesThisWeek, totalFiles, filesToday, storageAgg, totalEnrollments, attendanceSessions, usersByRole,] = await Promise.all([
            this.prisma.user.groupBy({
                by: ['status'],
                _count: { id: true },
            }),
            this.prisma.course.count(),
            this.prisma.course.count({ where: { isActive: true } }),
            this.prisma.class.count(),
            this.prisma.message.count(),
            this.prisma.message.count({ where: { createdAt: { gte: today } } }),
            this.prisma.message.count({ where: { createdAt: { gte: weekAgo } } }),
            this.prisma.file.count(),
            this.prisma.file.count({ where: { createdAt: { gte: today } } }),
            this.prisma.file.aggregate({
                _sum: { size: true },
            }),
            this.prisma.classEnrollment.count(),
            this.prisma.attendanceSession.count(),
            this.prisma.userRole.groupBy({
                by: ['roleId'],
                _count: { userId: true },
            }),
        ]);
        const totalUsers = userCounts.reduce((sum, u) => sum + u._count.id, 0);
        const activeUsers = userCounts.find(u => u.status === UserStatus.ACTIVE)?._count.id || 0;
        const newToday = await this.prisma.user.count({ where: { createdAt: { gte: today } } });
        const newThisWeek = await this.prisma.user.count({ where: { createdAt: { gte: weekAgo } } });
        const byRole = {};
        for (const ur of usersByRole) {
            const role = await this.prisma.role.findUnique({ where: { id: ur.roleId } });
            byRole[role?.name || 'unknown'] = ur._count.userId;
        }
        const metrics = {
            timestamp: new Date().toISOString(),
            users: {
                total: totalUsers,
                active: activeUsers,
                newToday,
                newThisWeek,
                byRole,
            },
            messages: {
                total: totalMessages,
                today: messagesToday,
                thisWeek: messagesThisWeek,
                averagePerDay: Math.round(totalMessages / 30),
            },
            courses: {
                total: totalCourses,
                active: activeCourses,
                totalEnrollments,
            },
            files: {
                total: totalFiles,
                totalSize: storageAgg._sum.size || 0,
                today: filesToday,
            },
            attendance: {
                totalSessions: attendanceSessions,
                averageRate: await this.calculateAverageAttendanceRate(),
            },
            system: {
                uptime: process.uptime(),
                memory: {
                    used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                    total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
                    percentage: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100),
                },
                cpu: 0,
                activeConnections: 0,
            },
        };
        this.metricsCache = { data: metrics, timestamp: Date.now() };
        return metrics;
    }
    async getDailyCounts(model, startDate, endDate) {
        const tableMap = { message: 'messages', user: 'users', file: 'files' };
        const table = tableMap[model];
        const dateField = 'created_at';
        const results = await this.prisma.$queryRaw(client_1.Prisma.sql `
            SELECT DATE(${client_1.Prisma.raw(dateField)}) as date, COUNT(*) as count
            FROM ${client_1.Prisma.raw(table)}
            WHERE ${client_1.Prisma.raw(dateField)} >= ${startDate} AND ${client_1.Prisma.raw(dateField)} <= ${endDate}
            GROUP BY DATE(${client_1.Prisma.raw(dateField)})
            ORDER BY date
            `);
        const countsByDate = new Map();
        results.forEach((row) => {
            countsByDate.set(row.date.toISOString().split('T')[0], Number(row.count));
        });
        const days = this.getDaysArray(startDate, endDate);
        return days.map(day => {
            const dateStr = day.toISOString().split('T')[0];
            return countsByDate.get(dateStr) || 0;
        });
    }
    getDaysArray(startDate, endDate) {
        const dates = [];
        const current = new Date(startDate);
        const end = new Date(endDate);
        while (current <= end) {
            dates.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }
        return dates;
    }
    async getActivityTimeline(range) {
        const rangeMap = {
            'today': 1,
            'week': 7,
            'month': 30,
            'quarter': 90,
            'year': 365,
        };
        const days = range ? (rangeMap[range] || parseInt(range, 10) || 30) : 30;
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const [userCounts, messageCounts, fileCounts, dayLabels] = await Promise.all([
            this.getDailyCounts('user', startDate, endDate),
            this.getDailyCounts('message', startDate, endDate),
            this.getDailyCounts('file', startDate, endDate),
            this.getDaysArray(startDate, endDate),
        ]);
        return {
            labels: dayLabels.map(d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
            datasets: [
                { name: 'New Users', data: userCounts, color: '#3b82f6' },
                { name: 'Messages', data: messageCounts, color: '#10b981' },
                { name: 'Files', data: fileCounts, color: '#f59e0b' },
            ],
        };
    }
    async getRealTimeStats() {
        let dbHealth = 'healthy';
        try {
            await this.prisma.$queryRaw `SELECT 1`;
        }
        catch {
            dbHealth = 'down';
        }
        const storageHealth = 'healthy';
        return {
            onlineUsers: 0,
            activeChannels: await this.prisma.channel.count({ where: { isArchived: false } }),
            pendingTasks: await this.prisma.user.count({ where: { status: UserStatus.PENDING } }),
            systemHealth: {
                database: dbHealth,
                websocket: 'healthy',
                storage: storageHealth,
            },
        };
    }
    async getModerationQueue(page, limit) {
        return this.getContentForModeration({ page, limit });
    }
    async bulkAction(dto, actorId) {
        const { action, targetType, targetIds, reason } = dto;
        if (!Array.isArray(targetIds) || targetIds.length === 0) {
            throw new common_1.BadRequestException('No targets specified');
        }
        if (targetIds.length > 100) {
            throw new common_1.BadRequestException('Bulk action limited to 100 targets per request');
        }
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        for (const id of targetIds) {
            if (typeof id !== 'string' || !uuidRegex.test(id)) {
                throw new common_1.BadRequestException(`Invalid ID format: ${id}`);
            }
        }
        let success = 0;
        let failed = 0;
        for (const targetId of targetIds) {
            try {
                switch (targetType) {
                    case 'user':
                        await this.handleBulkUserAction(action, targetId, reason, actorId);
                        break;
                    case 'message':
                        await this.handleBulkMessageAction(action, targetId, actorId);
                        break;
                    case 'course':
                        await this.handleBulkCourseAction(action, targetId, actorId);
                        break;
                    default:
                        failed++;
                        continue;
                }
                success++;
            }
            catch (err) {
                this.logger.warn(`Bulk action failed for ${targetType} ${targetId}:`, err.message);
                failed++;
            }
        }
        this.logger.log(`Bulk action completed by ${actorId}: ${success} succeeded, ${failed} failed`);
        return { success, failed };
    }
    async handleBulkUserAction(action, userId, reason, actorId) {
        switch (action) {
            case 'suspend':
                await this.suspendUser(userId, reason, actorId);
                break;
            case 'activate':
                await this.reactivateUser(userId, actorId);
                break;
            case 'delete':
                await this.deleteUser(userId, actorId, false);
                break;
            case 'permanent-delete':
                await this.deleteUser(userId, actorId, true);
                break;
            default:
                throw new common_1.BadRequestException(`Unknown user action: ${action}`);
        }
    }
    async handleBulkMessageAction(action, messageId, actorId) {
        const message = await this.prisma.message.findUnique({ where: { id: messageId } });
        if (!message)
            throw new common_1.NotFoundException('Message not found');
        switch (action) {
            case 'delete':
                await this.prisma.message.update({
                    where: { id: messageId },
                    data: { isDeleted: true },
                });
                await this.prisma.auditLog.create({
                    data: {
                        actorId,
                        action: AuditAction.MESSAGE_DELETE,
                        messageId,
                        channelId: message.channelId,
                        metadata: { bulkAction: true },
                    },
                });
                break;
            default:
                throw new common_1.BadRequestException(`Unknown message action: ${action}`);
        }
    }
    async handleBulkCourseAction(action, courseId, actorId) {
        const isActive = action === 'activate';
        await this.toggleCourseStatus(courseId, isActive, actorId);
    }
    async calculateAverageAttendanceRate() {
        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const [totalRecords, presentRecords] = await Promise.all([
                this.prisma.attendanceRecord.count({
                    where: { markedAt: { gte: thirtyDaysAgo } },
                }),
                this.prisma.attendanceRecord.count({
                    where: {
                        markedAt: { gte: thirtyDaysAgo },
                        status: 'present',
                    },
                }),
            ]);
            if (totalRecords === 0)
                return 100;
            return Math.round((presentRecords / totalRecords) * 100);
        }
        catch (error) {
            this.logger.error('Failed to calculate attendance rate:', error);
            return 85;
        }
    }
    async getContentForModeration(params) {
        const { page = 1, limit = 50, contentType, flagged = false } = params;
        const skip = (page - 1) * limit;
        if (!contentType || contentType === 'message') {
            const where = {};
            if (flagged) {
                where.isDeleted = false;
            }
            const [messages, total] = await Promise.all([
                this.prisma.message.findMany({
                    where,
                    include: {
                        sender: {
                            select: { id: true, email: true, firstName: true, lastName: true },
                        },
                        channel: {
                            select: { id: true, name: true },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: limit,
                }),
                this.prisma.message.count({ where }),
            ]);
            return {
                content: messages.map(m => ({ ...m, contentType: 'message' })),
                total,
            };
        }
        return { content: [], total: 0 };
    }
    async moderateContent(contentId, moderationData, actorId) {
        const { contentType, action, reason } = moderationData;
        if (contentType === 'message') {
            const message = await this.prisma.message.findUnique({
                where: { id: contentId },
            });
            if (!message)
                throw new common_1.NotFoundException('Message not found');
            const updatedMessage = await this.prisma.message.update({
                where: { id: contentId },
                data: {
                    isDeleted: action === 'delete',
                },
            });
            await this.prisma.auditLog.create({
                data: {
                    actorId: actorId,
                    action: action === 'delete' ? AuditAction.MESSAGE_DELETE : AuditAction.MESSAGE_EDIT,
                    messageId: contentId,
                    metadata: { reason, action },
                },
            });
            return updatedMessage;
        }
        throw new common_1.BadRequestException('Unsupported content type');
    }
    async getAuditLogs(page, limit, filters) {
        const { action, actorId, startDate, endDate } = filters || {};
        const pageNum = page ?? 1;
        const limitNum = limit ?? 50;
        const skip = (pageNum - 1) * limitNum;
        const where = {};
        if (actorId)
            where.actorId = actorId;
        if (action)
            where.action = action;
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate)
                where.createdAt.gte = new Date(startDate);
            if (endDate)
                where.createdAt.lte = new Date(endDate);
        }
        const [logs, total] = await Promise.all([
            this.prisma.auditLog.findMany({
                where,
                include: {
                    actor: {
                        select: { id: true, email: true, firstName: true, lastName: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.auditLog.count({ where }),
        ]);
        return { logs, total };
    }
    async cleanupOldAuditLogs(daysToKeep = 180) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
        const result = await this.prisma.auditLog.deleteMany({
            where: { createdAt: { lt: cutoffDate } },
        });
        this.logger.log(`Cleaned up ${result.count} old audit logs`);
        return { deleted: result.count };
    }
    async cleanupOldData() {
        const auditResult = await this.cleanupOldAuditLogs(180);
        return {
            message: 'Cleanup completed successfully',
            details: { auditLogsDeleted: auditResult.deleted },
        };
    }
    async getAllCourses(params) {
        const { page = 1, limit = 20, isActive } = params;
        const skip = (page - 1) * limit;
        const where = {};
        if (isActive !== undefined)
            where.isActive = isActive;
        const [courses, total] = await Promise.all([
            this.prisma.course.findMany({
                where,
                include: {
                    _count: { select: { classes: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.course.count({ where }),
        ]);
        return { courses, total };
    }
    async getAllClasses(params) {
        const { page = 1, limit = 20 } = params;
        const skip = (page - 1) * limit;
        const [classes, total] = await Promise.all([
            this.prisma.class.findMany({
                include: {
                    course: true,
                    teacher: { select: { id: true, email: true, firstName: true, lastName: true } },
                    _count: { select: { enrollments: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.class.count(),
        ]);
        return { classes, total };
    }
    async toggleCourseStatus(courseId, isActive, actorId) {
        const course = await this.prisma.course.findUnique({ where: { id: courseId } });
        if (!course)
            throw new common_1.NotFoundException('Course not found');
        const updatedCourse = await this.prisma.course.update({
            where: { id: courseId },
            data: { isActive, updatedAt: new Date() },
        });
        await this.prisma.auditLog.create({
            data: {
                actorId: actorId,
                action: isActive ? AuditAction.COURSE_ACTIVATE : AuditAction.COURSE_DEACTIVATE,
                targetId: courseId,
                metadata: { previousStatus: course.isActive, newStatus: isActive },
            },
        });
        return updatedCourse;
    }
    async getSystemSettings() {
        return {
            maintenanceMode: false,
            allowRegistration: true,
            requireApproval: true,
            maxFileSize: 10 * 1024 * 1024,
            allowedFileTypes: ['image/*', 'application/pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'],
            maxStoragePerUser: 1024 * 1024 * 1024,
        };
    }
    async updateSystemSettings(settings, actorId) {
        this.logger.log(`System settings updated by ${actorId}`, settings);
        await this.prisma.auditLog.create({
            data: {
                actorId: actorId,
                action: AuditAction.SETTINGS_UPDATE,
                targetId: 'system',
                metadata: settings,
            },
        });
        return settings;
    }
    async getDashboardSummary() {
        const [metrics, timeline, recentAuditLogs, pendingApprovals] = await Promise.all([
            this.getSystemMetrics(),
            this.getActivityTimeline('14'),
            this.prisma.auditLog.findMany({
                take: 10,
                orderBy: { createdAt: 'desc' },
                include: {
                    actor: {
                        select: { id: true, email: true, firstName: true, lastName: true },
                    },
                },
            }),
            this.prisma.user.count({ where: { status: UserStatus.PENDING } }),
        ]);
        return {
            metrics,
            timeline,
            recentActivity: recentAuditLogs,
            pendingApprovals,
        };
    }
    async inviteUser(dto, actorId) {
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email.toLowerCase() },
        });
        if (existingUser) {
            throw new common_1.BadRequestException('User with this email already exists');
        }
        const tempPassword = crypto.randomBytes(8).toString('hex');
        const hashedPassword = await this.hashPassword(tempPassword);
        const role = await this.prisma.role.findUnique({
            where: { name: dto.role },
        });
        if (!role) {
            throw new common_1.BadRequestException(`Role '${dto.role}' not found`);
        }
        const user = await this.prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: {
                    email: dto.email.toLowerCase(),
                    firstName: dto.firstName,
                    lastName: dto.lastName,
                    phone: dto.phone,
                    passwordHash: hashedPassword,
                    status: UserStatus.ACTIVE,
                },
            });
            await tx.userRole.create({
                data: {
                    userId: newUser.id,
                    roleId: role.id,
                },
            });
            if (dto.role === 'student' && dto.parentId) {
                await tx.parentStudent.create({
                    data: {
                        parentId: dto.parentId,
                        studentId: newUser.id,
                    },
                });
            }
            if (dto.role === 'parent' && dto.childIds && dto.childIds.length > 0) {
                await tx.parentStudent.createMany({
                    data: dto.childIds.map(childId => ({
                        parentId: newUser.id,
                        studentId: childId,
                    })),
                });
            }
            if (dto.role === 'student' && dto.classIds && dto.classIds.length > 0) {
                await tx.classEnrollment.createMany({
                    data: dto.classIds.map(classId => ({
                        studentId: newUser.id,
                        classId: classId,
                        status: 'active',
                    })),
                });
            }
            return newUser;
        });
        await this.prisma.auditLog.create({
            data: {
                actorId: actorId,
                action: AuditAction.USER_APPROVE,
                targetId: user.id,
                metadata: {
                    invitedBy: actorId,
                    role: dto.role,
                    tempPassword: tempPassword
                },
            },
        });
        this.logger.log(`User invited by ${actorId}: ${dto.email} (${dto.role})`);
        return { ...user, tempPassword };
    }
    async bulkInviteUsers(dto, actorId) {
        const results = [];
        let success = 0;
        let failed = 0;
        for (const userDto of dto.users) {
            try {
                const user = await this.inviteUser(userDto, actorId);
                results.push({ success: true, email: userDto.email, user });
                success++;
            }
            catch (err) {
                results.push({ success: false, email: userDto.email, error: err.message });
                failed++;
            }
        }
        this.logger.log(`Bulk invite completed by ${actorId}: ${success} succeeded, ${failed} failed`);
        return { success, failed, results };
    }
    async resetPassword(userId, actorId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const tempPassword = crypto.randomBytes(8).toString('hex');
        const hashedPassword = await this.hashPassword(tempPassword);
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                passwordHash: hashedPassword,
                updatedAt: new Date()
            },
        });
        await this.prisma.auditLog.create({
            data: {
                actorId: actorId,
                action: AuditAction.USER_UPDATE,
                targetId: userId,
                metadata: { action: 'password_reset' },
            },
        });
        this.logger.log(`Password reset for user ${userId} by ${actorId}`);
        return { tempPassword };
    }
    async hashPassword(password) {
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
        return `${salt}:${hash}`;
    }
    async getTeacherClassAllocations(teacherId, classId) {
        const where = {};
        if (teacherId)
            where.teacherId = teacherId;
        if (classId)
            where.classId = classId;
        return this.prisma.classTeacher.findMany({
            where,
            include: {
                teacher: {
                    select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
                },
                class: {
                    include: {
                        course: { select: { id: true, name: true, code: true } },
                    },
                },
            },
            orderBy: { assignedAt: 'desc' },
        });
    }
    async assignTeacherToClass(dto, adminId) {
        const teacher = await this.prisma.user.findFirst({
            where: {
                id: dto.teacherId,
                userRoles: { some: { role: { name: 'teacher' } } },
            },
        });
        if (!teacher)
            throw new common_1.NotFoundException('Teacher not found');
        const classExists = await this.prisma.class.findUnique({
            where: { id: dto.classId },
        });
        if (!classExists)
            throw new common_1.NotFoundException('Class not found');
        const existing = await this.prisma.classTeacher.findUnique({
            where: {
                classId_teacherId: { classId: dto.classId, teacherId: dto.teacherId },
            },
        });
        if (existing)
            throw new common_1.BadRequestException('Teacher is already assigned to this class');
        if (dto.isPrimary) {
            await this.prisma.classTeacher.updateMany({
                where: { classId: dto.classId, isPrimary: true },
                data: { isPrimary: false },
            });
        }
        const assignment = await this.prisma.classTeacher.create({
            data: {
                classId: dto.classId,
                teacherId: dto.teacherId,
                isPrimary: dto.isPrimary || false,
                assignedBy: adminId,
            },
            include: {
                teacher: {
                    select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
                },
                class: {
                    include: {
                        course: { select: { id: true, name: true, code: true } },
                    },
                },
            },
        });
        await this.prisma.auditLog.create({
            data: {
                actorId: adminId,
                action: AuditAction.USER_UPDATE,
                targetId: dto.teacherId,
                metadata: { action: 'assign_teacher_to_class', classId: dto.classId },
            },
        });
        this.logger.log(`Teacher ${dto.teacherId} assigned to class ${dto.classId} by ${adminId}`);
        return assignment;
    }
    async removeTeacherFromClass(assignmentId) {
        const assignment = await this.prisma.classTeacher.findUnique({
            where: { id: assignmentId },
        });
        if (!assignment)
            throw new common_1.NotFoundException('Assignment not found');
        await this.prisma.classTeacher.delete({
            where: { id: assignmentId },
        });
        this.logger.log(`Teacher ${assignment.teacherId} removed from class ${assignment.classId}`);
        return { deleted: true };
    }
    async getTeachersWithClasses() {
        const teachers = await this.prisma.user.findMany({
            where: {
                userRoles: { some: { role: { name: 'teacher' } } },
                status: 'active',
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatarUrl: true,
                classAssignments: {
                    include: {
                        class: {
                            include: {
                                course: { select: { id: true, name: true, code: true } },
                            },
                        },
                    },
                },
            },
            orderBy: { lastName: 'asc' },
        });
        return teachers.map(t => ({
            ...t,
            classCount: t.classAssignments.length,
            classes: t.classAssignments.map(ca => ({
                assignmentId: ca.id,
                isPrimary: ca.isPrimary,
                assignedAt: ca.assignedAt,
                ...ca.class,
            })),
        }));
    }
    async getClassesWithTeachers() {
        const classes = await this.prisma.class.findMany({
            where: { isActive: true },
            include: {
                course: { select: { id: true, name: true, code: true } },
                teachers: {
                    include: {
                        teacher: {
                            select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
                        },
                    },
                },
                _count: { select: { enrollments: true } },
            },
            orderBy: { term: 'desc' },
        });
        return classes.map(c => ({
            ...c,
            studentCount: c._count.enrollments,
            teacherCount: c.teachers.length,
            teachers: c.teachers.map(t => ({
                assignmentId: t.id,
                isPrimary: t.isPrimary,
                assignedAt: t.assignedAt,
                ...t.teacher,
            })),
        }));
    }
    async getClassComposition() {
        const classes = await this.prisma.class.findMany({
            where: { isActive: true },
            include: {
                course: { select: { id: true, name: true, code: true } },
                teacher: { select: { id: true, firstName: true, lastName: true } },
                enrollments: {
                    where: { status: 'active' },
                    include: {
                        student: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                avatarUrl: true,
                                gradeLevel: true,
                            },
                        },
                    },
                },
            },
            orderBy: [{ term: 'desc' }, { course: { name: 'asc' } }],
        });
        return classes.map(c => ({
            id: c.id,
            name: c.course.name,
            code: c.course.code,
            section: c.section,
            term: c.term,
            teacher: c.teacher ? `${c.teacher.firstName} ${c.teacher.lastName}` : null,
            maxStudents: c.maxStudents,
            students: c.enrollments.map(e => ({
                id: e.student.id,
                firstName: e.student.firstName,
                lastName: e.student.lastName,
                email: e.student.email,
                avatarUrl: e.student.avatarUrl,
                gradeLevel: e.student.gradeLevel,
                enrollmentId: e.id,
            })),
        }));
    }
    async getUnassignedStudents(term) {
        const studentRole = await this.prisma.role.findUnique({ where: { name: 'student' } });
        if (!studentRole)
            return [];
        const students = await this.prisma.user.findMany({
            where: {
                status: 'active',
                deletedAt: null,
                userRoles: { some: { roleId: studentRole.id } },
                enrollments: {
                    none: { status: 'active' },
                },
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatarUrl: true,
                gradeLevel: true,
            },
            orderBy: [{ gradeLevel: 'asc' }, { lastName: 'asc' }],
        });
        return students;
    }
    async enrollStudent(classId, studentId) {
        const existing = await this.prisma.classEnrollment.findUnique({
            where: { classId_studentId: { classId, studentId } },
        });
        if (existing) {
            if (existing.status === 'active') {
                throw new common_1.BadRequestException('Student is already enrolled in this class');
            }
            return this.prisma.classEnrollment.update({
                where: { id: existing.id },
                data: { status: 'active' },
            });
        }
        return this.prisma.classEnrollment.create({
            data: { classId, studentId, status: 'active' },
        });
    }
    async unenrollStudent(classId, studentId) {
        const enrollment = await this.prisma.classEnrollment.findUnique({
            where: { classId_studentId: { classId, studentId } },
        });
        if (!enrollment)
            throw new common_1.NotFoundException('Enrollment not found');
        return this.prisma.classEnrollment.update({
            where: { id: enrollment.id },
            data: { status: 'dropped' },
        });
    }
    async getAcademicYears() {
        return this.prisma.academicYear.findMany({
            orderBy: { startDate: 'desc' },
        });
    }
    async createAcademicYear(data) {
        return this.prisma.academicYear.create({
            data: {
                name: data.name,
                startDate: new Date(data.startDate),
                endDate: new Date(data.endDate),
                isCurrent: false,
            },
        });
    }
    async setCurrentAcademicYear(yearId) {
        await this.prisma.academicYear.updateMany({
            where: { isCurrent: true },
            data: { isCurrent: false },
        });
        return this.prisma.academicYear.update({
            where: { id: yearId },
            data: { isCurrent: true },
        });
    }
    async getPromotionPreview() {
        const studentRole = await this.prisma.role.findUnique({ where: { name: 'student' } });
        if (!studentRole)
            return { grades: [], total: 0 };
        const students = await this.prisma.user.findMany({
            where: {
                status: 'active',
                deletedAt: null,
                userRoles: { some: { roleId: studentRole.id } },
            },
            select: { id: true, gradeLevel: true, firstName: true, lastName: true },
        });
        const gradeMap = {};
        let noGrade = 0;
        for (const s of students) {
            if (!s.gradeLevel) {
                noGrade++;
                continue;
            }
            gradeMap[s.gradeLevel] = (gradeMap[s.gradeLevel] || 0) + 1;
        }
        const grades = Object.entries(gradeMap)
            .map(([grade, count]) => {
            const num = parseInt(grade.replace(/\D/g, ''), 10);
            const nextGrade = num >= 12 ? 'Graduated' : `Grade ${num + 1}`;
            return { currentGrade: grade, nextGrade, count, willGraduate: num >= 12 };
        })
            .sort((a, b) => {
            const aNum = parseInt(a.currentGrade.replace(/\D/g, ''), 10) || 0;
            const bNum = parseInt(b.currentGrade.replace(/\D/g, ''), 10) || 0;
            return aNum - bNum;
        });
        return { grades, noGrade, total: students.length };
    }
    async promoteAllStudents(actorId) {
        const studentRole = await this.prisma.role.findUnique({ where: { name: 'student' } });
        if (!studentRole)
            throw new common_1.NotFoundException('Student role not found');
        const students = await this.prisma.user.findMany({
            where: {
                status: 'active',
                deletedAt: null,
                userRoles: { some: { roleId: studentRole.id } },
                gradeLevel: { not: null },
            },
            select: { id: true, gradeLevel: true },
        });
        let promoted = 0;
        let graduated = 0;
        for (const s of students) {
            const num = parseInt(s.gradeLevel.replace(/\D/g, ''), 10);
            if (isNaN(num))
                continue;
            if (num >= 12) {
                await this.prisma.user.update({
                    where: { id: s.id },
                    data: { gradeLevel: 'Graduated', status: 'archived' },
                });
                graduated++;
            }
            else {
                await this.prisma.user.update({
                    where: { id: s.id },
                    data: { gradeLevel: `Grade ${num + 1}` },
                });
                promoted++;
            }
        }
        await this.prisma.classEnrollment.updateMany({
            where: { status: 'active' },
            data: { status: 'completed' },
        });
        await this.prisma.auditLog.create({
            data: {
                actorId,
                action: 'promote_students',
                metadata: { promoted, graduated, total: students.length },
            },
        });
        this.logger.log(`Grade promotion by ${actorId}: ${promoted} promoted, ${graduated} graduated`);
        return { promoted, graduated, total: students.length };
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = AdminService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], AdminService);


/***/ }),
/* 114 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AdminController = void 0;
const common_1 = __webpack_require__(2);
const swagger_1 = __webpack_require__(3);
const admin_service_1 = __webpack_require__(113);
const jwt_auth_guard_1 = __webpack_require__(29);
const roles_guard_1 = __webpack_require__(32);
const roles_decorator_1 = __webpack_require__(33);
const admin_dto_1 = __webpack_require__(115);
const invite_user_dto_1 = __webpack_require__(116);
const create_user_dto_1 = __webpack_require__(117);
const update_user_dto_1 = __webpack_require__(118);
let AdminController = class AdminController {
    constructor(adminService) {
        this.adminService = adminService;
    }
    async getMetrics(range = admin_dto_1.TimeRange.WEEK) {
        return this.adminService.getSystemMetrics();
    }
    async getTimeline(range = admin_dto_1.TimeRange.WEEK) {
        return this.adminService.getActivityTimeline(range);
    }
    async getRealTimeStats() {
        return this.adminService.getRealTimeStats();
    }
    async getUsers(search, role, status, page, limit) {
        return this.adminService.getUsers({ search, role, status, page, limit });
    }
    async updateUserStatus(userId, dto, req) {
        return this.adminService.updateUserStatus(userId, dto, req.user.sub);
    }
    async bulkAction(dto, req) {
        return this.adminService.bulkAction(dto, req.user.sub);
    }
    async inviteUser(dto, req) {
        return this.adminService.inviteUser(dto, req.user.sub);
    }
    async createUser(dto, req) {
        return this.adminService.createUser(dto, req.user.sub);
    }
    async linkParent(dto, req) {
        return this.adminService.linkParentToChild(dto, req.user.sub);
    }
    async bulkInviteUsers(dto, req) {
        return this.adminService.bulkInviteUsers(dto, req.user.sub);
    }
    async updateUser(userId, dto, req) {
        return this.adminService.updateUser(userId, dto, req.user.sub);
    }
    async deleteUser(userId, req) {
        return this.adminService.deleteUser(userId, req.user.sub);
    }
    async resetPassword(userId, req) {
        return this.adminService.resetPassword(userId, req.user.sub);
    }
    async getModerationQueue(page, limit) {
        return this.adminService.getModerationQueue(page, limit);
    }
    async getSystemSettings() {
        return this.adminService.getSystemSettings();
    }
    async updateSystemSettings(dto, req) {
        return this.adminService.updateSystemSettings(dto, req.user.sub);
    }
    async getAuditLogs(page, limit, action, actorId, startDate, endDate) {
        return this.adminService.getAuditLogs(page, limit, { action, actorId, startDate, endDate });
    }
    async triggerCleanup(req) {
        await this.adminService.cleanupOldData();
        return { message: 'Cleanup job triggered successfully' };
    }
    async getTeacherClassAllocations(teacherId, classId) {
        return this.adminService.getTeacherClassAllocations(teacherId, classId);
    }
    async assignTeacherToClass(dto, req) {
        return this.adminService.assignTeacherToClass(dto, req.user.sub);
    }
    async removeTeacherFromClass(id) {
        return this.adminService.removeTeacherFromClass(id);
    }
    async getTeachersWithClasses() {
        return this.adminService.getTeachersWithClasses();
    }
    async getClassesWithTeachers() {
        return this.adminService.getClassesWithTeachers();
    }
    async getClassComposition() {
        return this.adminService.getClassComposition();
    }
    async getUnassignedStudents() {
        return this.adminService.getUnassignedStudents();
    }
    async enrollStudent(classId, body) {
        return this.adminService.enrollStudent(classId, body.studentId);
    }
    async unenrollStudent(classId, studentId) {
        return this.adminService.unenrollStudent(classId, studentId);
    }
    async getAcademicYears() {
        return this.adminService.getAcademicYears();
    }
    async createAcademicYear(body) {
        return this.adminService.createAcademicYear(body);
    }
    async setCurrentAcademicYear(id) {
        return this.adminService.setCurrentAcademicYear(id);
    }
    async getPromotionPreview() {
        return this.adminService.getPromotionPreview();
    }
    async promoteAllStudents(req) {
        return this.adminService.promoteAllStudents(req.user.sub);
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('dashboard/metrics'),
    (0, swagger_1.ApiOperation)({ summary: 'Get system-wide metrics for dashboard' }),
    (0, swagger_1.ApiQuery)({ name: 'range', required: false, enum: admin_dto_1.TimeRange }),
    __param(0, (0, common_1.Query)('range')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof admin_dto_1.TimeRange !== "undefined" && admin_dto_1.TimeRange) === "function" ? _b : Object]),
    __metadata("design:returntype", typeof (_c = typeof Promise !== "undefined" && Promise) === "function" ? _c : Object)
], AdminController.prototype, "getMetrics", null);
__decorate([
    (0, common_1.Get)('dashboard/timeline'),
    (0, swagger_1.ApiOperation)({ summary: 'Get activity timeline data for charts' }),
    (0, swagger_1.ApiQuery)({ name: 'range', required: false, enum: admin_dto_1.TimeRange }),
    __param(0, (0, common_1.Query)('range')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_d = typeof admin_dto_1.TimeRange !== "undefined" && admin_dto_1.TimeRange) === "function" ? _d : Object]),
    __metadata("design:returntype", typeof (_e = typeof Promise !== "undefined" && Promise) === "function" ? _e : Object)
], AdminController.prototype, "getTimeline", null);
__decorate([
    (0, common_1.Get)('dashboard/realtime'),
    (0, swagger_1.ApiOperation)({ summary: 'Get real-time statistics' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", typeof (_f = typeof Promise !== "undefined" && Promise) === "function" ? _f : Object)
], AdminController.prototype, "getRealTimeStats", null);
__decorate([
    (0, common_1.Get)('users'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all users with filtering and pagination' }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'role', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    __param(0, (0, common_1.Query)('search')),
    __param(1, (0, common_1.Query)('role')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('page', new common_1.DefaultValuePipe(1), common_1.ParseIntPipe)),
    __param(4, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(20), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getUsers", null);
__decorate([
    (0, common_1.Put)('users/:id/status'),
    (0, swagger_1.ApiOperation)({ summary: 'Update user status (activate, suspend, archive, delete)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_g = typeof admin_dto_1.UpdateUserStatusDto !== "undefined" && admin_dto_1.UpdateUserStatusDto) === "function" ? _g : Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateUserStatus", null);
__decorate([
    (0, common_1.Post)('users/bulk-action'),
    (0, swagger_1.ApiOperation)({ summary: 'Perform bulk action on multiple users' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_h = typeof admin_dto_1.BulkActionDto !== "undefined" && admin_dto_1.BulkActionDto) === "function" ? _h : Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "bulkAction", null);
__decorate([
    (0, common_1.Post)('users/invite'),
    (0, swagger_1.ApiOperation)({ summary: 'Invite a new user' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_j = typeof invite_user_dto_1.InviteUserDto !== "undefined" && invite_user_dto_1.InviteUserDto) === "function" ? _j : Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "inviteUser", null);
__decorate([
    (0, common_1.Post)('users/create'),
    (0, swagger_1.ApiOperation)({ summary: 'Manually create a new user (Admin function)' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_k = typeof create_user_dto_1.CreateUserDto !== "undefined" && create_user_dto_1.CreateUserDto) === "function" ? _k : Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createUser", null);
__decorate([
    (0, common_1.Post)('users/link-parent'),
    (0, swagger_1.ApiOperation)({ summary: 'Link a parent to a student' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_l = typeof create_user_dto_1.LinkParentDto !== "undefined" && create_user_dto_1.LinkParentDto) === "function" ? _l : Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "linkParent", null);
__decorate([
    (0, common_1.Post)('users/bulk-invite'),
    (0, swagger_1.ApiOperation)({ summary: 'Bulk invite multiple users' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_m = typeof invite_user_dto_1.BulkInviteUserDto !== "undefined" && invite_user_dto_1.BulkInviteUserDto) === "function" ? _m : Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "bulkInviteUsers", null);
__decorate([
    (0, common_1.Put)('users/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update user details' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_o = typeof update_user_dto_1.UpdateUserDto !== "undefined" && update_user_dto_1.UpdateUserDto) === "function" ? _o : Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateUser", null);
__decorate([
    (0, common_1.Delete)('users/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a user permanently' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteUser", null);
__decorate([
    (0, common_1.Post)('users/:id/reset-password'),
    (0, swagger_1.ApiOperation)({ summary: 'Reset user password' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "resetPassword", null);
__decorate([
    (0, common_1.Get)('moderation/queue'),
    (0, swagger_1.ApiOperation)({ summary: 'Get content moderation queue' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    __param(0, (0, common_1.Query)('page', new common_1.DefaultValuePipe(1), common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(20), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getModerationQueue", null);
__decorate([
    (0, common_1.Get)('settings'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current system settings' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getSystemSettings", null);
__decorate([
    (0, common_1.Put)('settings'),
    (0, swagger_1.ApiOperation)({ summary: 'Update system settings' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_p = typeof admin_dto_1.SystemSettingsDto !== "undefined" && admin_dto_1.SystemSettingsDto) === "function" ? _p : Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateSystemSettings", null);
__decorate([
    (0, common_1.Get)('audit-logs'),
    (0, swagger_1.ApiOperation)({ summary: 'Get system audit logs' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'action', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'actorId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: false }),
    __param(0, (0, common_1.Query)('page', new common_1.DefaultValuePipe(1), common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(50), common_1.ParseIntPipe)),
    __param(2, (0, common_1.Query)('action')),
    __param(3, (0, common_1.Query)('actorId')),
    __param(4, (0, common_1.Query)('startDate')),
    __param(5, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String, String, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAuditLogs", null);
__decorate([
    (0, common_1.Post)('tasks/cleanup'),
    (0, swagger_1.ApiOperation)({ summary: 'Trigger manual cleanup of old data' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "triggerCleanup", null);
__decorate([
    (0, common_1.Get)('teacher-class-allocations'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all teacher-class allocations' }),
    __param(0, (0, common_1.Query)('teacherId')),
    __param(1, (0, common_1.Query)('classId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getTeacherClassAllocations", null);
__decorate([
    (0, common_1.Post)('teacher-class-allocations'),
    (0, swagger_1.ApiOperation)({ summary: 'Assign a teacher to a class' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "assignTeacherToClass", null);
__decorate([
    (0, common_1.Delete)('teacher-class-allocations/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Remove a teacher from a class' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "removeTeacherFromClass", null);
__decorate([
    (0, common_1.Get)('teachers/available'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all teachers with their class assignments' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getTeachersWithClasses", null);
__decorate([
    (0, common_1.Get)('classes/with-teachers'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all classes with their assigned teachers' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getClassesWithTeachers", null);
__decorate([
    (0, common_1.Get)('classes/composition'),
    (0, swagger_1.ApiOperation)({ summary: 'Get class composition with enrolled students' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getClassComposition", null);
__decorate([
    (0, common_1.Get)('students/unassigned'),
    (0, swagger_1.ApiOperation)({ summary: 'Get students not enrolled in any class' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getUnassignedStudents", null);
__decorate([
    (0, common_1.Post)('classes/:classId/enroll'),
    (0, swagger_1.ApiOperation)({ summary: 'Enroll a student in a class' }),
    __param(0, (0, common_1.Param)('classId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "enrollStudent", null);
__decorate([
    (0, common_1.Delete)('classes/:classId/unenroll/:studentId'),
    (0, swagger_1.ApiOperation)({ summary: 'Remove a student from a class' }),
    __param(0, (0, common_1.Param)('classId')),
    __param(1, (0, common_1.Param)('studentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "unenrollStudent", null);
__decorate([
    (0, common_1.Get)('academic-years'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all academic years' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAcademicYears", null);
__decorate([
    (0, common_1.Post)('academic-years'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new academic year' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createAcademicYear", null);
__decorate([
    (0, common_1.Patch)('academic-years/:id/set-current'),
    (0, swagger_1.ApiOperation)({ summary: 'Set an academic year as current' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "setCurrentAcademicYear", null);
__decorate([
    (0, common_1.Get)('promotion/preview'),
    (0, swagger_1.ApiOperation)({ summary: 'Preview grade promotion results' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getPromotionPreview", null);
__decorate([
    (0, common_1.Post)('promotion/execute'),
    (0, swagger_1.ApiOperation)({ summary: 'Execute grade promotion for all students' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "promoteAllStudents", null);
exports.AdminController = AdminController = __decorate([
    (0, swagger_1.ApiTags)('Admin Dashboard'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __metadata("design:paramtypes", [typeof (_a = typeof admin_service_1.AdminService !== "undefined" && admin_service_1.AdminService) === "function" ? _a : Object])
], AdminController);


/***/ }),
/* 115 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SystemSettingsDto = exports.BulkActionDto = exports.UpdateUserStatusDto = exports.UserManagementQueryDto = exports.DashboardStatsQueryDto = exports.UserStatusAction = exports.TimeRange = void 0;
const class_validator_1 = __webpack_require__(23);
const class_transformer_1 = __webpack_require__(26);
const sanitize_decorator_1 = __webpack_require__(24);
var TimeRange;
(function (TimeRange) {
    TimeRange["TODAY"] = "today";
    TimeRange["WEEK"] = "week";
    TimeRange["MONTH"] = "month";
    TimeRange["QUARTER"] = "quarter";
    TimeRange["YEAR"] = "year";
})(TimeRange || (exports.TimeRange = TimeRange = {}));
var UserStatusAction;
(function (UserStatusAction) {
    UserStatusAction["ACTIVATE"] = "activate";
    UserStatusAction["SUSPEND"] = "suspend";
    UserStatusAction["ARCHIVE"] = "archive";
    UserStatusAction["DELETE"] = "delete";
})(UserStatusAction || (exports.UserStatusAction = UserStatusAction = {}));
class DashboardStatsQueryDto {
    constructor() {
        this.range = TimeRange.WEEK;
    }
}
exports.DashboardStatsQueryDto = DashboardStatsQueryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(TimeRange),
    __metadata("design:type", String)
], DashboardStatsQueryDto.prototype, "range", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], DashboardStatsQueryDto.prototype, "startDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], DashboardStatsQueryDto.prototype, "endDate", void 0);
class UserManagementQueryDto {
    constructor() {
        this.page = 1;
        this.limit = 20;
    }
}
exports.UserManagementQueryDto = UserManagementQueryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, sanitize_decorator_1.SanitizePlainText)(),
    __metadata("design:type", String)
], UserManagementQueryDto.prototype, "search", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, sanitize_decorator_1.SanitizePlainText)(),
    __metadata("design:type", String)
], UserManagementQueryDto.prototype, "role", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, sanitize_decorator_1.SanitizePlainText)(),
    __metadata("design:type", String)
], UserManagementQueryDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], UserManagementQueryDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], UserManagementQueryDto.prototype, "limit", void 0);
class UpdateUserStatusDto {
}
exports.UpdateUserStatusDto = UpdateUserStatusDto;
__decorate([
    (0, class_validator_1.IsEnum)(UserStatusAction),
    __metadata("design:type", String)
], UpdateUserStatusDto.prototype, "action", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, sanitize_decorator_1.SanitizePlainText)(),
    __metadata("design:type", String)
], UpdateUserStatusDto.prototype, "reason", void 0);
class BulkActionDto {
}
exports.BulkActionDto = BulkActionDto;
__decorate([
    (0, class_validator_1.IsEnum)(UserStatusAction),
    __metadata("design:type", String)
], BulkActionDto.prototype, "action", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)('4', { each: true, message: 'Each user ID must be a valid UUID' }),
    __metadata("design:type", Array)
], BulkActionDto.prototype, "userIds", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, sanitize_decorator_1.SanitizePlainText)(),
    __metadata("design:type", String)
], BulkActionDto.prototype, "reason", void 0);
class SystemSettingsDto {
}
exports.SystemSettingsDto = SystemSettingsDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], SystemSettingsDto.prototype, "maxFileSize", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], SystemSettingsDto.prototype, "maxMessageLength", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SystemSettingsDto.prototype, "maintenanceMode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, sanitize_decorator_1.SanitizePlainText)(),
    __metadata("design:type", String)
], SystemSettingsDto.prototype, "maintenanceMessage", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], SystemSettingsDto.prototype, "rateLimitRequests", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], SystemSettingsDto.prototype, "rateLimitWindow", void 0);


/***/ }),
/* 116 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BulkInviteUserDto = exports.InviteUserDto = void 0;
const class_validator_1 = __webpack_require__(23);
const sanitize_decorator_1 = __webpack_require__(24);
class InviteUserDto {
}
exports.InviteUserDto = InviteUserDto;
__decorate([
    (0, class_validator_1.IsEmail)(),
    (0, sanitize_decorator_1.SanitizePlainText)(),
    __metadata("design:type", String)
], InviteUserDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'First name is required' }),
    (0, class_validator_1.MaxLength)(100),
    (0, sanitize_decorator_1.SanitizePlainText)(),
    __metadata("design:type", String)
], InviteUserDto.prototype, "firstName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Last name is required' }),
    (0, class_validator_1.MaxLength)(100),
    (0, sanitize_decorator_1.SanitizePlainText)(),
    __metadata("design:type", String)
], InviteUserDto.prototype, "lastName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['admin', 'teacher', 'parent', 'student']),
    __metadata("design:type", String)
], InviteUserDto.prototype, "role", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(20),
    (0, sanitize_decorator_1.SanitizePlainText)(),
    __metadata("design:type", String)
], InviteUserDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], InviteUserDto.prototype, "classIds", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InviteUserDto.prototype, "parentId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], InviteUserDto.prototype, "childIds", void 0);
class BulkInviteUserDto {
}
exports.BulkInviteUserDto = BulkInviteUserDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], BulkInviteUserDto.prototype, "users", void 0);


/***/ }),
/* 117 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.LinkParentDto = exports.CreateUserDto = exports.UserRole = void 0;
const class_validator_1 = __webpack_require__(23);
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "admin";
    UserRole["TEACHER"] = "teacher";
    UserRole["PARENT"] = "parent";
    UserRole["STUDENT"] = "student";
})(UserRole || (exports.UserRole = UserRole = {}));
class CreateUserDto {
}
exports.CreateUserDto = CreateUserDto;
__decorate([
    (0, class_validator_1.IsEmail)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "firstName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "lastName", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(UserRole),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "role", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "password", void 0);
class LinkParentDto {
}
exports.LinkParentDto = LinkParentDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], LinkParentDto.prototype, "parentId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], LinkParentDto.prototype, "studentId", void 0);


/***/ }),
/* 118 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UpdateUserDto = void 0;
const class_validator_1 = __webpack_require__(23);
const sanitize_decorator_1 = __webpack_require__(24);
class UpdateUserDto {
}
exports.UpdateUserDto = UpdateUserDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)(),
    (0, sanitize_decorator_1.SanitizePlainText)(),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    (0, sanitize_decorator_1.SanitizePlainText)(),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "firstName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    (0, sanitize_decorator_1.SanitizePlainText)(),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "lastName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(20),
    (0, sanitize_decorator_1.SanitizePlainText)(),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['active', 'suspended', 'pending']),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, sanitize_decorator_1.SanitizePlainText)(),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "avatarUrl", void 0);


/***/ }),
/* 119 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AdminGateway_1;
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AdminGateway = void 0;
const websockets_1 = __webpack_require__(56);
const socket_io_1 = __webpack_require__(57);
const common_1 = __webpack_require__(2);
const jwt_1 = __webpack_require__(13);
const config_1 = __webpack_require__(5);
const redis_1 = __webpack_require__(42);
const redis_adapter_1 = __webpack_require__(58);
const admin_service_1 = __webpack_require__(113);
const schedule_1 = __webpack_require__(8);
const ioredis_1 = __webpack_require__(21);
let AdminGateway = AdminGateway_1 = class AdminGateway {
    constructor(jwtService, configService, adminService) {
        this.jwtService = jwtService;
        this.configService = configService;
        this.adminService = adminService;
        this.logger = new common_1.Logger(AdminGateway_1.name);
        this.adminSockets = new Map();
        this.RATE_LIMITS = {
            'dashboard:refresh': { max: 30, windowMs: 60 },
            'dashboard:subscribe': { max: 10, windowMs: 60 },
            'users:subscribe': { max: 10, windowMs: 60 },
            'moderation:subscribe': { max: 10, windowMs: 60 },
        };
    }
    async afterInit(server) {
        this.logger.log('Admin WebSocket Gateway initializing...');
        const redisUrl = this.configService.get('REDIS_URL');
        if (!redisUrl) {
            throw new Error('REDIS_URL environment variable is required');
        }
        try {
            this.redisClient = (0, redis_1.createClient)({ url: redisUrl });
            const pubClient = this.redisClient;
            const subClient = pubClient.duplicate();
            server.adapter = (0, redis_adapter_1.createAdapter)(pubClient, subClient);
            this.logger.log('✅ Redis adapter configured for admin broadcasts');
        }
        catch (error) {
            this.logger.error('❌ Failed to configure Redis adapter:', error.message);
            throw error;
        }
        this.rateLimitRedis = new ioredis_1.Redis(redisUrl);
        this.rateLimitRedis.on('error', (err) => {
            this.logger.error('Rate-limit Redis error:', err.message);
        });
    }
    async handleConnection(client) {
        try {
            const token = client.handshake.auth?.token || client.handshake.query?.token;
            if (!token) {
                this.logger.warn(`Connection rejected: No token provided (${client.id})`);
                client.disconnect();
                return;
            }
            const secret = this.configService.get('JWT_SECRET');
            if (!secret) {
                throw new Error('JWT_SECRET not configured');
            }
            const payload = this.jwtService.verify(token, { secret });
            if (!payload.roles?.includes('admin')) {
                this.logger.warn(`Non-admin user ${payload.sub} tried to connect to admin namespace`);
                client.disconnect();
                return;
            }
            client.user = payload;
            this.adminSockets.set(client.id, client);
            const metrics = await this.adminService.getSystemMetrics();
            client.emit('dashboard:metrics', metrics);
            client.join('admin-dashboard');
            this.logger.log(`Admin ${payload.email} connected to dashboard (${client.id})`);
        }
        catch (err) {
            this.logger.error('Admin WS auth failed:', err.message);
            client.disconnect();
        }
    }
    handleDisconnect(client) {
        this.adminSockets.delete(client.id);
        if (client.user) {
            this.logger.log(`Admin ${client.user.email} disconnected from dashboard`);
        }
    }
    async checkRateLimit(userId, event) {
        const limits = this.RATE_LIMITS[event];
        if (!limits)
            return true;
        const key = `admin:rl:${userId}:${event}`;
        try {
            const current = await this.rateLimitRedis.incr(key);
            if (current === 1) {
                await this.rateLimitRedis.expire(key, limits.windowMs);
            }
            return current <= limits.max;
        }
        catch (err) {
            this.logger.warn(`Rate limit Redis unavailable for ${event}: ${err.message}`);
            return true;
        }
    }
    cleanupDisconnectedSockets() {
        let removed = 0;
        for (const [id, socket] of this.adminSockets.entries()) {
            if (!socket.connected) {
                this.adminSockets.delete(id);
                removed++;
            }
        }
        if (removed > 0) {
            this.logger.debug(`Cleaned up ${removed} stale admin socket(s)`);
        }
    }
    async handleSubscribe(client) {
        if (!client.user)
            return { error: 'Not authenticated' };
        if (!await this.checkRateLimit(client.user.sub, 'dashboard:subscribe')) {
            return { error: 'Rate limit exceeded' };
        }
        const metrics = await this.adminService.getSystemMetrics();
        client.emit('dashboard:metrics', metrics);
        return { success: true };
    }
    async handleRefresh(client) {
        if (!client.user)
            return { error: 'Not authenticated' };
        if (!await this.checkRateLimit(client.user.sub, 'dashboard:refresh')) {
            return { error: 'Rate limit exceeded. Please wait before refreshing.' };
        }
        try {
            const [metrics, realtime] = await Promise.all([
                this.adminService.getSystemMetrics(),
                this.adminService.getRealTimeStats(),
            ]);
            client.emit('dashboard:metrics', metrics);
            client.emit('dashboard:realtime', realtime);
            return { success: true };
        }
        catch (error) {
            this.logger.error('Failed to refresh dashboard:', error.message);
            return { error: 'Failed to refresh data' };
        }
    }
    async handleUsersSubscribe(client) {
        if (!client.user)
            return { error: 'Not authenticated' };
        if (!await this.checkRateLimit(client.user.sub, 'users:subscribe')) {
            return { error: 'Rate limit exceeded' };
        }
        client.join('admin-users');
        return { success: true };
    }
    async handleModerationSubscribe(client) {
        if (!client.user)
            return { error: 'Not authenticated' };
        if (!await this.checkRateLimit(client.user.sub, 'moderation:subscribe')) {
            return { error: 'Rate limit exceeded' };
        }
        client.join('admin-moderation');
        return { success: true };
    }
    async broadcastMetrics() {
        try {
            const metrics = await this.adminService.getSystemMetrics();
            this.server.to('admin-dashboard').emit('dashboard:metrics', metrics);
        }
        catch (error) {
            this.logger.error('Failed to broadcast metrics:', error.message);
        }
    }
    async broadcastRealTimeStats() {
        try {
            const stats = await this.adminService.getRealTimeStats();
            this.server.to('admin-dashboard').emit('dashboard:realtime', stats);
        }
        catch (error) {
            this.logger.error('Failed to broadcast realtime stats:', error.message);
        }
    }
    broadcastNewUser(user) {
        this.server.to('admin-dashboard').emit('user:new', {
            user,
            timestamp: new Date().toISOString(),
        });
    }
    broadcastUserStatusChange(userId, status, actorId) {
        this.server.to('admin-dashboard').emit('user:status-change', {
            userId,
            status,
            actorId,
            timestamp: new Date().toISOString(),
        });
    }
    broadcastNewMessage(message) {
        this.server.to('admin-moderation').emit('message:new', {
            message,
            timestamp: new Date().toISOString(),
        });
    }
    broadcastFlaggedContent(content) {
        this.server.to('admin-moderation').emit('content:flagged', {
            content,
            timestamp: new Date().toISOString(),
        });
    }
    broadcastSystemAlert(alert) {
        this.server.to('admin-dashboard').emit('system:alert', {
            ...alert,
            timestamp: new Date().toISOString(),
        });
    }
    async scheduledRealTimeUpdate() {
        if (this.adminSockets.size > 0) {
            await this.broadcastRealTimeStats();
        }
    }
    async scheduledMetricsUpdate() {
        if (this.adminSockets.size > 0) {
            await this.broadcastMetrics();
        }
    }
    getConnectedAdminCount() {
        return this.adminSockets.size;
    }
    getConnectedAdmins() {
        return Array.from(this.adminSockets.values()).map(socket => ({
            id: socket.user.sub,
            email: socket.user.email,
        }));
    }
};
exports.AdminGateway = AdminGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", typeof (_d = typeof socket_io_1.Server !== "undefined" && socket_io_1.Server) === "function" ? _d : Object)
], AdminGateway.prototype, "server", void 0);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_MINUTE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminGateway.prototype, "cleanupDisconnectedSockets", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('dashboard:subscribe'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminGateway.prototype, "handleSubscribe", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('dashboard:refresh'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminGateway.prototype, "handleRefresh", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('users:subscribe'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminGateway.prototype, "handleUsersSubscribe", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('moderation:subscribe'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminGateway.prototype, "handleModerationSubscribe", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_30_SECONDS),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminGateway.prototype, "scheduledRealTimeUpdate", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_5_MINUTES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminGateway.prototype, "scheduledMetricsUpdate", null);
exports.AdminGateway = AdminGateway = AdminGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: (origin, callback) => {
                const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
                    'http://localhost:5173',
                    'http://localhost:4173',
                ];
                const isLocalhost = origin && /^http:\/\/localhost:\d+$/.test(origin);
                if (!origin || allowedOrigins.includes(origin) || isLocalhost) {
                    callback(null, true);
                }
                else {
                    callback(new Error('Not allowed by CORS'), false);
                }
            },
            credentials: true,
        },
        namespace: '/admin',
    }),
    __metadata("design:paramtypes", [typeof (_a = typeof jwt_1.JwtService !== "undefined" && jwt_1.JwtService) === "function" ? _a : Object, typeof (_b = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _b : Object, typeof (_c = typeof admin_service_1.AdminService !== "undefined" && admin_service_1.AdminService) === "function" ? _c : Object])
], AdminGateway);


/***/ }),
/* 120 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AnalyticsModule = void 0;
const common_1 = __webpack_require__(2);
const schedule_1 = __webpack_require__(8);
const analytics_controller_1 = __webpack_require__(121);
const analytics_service_1 = __webpack_require__(122);
const prisma_module_1 = __webpack_require__(9);
const redis_module_1 = __webpack_require__(124);
let AnalyticsModule = class AnalyticsModule {
};
exports.AnalyticsModule = AnalyticsModule;
exports.AnalyticsModule = AnalyticsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            redis_module_1.RedisModule,
            schedule_1.ScheduleModule.forRoot(),
        ],
        controllers: [analytics_controller_1.AnalyticsController],
        providers: [analytics_service_1.AnalyticsService],
        exports: [analytics_service_1.AnalyticsService],
    })
], AnalyticsModule);


/***/ }),
/* 121 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AnalyticsController = void 0;
const common_1 = __webpack_require__(2);
const swagger_1 = __webpack_require__(3);
const express_1 = __webpack_require__(16);
const analytics_service_1 = __webpack_require__(122);
const analytics_dto_1 = __webpack_require__(123);
const jwt_auth_guard_1 = __webpack_require__(29);
const roles_guard_1 = __webpack_require__(32);
const roles_decorator_1 = __webpack_require__(33);
let AnalyticsController = class AnalyticsController {
    constructor(analyticsService) {
        this.analyticsService = analyticsService;
    }
    async getDashboardStats() {
        return this.analyticsService.getDashboardStats();
    }
    async getUserActivity(query) {
        return this.analyticsService.getUserActivity(query.range || analytics_dto_1.TimeRange.THIRTY_DAYS);
    }
    async getMessageStats(query) {
        return this.analyticsService.getMessageStats(query.range || analytics_dto_1.TimeRange.THIRTY_DAYS);
    }
    async getChannelStats() {
        return this.analyticsService.getChannelStats();
    }
    async getFileStorageStats() {
        return this.analyticsService.getFileStorageStats();
    }
    async getEngagementMetrics() {
        return this.analyticsService.getEngagementMetrics();
    }
    async exportReport(query, res) {
        const result = await this.analyticsService.exportReport(query.type, (query.format || 'csv'));
        const filename = `analytics-${query.type}-export.${query.format}`;
        const contentType = query.format === 'csv'
            ? 'text/csv'
            : 'application/json';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(result);
    }
    async getHealth() {
        return {
            status: 'healthy',
            timestamp: new Date().toISOString(),
        };
    }
};
exports.AnalyticsController = AnalyticsController;
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Get overall system dashboard statistics (Admin only)' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Dashboard statistics retrieved successfully',
        type: Object,
    }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.FORBIDDEN, description: 'Admin access required' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.UNAUTHORIZED, description: 'Unauthorized' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", typeof (_b = typeof Promise !== "undefined" && Promise) === "function" ? _b : Object)
], AnalyticsController.prototype, "getDashboardStats", null);
__decorate([
    (0, common_1.Get)('users'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user activity statistics over time' }),
    (0, swagger_1.ApiQuery)({
        name: 'range',
        required: false,
        description: 'Time range for analytics',
        enum: analytics_dto_1.TimeRange,
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'User activity statistics retrieved successfully',
        type: Object,
    }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.UNAUTHORIZED, description: 'Unauthorized' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_c = typeof analytics_dto_1.TimeRangeQueryDto !== "undefined" && analytics_dto_1.TimeRangeQueryDto) === "function" ? _c : Object]),
    __metadata("design:returntype", typeof (_d = typeof Promise !== "undefined" && Promise) === "function" ? _d : Object)
], AnalyticsController.prototype, "getUserActivity", null);
__decorate([
    (0, common_1.Get)('messages'),
    (0, swagger_1.ApiOperation)({ summary: 'Get message statistics over time' }),
    (0, swagger_1.ApiQuery)({
        name: 'range',
        required: false,
        description: 'Time range for analytics',
        enum: analytics_dto_1.TimeRange,
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Message statistics retrieved successfully',
        type: Object,
    }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.UNAUTHORIZED, description: 'Unauthorized' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_e = typeof analytics_dto_1.TimeRangeQueryDto !== "undefined" && analytics_dto_1.TimeRangeQueryDto) === "function" ? _e : Object]),
    __metadata("design:returntype", typeof (_f = typeof Promise !== "undefined" && Promise) === "function" ? _f : Object)
], AnalyticsController.prototype, "getMessageStats", null);
__decorate([
    (0, common_1.Get)('channels'),
    (0, swagger_1.ApiOperation)({ summary: 'Get channel statistics and popular channels' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Channel statistics retrieved successfully',
        type: Object,
    }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.UNAUTHORIZED, description: 'Unauthorized' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", typeof (_g = typeof Promise !== "undefined" && Promise) === "function" ? _g : Object)
], AnalyticsController.prototype, "getChannelStats", null);
__decorate([
    (0, common_1.Get)('files'),
    (0, swagger_1.ApiOperation)({ summary: 'Get file storage statistics by user and role' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'File storage statistics retrieved successfully',
        type: Object,
    }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.UNAUTHORIZED, description: 'Unauthorized' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", typeof (_h = typeof Promise !== "undefined" && Promise) === "function" ? _h : Object)
], AnalyticsController.prototype, "getFileStorageStats", null);
__decorate([
    (0, common_1.Get)('engagement'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user engagement metrics (DAU, WAU, MAU, retention)' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Engagement metrics retrieved successfully',
        type: Object,
    }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.UNAUTHORIZED, description: 'Unauthorized' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", typeof (_j = typeof Promise !== "undefined" && Promise) === "function" ? _j : Object)
], AnalyticsController.prototype, "getEngagementMetrics", null);
__decorate([
    (0, common_1.Get)('export'),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Export analytics data as CSV or PDF (Admin only)' }),
    (0, swagger_1.ApiQuery)({
        name: 'type',
        required: true,
        description: 'Type of data to export',
        enum: ['users', 'messages', 'grades'],
    }),
    (0, swagger_1.ApiQuery)({
        name: 'format',
        required: false,
        description: 'Export format',
        enum: ['csv', 'pdf'],
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Data exported successfully',
    }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.FORBIDDEN, description: 'Admin access required' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.UNAUTHORIZED, description: 'Unauthorized' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_k = typeof analytics_dto_1.ExportQueryDto !== "undefined" && analytics_dto_1.ExportQueryDto) === "function" ? _k : Object, typeof (_l = typeof express_1.Response !== "undefined" && express_1.Response) === "function" ? _l : Object]),
    __metadata("design:returntype", typeof (_m = typeof Promise !== "undefined" && Promise) === "function" ? _m : Object)
], AnalyticsController.prototype, "exportReport", null);
__decorate([
    (0, common_1.Get)('health'),
    (0, swagger_1.ApiOperation)({ summary: 'Check analytics service health and cache status' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Analytics service is healthy',
        type: Object,
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", typeof (_o = typeof Promise !== "undefined" && Promise) === "function" ? _o : Object)
], AnalyticsController.prototype, "getHealth", null);
exports.AnalyticsController = AnalyticsController = __decorate([
    (0, swagger_1.ApiTags)('Analytics'),
    (0, common_1.Controller)('analytics'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [typeof (_a = typeof analytics_service_1.AnalyticsService !== "undefined" && analytics_service_1.AnalyticsService) === "function" ? _a : Object])
], AnalyticsController);


/***/ }),
/* 122 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AnalyticsService_1;
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AnalyticsService = void 0;
const common_1 = __webpack_require__(2);
const prisma_service_1 = __webpack_require__(10);
const redis_service_1 = __webpack_require__(61);
const schedule_1 = __webpack_require__(8);
const analytics_dto_1 = __webpack_require__(123);
let AnalyticsService = AnalyticsService_1 = class AnalyticsService {
    constructor(prisma, redis) {
        this.prisma = prisma;
        this.redis = redis;
        this.logger = new common_1.Logger(AnalyticsService_1.name);
        this.CACHE_TTL = 3600;
        this.CACHE_PREFIX = 'analytics:';
    }
    getCacheKey(key) {
        return `${this.CACHE_PREFIX}${key}`;
    }
    async getCached(key) {
        try {
            const cached = await this.redis.get(this.getCacheKey(key));
            return cached ? JSON.parse(cached) : null;
        }
        catch {
            return null;
        }
    }
    async setCached(key, data) {
        try {
            await this.redis.set(this.getCacheKey(key), JSON.stringify(data), this.CACHE_TTL);
        }
        catch (error) {
            this.logger.warn(`Failed to cache analytics data: ${error.message}`);
        }
    }
    getDateRange(range) {
        const end = new Date();
        const start = new Date();
        const days = range === analytics_dto_1.TimeRange.SEVEN_DAYS ? 7 : range === analytics_dto_1.TimeRange.THIRTY_DAYS ? 30 : 90;
        start.setDate(start.getDate() - days);
        return { start, end };
    }
    async getDashboardStats() {
        const cacheKey = 'dashboard';
        const cached = await this.getCached(cacheKey);
        if (cached)
            return cached;
        const [totalUsers, usersByRole, totalMessages, messagesToday, totalChannels, activeChannels, totalFiles, totalStorage, newUsersThisWeek, newUsersThisMonth, activeUsersToday, pendingReports, averageGrade, attendanceRate,] = await Promise.all([
            this.prisma.user.count({ where: { deletedAt: null } }),
            this.getUsersByRole(),
            this.prisma.message.count({ where: { isDeleted: false } }),
            this.getMessagesToday(),
            this.prisma.channel.count({ where: { deletedAt: null } }),
            this.prisma.channel.count({ where: { deletedAt: null, isArchived: false } }),
            this.prisma.file.count({ where: { isDeleted: false } }),
            this.getTotalStorage(),
            this.getNewUsersCount(7),
            this.getNewUsersCount(30),
            this.getActiveUsersToday(),
            this.prisma.channelReport.count({ where: { status: 'pending' } }),
            this.getAverageGrade(),
            this.getAttendanceRate(),
        ]);
        const stats = {
            totalUsers,
            usersByRole,
            totalMessages,
            messagesToday,
            totalChannels,
            activeChannels,
            totalFiles,
            totalStorageUsed: totalStorage,
            newUsersThisWeek,
            newUsersThisMonth,
            activeUsersToday,
            pendingReports,
            averageGrade,
            attendanceRate,
            generatedAt: new Date(),
        };
        await this.setCached(cacheKey, stats);
        return stats;
    }
    async getUsersByRole() {
        const result = await this.prisma.$queryRaw `
      SELECT r.name as role, COUNT(*)::int as count
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      JOIN users u ON ur.user_id = u.id
      WHERE u.deleted_at IS NULL
      GROUP BY r.name
    `;
        return result;
    }
    async getMessagesToday() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return this.prisma.message.count({
            where: { createdAt: { gte: today }, isDeleted: false },
        });
    }
    async getTotalStorage() {
        const result = await this.prisma.file.aggregate({
            where: { isDeleted: false },
            _sum: { size: true },
        });
        return result._sum.size || 0;
    }
    async getNewUsersCount(days) {
        const date = new Date();
        date.setDate(date.getDate() - days);
        return this.prisma.user.count({
            where: { createdAt: { gte: date }, deletedAt: null },
        });
    }
    async getActiveUsersToday() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return this.prisma.user.count({
            where: { lastLoginAt: { gte: today }, deletedAt: null },
        });
    }
    async getAverageGrade() {
        const result = await this.prisma.grade.aggregate({
            _avg: { score: true },
        });
        return result._avg.score ? Math.round(result._avg.score * 100) / 100 : null;
    }
    async getAttendanceRate() {
        const records = await this.prisma.attendanceRecord.findMany({
            select: { status: true },
        });
        if (records.length === 0)
            return null;
        const present = records.filter(r => r.status === 'present' || r.status === 'late').length;
        return Math.round((present / records.length) * 10000) / 100;
    }
    async getUserActivity(timeRange) {
        const cacheKey = `user-activity:${timeRange}`;
        const cached = await this.getCached(cacheKey);
        if (cached)
            return cached;
        const { start, end } = this.getDateRange(timeRange);
        const days = timeRange === analytics_dto_1.TimeRange.SEVEN_DAYS ? 7 : timeRange === analytics_dto_1.TimeRange.THIRTY_DAYS ? 30 : 90;
        const data = await Promise.all(Array.from({ length: days }, async (_, i) => {
            const date = new Date(start);
            date.setDate(date.getDate() + i);
            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);
            const [activeUsers, newUsers, logins] = await Promise.all([
                this.prisma.user.count({
                    where: {
                        lastLoginAt: {
                            gte: date,
                            lt: nextDate,
                        },
                        deletedAt: null,
                    },
                }),
                this.prisma.user.count({
                    where: {
                        createdAt: {
                            gte: date,
                            lt: nextDate,
                        },
                        deletedAt: null,
                    },
                }),
                this.prisma.auditLog.count({
                    where: {
                        action: 'login',
                        createdAt: {
                            gte: date,
                            lt: nextDate,
                        },
                    },
                }),
            ]);
            return {
                date: date.toISOString().split('T')[0],
                activeUsers,
                newUsers,
                logins,
            };
        }));
        const result = {
            timeRange,
            data,
            summary: {
                totalActiveUsers: data.reduce((sum, d) => sum + d.activeUsers, 0),
                totalNewUsers: data.reduce((sum, d) => sum + d.newUsers, 0),
                averageDailyActive: Math.round((data.reduce((sum, d) => sum + d.activeUsers, 0) / days) * 100) / 100,
            },
            generatedAt: new Date(),
        };
        await this.setCached(cacheKey, result);
        return result;
    }
    async getMessageStats(timeRange) {
        const cacheKey = `message-stats:${timeRange}`;
        const cached = await this.getCached(cacheKey);
        if (cached)
            return cached;
        const { start, end } = this.getDateRange(timeRange);
        const days = timeRange === analytics_dto_1.TimeRange.SEVEN_DAYS ? 7 : timeRange === analytics_dto_1.TimeRange.THIRTY_DAYS ? 30 : 90;
        const dailyStats = await Promise.all(Array.from({ length: days }, async (_, i) => {
            const date = new Date(start);
            date.setDate(date.getDate() + i);
            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);
            const count = await this.prisma.message.count({
                where: {
                    createdAt: { gte: date, lt: nextDate },
                    isDeleted: false,
                },
            });
            return {
                date: date.toISOString().split('T')[0],
                count,
            };
        }));
        const byChannelType = await this.prisma.$queryRaw `
      SELECT c.type, COUNT(*)::int as count
      FROM messages m
      JOIN channels c ON m.channel_id = c.id
      WHERE m.is_deleted = false
      AND m.created_at >= ${start}
      GROUP BY c.type
    `;
        const totalMessages = dailyStats.reduce((sum, d) => sum + d.count, 0);
        const result = {
            timeRange,
            dailyStats,
            byChannelType: byChannelType,
            totalMessages,
            averagePerDay: Math.round((totalMessages / days) * 100) / 100,
            generatedAt: new Date(),
        };
        await this.setCached(cacheKey, result);
        return result;
    }
    async getChannelStats() {
        const cacheKey = 'channels';
        const cached = await this.getCached(cacheKey);
        if (cached)
            return cached;
        const [totalChannels, channelsByType, mostActiveChannels, newChannelsThisMonth, archivedChannels,] = await Promise.all([
            this.prisma.channel.count({ where: { deletedAt: null } }),
            this.getChannelsByType(),
            this.getMostActiveChannels(),
            this.getNewChannelsCount(30),
            this.prisma.channel.count({ where: { deletedAt: null, isArchived: true } }),
        ]);
        const stats = {
            totalChannels,
            channelsByType,
            mostActiveChannels: mostActiveChannels.map(c => ({
                id: c.id,
                name: c.name,
                type: c.type,
                messageCount: c.message_count,
                memberCount: c.member_count,
            })),
            newChannelsThisMonth,
            archivedChannels,
            generatedAt: new Date(),
        };
        await this.setCached(cacheKey, stats);
        return stats;
    }
    async getChannelsByType() {
        const result = await this.prisma.channel.groupBy({
            by: ['type'],
            where: { deletedAt: null },
            _count: { id: true },
        });
        return result.map(r => ({ type: r.type, count: r._count.id }));
    }
    async getMostActiveChannels() {
        const channels = await this.prisma.$queryRaw `
      SELECT 
        c.id,
        c.name,
        c.type,
        COUNT(m.id)::int as message_count,
        COUNT(DISTINCT cm.user_id)::int as member_count
      FROM channels c
      LEFT JOIN messages m ON c.id = m.channel_id AND m.is_deleted = false
      LEFT JOIN channel_members cm ON c.id = cm.channel_id
      WHERE c.deleted_at IS NULL
      GROUP BY c.id, c.name, c.type
      ORDER BY message_count DESC
      LIMIT 10
    `;
        return channels;
    }
    async getNewChannelsCount(days) {
        const date = new Date();
        date.setDate(date.getDate() - days);
        return this.prisma.channel.count({
            where: { createdAt: { gte: date }, deletedAt: null },
        });
    }
    async getFileStorageStats() {
        const cacheKey = 'files';
        const cached = await this.getCached(cacheKey);
        if (cached)
            return cached;
        const [totalFiles, totalStorage, storageByCategory, storageByRole, topUploaders, recentUploads, deletedFiles,] = await Promise.all([
            this.prisma.file.count({ where: { isDeleted: false } }),
            this.getTotalStorage(),
            this.getStorageByCategory(),
            this.getStorageByRole(),
            this.getTopUploaders(),
            this.getRecentUploadsCount(),
            this.prisma.file.count({ where: { isDeleted: true } }),
        ]);
        const stats = {
            totalFiles,
            totalStorageUsed: totalStorage,
            storageByCategory,
            storageByRole,
            topUploaders,
            recentUploads,
            deletedFiles,
            generatedAt: new Date(),
        };
        await this.setCached(cacheKey, stats);
        return stats;
    }
    async getStorageByCategory() {
        const result = await this.prisma.file.groupBy({
            by: ['category'],
            where: { isDeleted: false },
            _sum: { size: true },
            _count: { id: true },
        });
        return result.map(r => ({
            category: r.category,
            size: r._sum.size || 0,
            count: r._count.id,
        }));
    }
    async getStorageByRole() {
        const result = await this.prisma.$queryRaw `
      SELECT 
        r.name as role,
        COALESCE(SUM(f.size), 0)::bigint as size,
        COUNT(f.id)::int as count
      FROM roles r
      JOIN user_roles ur ON r.id = ur.role_id
      JOIN users u ON ur.user_id = u.id
      LEFT JOIN files f ON u.id = f.uploader_id AND f.is_deleted = false
      WHERE u.deleted_at IS NULL
      GROUP BY r.name
    `;
        return result.map(r => ({
            role: r.role,
            size: Number(r.size),
            count: r.count,
        }));
    }
    async getTopUploaders() {
        const result = await this.prisma.$queryRaw `
      SELECT 
        u.id as user_id,
        CONCAT(u.first_name, ' ', u.last_name) as name,
        COUNT(f.id)::int as file_count,
        COALESCE(SUM(f.size), 0)::bigint as total_size
      FROM users u
      JOIN files f ON u.id = f.uploader_id
      WHERE f.is_deleted = false
      AND u.deleted_at IS NULL
      GROUP BY u.id, u.first_name, u.last_name
      ORDER BY file_count DESC
      LIMIT 10
    `;
        return result.map(r => ({
            userId: r.user_id,
            name: r.name,
            fileCount: r.file_count,
            totalSize: Number(r.total_size),
        }));
    }
    async getRecentUploadsCount() {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return this.prisma.file.count({
            where: { createdAt: { gte: sevenDaysAgo }, isDeleted: false },
        });
    }
    async getEngagementMetrics() {
        const cacheKey = 'engagement';
        const cached = await this.getCached(cacheKey);
        if (cached)
            return cached;
        const [dailyActiveUsers, weeklyActiveUsers, monthlyActiveUsers, userRetention, messagesPerUser, channelsPerUser, peakActivityTime,] = await Promise.all([
            this.getDAU(),
            this.getWAU(),
            this.getMAU(),
            this.getUserRetention(),
            this.getMessagesPerUser(),
            this.getChannelsPerUser(),
            this.getPeakActivityTime(),
        ]);
        const metrics = {
            dailyActiveUsers,
            weeklyActiveUsers,
            monthlyActiveUsers,
            userRetention,
            averageSessionDuration: null,
            messagesPerUser,
            channelsPerUser,
            peakActivityTime,
            generatedAt: new Date(),
        };
        await this.setCached(cacheKey, metrics);
        return metrics;
    }
    async getDAU() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return this.prisma.user.count({
            where: { lastLoginAt: { gte: today }, deletedAt: null },
        });
    }
    async getWAU() {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return this.prisma.user.count({
            where: { lastLoginAt: { gte: weekAgo }, deletedAt: null },
        });
    }
    async getMAU() {
        const monthAgo = new Date();
        monthAgo.setDate(monthAgo.getDate() - 30);
        return this.prisma.user.count({
            where: { lastLoginAt: { gte: monthAgo }, deletedAt: null },
        });
    }
    async getUserRetention() {
        const now = new Date();
        const day1 = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const day7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const day30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const [totalUsers, active1d, active7d, active30d] = await Promise.all([
            this.prisma.user.count({ where: { deletedAt: null } }),
            this.prisma.user.count({ where: { lastLoginAt: { gte: day1 }, deletedAt: null } }),
            this.prisma.user.count({ where: { lastLoginAt: { gte: day7 }, deletedAt: null } }),
            this.prisma.user.count({ where: { lastLoginAt: { gte: day30 }, deletedAt: null } }),
        ]);
        return {
            day1: totalUsers > 0 ? Math.round((active1d / totalUsers) * 10000) / 100 : 0,
            day7: totalUsers > 0 ? Math.round((active7d / totalUsers) * 10000) / 100 : 0,
            day30: totalUsers > 0 ? Math.round((active30d / totalUsers) * 10000) / 100 : 0,
        };
    }
    async getMessagesPerUser() {
        const [totalMessages, totalUsers] = await Promise.all([
            this.prisma.message.count({ where: { isDeleted: false } }),
            this.prisma.user.count({ where: { deletedAt: null } }),
        ]);
        return totalUsers > 0 ? Math.round((totalMessages / totalUsers) * 100) / 100 : 0;
    }
    async getChannelsPerUser() {
        const [totalMembers, totalUsers] = await Promise.all([
            this.prisma.channelMember.count(),
            this.prisma.user.count({ where: { deletedAt: null } }),
        ]);
        return totalUsers > 0 ? Math.round((totalMembers / totalUsers) * 100) / 100 : 0;
    }
    async getPeakActivityTime() {
        const result = await this.prisma.$queryRaw `
      SELECT EXTRACT(HOUR FROM created_at) as hour, COUNT(*)::int as count
      FROM messages
      WHERE is_deleted = false
      AND created_at >= NOW() - INTERVAL '7 days'
      GROUP BY hour
      ORDER BY count DESC
      LIMIT 1
    `;
        const row = result[0];
        if (!row)
            return null;
        return `${String(row.hour).padStart(2, '0')}:00`;
    }
    async exportReport(type, format) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `${type}-report-${timestamp}.${format}`;
        let data = [];
        switch (type) {
            case analytics_dto_1.ExportType.USERS:
                data = await this.exportUsersData();
                break;
            case analytics_dto_1.ExportType.MESSAGES:
                data = await this.exportMessagesData();
                break;
            case analytics_dto_1.ExportType.GRADES:
                data = await this.exportGradesData();
                break;
        }
        if (format === analytics_dto_1.ExportFormat.CSV) {
            return this.convertToCSV(data);
        }
        return JSON.stringify({
            filename,
            generatedAt: new Date(),
            recordCount: data.length,
            data,
        }, null, 2);
    }
    async exportUsersData() {
        return this.prisma.user.findMany({
            where: { deletedAt: null },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                status: true,
                lastLoginAt: true,
                createdAt: true,
                userRoles: {
                    select: { role: { select: { name: true } } },
                },
            },
        });
    }
    async exportMessagesData() {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return this.prisma.message.findMany({
            where: { createdAt: { gte: thirtyDaysAgo }, isDeleted: false },
            select: {
                id: true,
                content: true,
                contentType: true,
                createdAt: true,
                channel: { select: { name: true, type: true } },
                sender: { select: { email: true, firstName: true, lastName: true } },
            },
        });
    }
    async exportGradesData() {
        return this.prisma.grade.findMany({
            select: {
                id: true,
                score: true,
                maxScore: true,
                letterGrade: true,
                feedback: true,
                gradedAt: true,
                assignment: { select: { title: true } },
                student: { select: { email: true, firstName: true, lastName: true } },
            },
        });
    }
    convertToCSV(data) {
        if (data.length === 0)
            return '';
        const flattenObject = (obj, prefix = '') => {
            const result = {};
            for (const [key, value] of Object.entries(obj || {})) {
                const newKey = prefix ? `${prefix}.${key}` : key;
                if (value && typeof value === 'object' && !Array.isArray(value)) {
                    Object.assign(result, flattenObject(value, newKey));
                }
                else if (Array.isArray(value)) {
                    result[newKey] = value.map(v => typeof v === 'object' ? JSON.stringify(v) : v).join('; ');
                }
                else {
                    result[newKey] = value;
                }
            }
            return result;
        };
        const flattened = data.map(item => flattenObject(item));
        const headers = Object.keys(flattened[0]);
        const csvRows = [
            headers.join(','),
            ...flattened.map(row => headers.map(header => {
                const value = row[header];
                if (value === null || value === undefined)
                    return '';
                const str = String(value).replace(/"/g, '""');
                return str.includes(',') || str.includes('\n') || str.includes('"') ? `"${str}"` : str;
            }).join(',')),
        ];
        return csvRows.join('\n');
    }
    async refreshAnalyticsCache() {
        this.logger.log('Refreshing analytics cache...');
        const startTime = Date.now();
        try {
            await Promise.all([
                this.getDashboardStats(),
                this.getUserActivity(analytics_dto_1.TimeRange.SEVEN_DAYS),
                this.getUserActivity(analytics_dto_1.TimeRange.THIRTY_DAYS),
                this.getUserActivity(analytics_dto_1.TimeRange.NINETY_DAYS),
                this.getMessageStats(analytics_dto_1.TimeRange.SEVEN_DAYS),
                this.getMessageStats(analytics_dto_1.TimeRange.THIRTY_DAYS),
                this.getMessageStats(analytics_dto_1.TimeRange.NINETY_DAYS),
                this.getChannelStats(),
                this.getFileStorageStats(),
                this.getEngagementMetrics(),
            ]);
            const duration = Date.now() - startTime;
            this.logger.log(`Analytics cache refreshed successfully in ${duration}ms`);
        }
        catch (error) {
            this.logger.error(`Failed to refresh analytics cache: ${error.message}`, error.stack);
        }
    }
};
exports.AnalyticsService = AnalyticsService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", typeof (_c = typeof Promise !== "undefined" && Promise) === "function" ? _c : Object)
], AnalyticsService.prototype, "refreshAnalyticsCache", null);
exports.AnalyticsService = AnalyticsService = AnalyticsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object, typeof (_b = typeof redis_service_1.RedisService !== "undefined" && redis_service_1.RedisService) === "function" ? _b : Object])
], AnalyticsService);


/***/ }),
/* 123 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MessageStatsQueryDto = exports.UserActivityQueryDto = exports.ExportQueryDto = exports.TimeRangeQueryDto = exports.ExportType = exports.ExportFormat = exports.TimeRange = void 0;
const class_validator_1 = __webpack_require__(23);
var TimeRange;
(function (TimeRange) {
    TimeRange["SEVEN_DAYS"] = "7d";
    TimeRange["THIRTY_DAYS"] = "30d";
    TimeRange["NINETY_DAYS"] = "90d";
})(TimeRange || (exports.TimeRange = TimeRange = {}));
var ExportFormat;
(function (ExportFormat) {
    ExportFormat["CSV"] = "csv";
    ExportFormat["PDF"] = "pdf";
})(ExportFormat || (exports.ExportFormat = ExportFormat = {}));
var ExportType;
(function (ExportType) {
    ExportType["USERS"] = "users";
    ExportType["MESSAGES"] = "messages";
    ExportType["GRADES"] = "grades";
})(ExportType || (exports.ExportType = ExportType = {}));
class TimeRangeQueryDto {
    constructor() {
        this.range = TimeRange.THIRTY_DAYS;
    }
}
exports.TimeRangeQueryDto = TimeRangeQueryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(TimeRange),
    __metadata("design:type", String)
], TimeRangeQueryDto.prototype, "range", void 0);
class ExportQueryDto {
    constructor() {
        this.format = ExportFormat.CSV;
    }
}
exports.ExportQueryDto = ExportQueryDto;
__decorate([
    (0, class_validator_1.IsEnum)(ExportType),
    __metadata("design:type", String)
], ExportQueryDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(ExportFormat),
    __metadata("design:type", String)
], ExportQueryDto.prototype, "format", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], ExportQueryDto.prototype, "startDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], ExportQueryDto.prototype, "endDate", void 0);
class UserActivityQueryDto {
    constructor() {
        this.range = TimeRange.THIRTY_DAYS;
    }
}
exports.UserActivityQueryDto = UserActivityQueryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(TimeRange),
    __metadata("design:type", String)
], UserActivityQueryDto.prototype, "range", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UserActivityQueryDto.prototype, "role", void 0);
class MessageStatsQueryDto {
    constructor() {
        this.range = TimeRange.THIRTY_DAYS;
    }
}
exports.MessageStatsQueryDto = MessageStatsQueryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(TimeRange),
    __metadata("design:type", String)
], MessageStatsQueryDto.prototype, "range", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MessageStatsQueryDto.prototype, "channelId", void 0);


/***/ }),
/* 124 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RedisModule = void 0;
const common_1 = __webpack_require__(2);
const redis_service_1 = __webpack_require__(61);
let RedisModule = class RedisModule {
};
exports.RedisModule = RedisModule;
exports.RedisModule = RedisModule = __decorate([
    (0, common_1.Module)({
        providers: [redis_service_1.RedisService],
        exports: [redis_service_1.RedisService],
    })
], RedisModule);


/***/ }),
/* 125 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SoftDeleteModule = void 0;
const common_1 = __webpack_require__(2);
const soft_delete_service_1 = __webpack_require__(126);
const soft_delete_controller_1 = __webpack_require__(127);
const soft_delete_cleanup_service_1 = __webpack_require__(128);
const prisma_module_1 = __webpack_require__(9);
let SoftDeleteModule = class SoftDeleteModule {
};
exports.SoftDeleteModule = SoftDeleteModule;
exports.SoftDeleteModule = SoftDeleteModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        providers: [soft_delete_service_1.SoftDeleteService, soft_delete_cleanup_service_1.SoftDeleteCleanupService],
        controllers: [soft_delete_controller_1.SoftDeleteController],
        exports: [soft_delete_service_1.SoftDeleteService, soft_delete_cleanup_service_1.SoftDeleteCleanupService],
    })
], SoftDeleteModule);


/***/ }),
/* 126 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SoftDeleteService_1;
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SoftDeleteService = void 0;
const common_1 = __webpack_require__(2);
const prisma_service_1 = __webpack_require__(10);
const audit_helper_1 = __webpack_require__(45);
const DEFAULT_GRACE_PERIOD_DAYS = 30;
let SoftDeleteService = SoftDeleteService_1 = class SoftDeleteService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(SoftDeleteService_1.name);
    }
    async softDeleteUser(userId, options = {}) {
        const { reason, deletedBy } = options;
        const user = await this.prisma.user.findUnique({
            where: { id: userId, deletedAt: null },
            include: { userRoles: { include: { role: true } } },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found or already deleted');
        }
        if (deletedBy && userId === deletedBy) {
            throw new common_1.ForbiddenException('Cannot delete yourself');
        }
        const isAdmin = user.userRoles.some(ur => ur.role.name === 'admin');
        if (isAdmin) {
            const adminCount = await this.prisma.userRole.count({
                where: {
                    role: { name: 'admin' },
                    user: { deletedAt: null },
                },
            });
            if (adminCount <= 1) {
                throw new common_1.ForbiddenException('Cannot delete the last admin user');
            }
        }
        const updatedUser = await this.prisma.user.update({
            where: { id: userId },
            data: {
                deletedAt: new Date(),
                status: 'suspended',
            },
            include: { userRoles: { include: { role: true } } },
        });
        await (0, audit_helper_1.createAuditLog)(this.prisma, {
            action: audit_helper_1.AuditActions.USER_DELETE,
            actorId: deletedBy || 'system',
            targetId: userId,
            metadata: { reason, softDelete: true },
        });
        this.logger.log(`User ${userId} soft deleted by ${deletedBy || 'system'}`);
        return {
            id: updatedUser.id,
            email: updatedUser.email,
            status: updatedUser.status,
            deletedAt: updatedUser.deletedAt,
            message: 'User has been deactivated. Data will be permanently deleted after 30 days.',
        };
    }
    async restoreUser(userId, restoredBy) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (!user.deletedAt) {
            throw new common_1.BadRequestException('User is not deleted');
        }
        const restoredUser = await this.prisma.user.update({
            where: { id: userId },
            data: {
                deletedAt: null,
                status: 'active',
            },
            include: { userRoles: { include: { role: true } } },
        });
        await (0, audit_helper_1.createAuditLog)(this.prisma, {
            action: audit_helper_1.AuditActions.USER_REACTIVATE,
            actorId: restoredBy || 'system',
            targetId: userId,
            metadata: { restoredFromSoftDelete: true },
        });
        this.logger.log(`User ${userId} restored by ${restoredBy || 'system'}`);
        return {
            id: restoredUser.id,
            email: restoredUser.email,
            status: restoredUser.status,
            message: 'User has been restored successfully',
        };
    }
    async softDeleteChannel(channelId, options = {}) {
        const { reason, deletedBy } = options;
        const channel = await this.prisma.channel.findUnique({
            where: { id: channelId, deletedAt: null },
        });
        if (!channel) {
            throw new common_1.NotFoundException('Channel not found or already deleted');
        }
        const updatedChannel = await this.prisma.channel.update({
            where: { id: channelId },
            data: {
                deletedAt: new Date(),
                isArchived: true,
            },
        });
        await (0, audit_helper_1.createAuditLog)(this.prisma, {
            action: audit_helper_1.AuditActions.ARCHIVE_CHANNEL,
            actorId: deletedBy || 'system',
            channelId,
            metadata: { reason, softDelete: true },
        });
        this.logger.log(`Channel ${channelId} soft deleted by ${deletedBy || 'system'}`);
        return {
            id: updatedChannel.id,
            name: updatedChannel.name,
            deletedAt: updatedChannel.deletedAt,
            message: 'Channel has been archived. Data will be permanently deleted after 30 days.',
        };
    }
    async restoreChannel(channelId, restoredBy) {
        const channel = await this.prisma.channel.findUnique({
            where: { id: channelId },
        });
        if (!channel) {
            throw new common_1.NotFoundException('Channel not found');
        }
        if (!channel.deletedAt) {
            throw new common_1.BadRequestException('Channel is not deleted');
        }
        const restoredChannel = await this.prisma.channel.update({
            where: { id: channelId },
            data: {
                deletedAt: null,
                isArchived: false,
            },
        });
        await (0, audit_helper_1.createAuditLog)(this.prisma, {
            action: audit_helper_1.AuditActions.UNARCHIVE_CHANNEL,
            actorId: restoredBy || 'system',
            channelId,
            metadata: { restoredFromSoftDelete: true },
        });
        this.logger.log(`Channel ${channelId} restored by ${restoredBy || 'system'}`);
        return {
            id: restoredChannel.id,
            name: restoredChannel.name,
            message: 'Channel has been restored successfully',
        };
    }
    async softDeleteMessage(messageId, options = {}) {
        const { reason, deletedBy } = options;
        const message = await this.prisma.message.findUnique({
            where: { id: messageId, isDeleted: false },
        });
        if (!message) {
            throw new common_1.NotFoundException('Message not found or already deleted');
        }
        const updatedMessage = await this.prisma.message.update({
            where: { id: messageId },
            data: {
                isDeleted: true,
                deletedAt: new Date(),
                deletedBy: deletedBy || null,
            },
        });
        await (0, audit_helper_1.createAuditLog)(this.prisma, {
            action: audit_helper_1.AuditActions.DELETE_MESSAGE,
            actorId: deletedBy || 'system',
            messageId,
            channelId: message.channelId,
            metadata: { reason, softDelete: true },
        });
        this.logger.log(`Message ${messageId} soft deleted by ${deletedBy || 'system'}`);
        return {
            id: updatedMessage.id,
            deletedAt: updatedMessage.deletedAt,
            deletedBy: updatedMessage.deletedBy,
            message: 'Message has been deleted',
        };
    }
    async restoreMessage(messageId, restoredBy) {
        const message = await this.prisma.message.findUnique({
            where: { id: messageId },
        });
        if (!message) {
            throw new common_1.NotFoundException('Message not found');
        }
        if (!message.isDeleted) {
            throw new common_1.BadRequestException('Message is not deleted');
        }
        const restoredMessage = await this.prisma.message.update({
            where: { id: messageId },
            data: {
                isDeleted: false,
                deletedAt: null,
                deletedBy: null,
            },
        });
        await (0, audit_helper_1.createAuditLog)(this.prisma, {
            action: audit_helper_1.AuditActions.EDIT_MESSAGE,
            actorId: restoredBy || 'system',
            messageId,
            channelId: message.channelId,
            metadata: { restoredFromSoftDelete: true },
        });
        this.logger.log(`Message ${messageId} restored by ${restoredBy || 'system'}`);
        return {
            id: restoredMessage.id,
            message: 'Message has been restored successfully',
        };
    }
    async softDeleteCourse(courseId, options = {}) {
        const { reason, deletedBy } = options;
        const course = await this.prisma.course.findUnique({
            where: { id: courseId, deletedAt: null },
        });
        if (!course) {
            throw new common_1.NotFoundException('Course not found or already deleted');
        }
        const updatedCourse = await this.prisma.course.update({
            where: { id: courseId },
            data: {
                deletedAt: new Date(),
                isActive: false,
            },
        });
        await (0, audit_helper_1.createAuditLog)(this.prisma, {
            action: audit_helper_1.AuditActions.COURSE_DEACTIVATE,
            actorId: deletedBy || 'system',
            targetId: courseId,
            metadata: { reason, softDelete: true },
        });
        this.logger.log(`Course ${courseId} soft deleted by ${deletedBy || 'system'}`);
        return {
            id: updatedCourse.id,
            code: updatedCourse.code,
            name: updatedCourse.name,
            deletedAt: updatedCourse.deletedAt,
            message: 'Course has been deactivated. Data will be permanently deleted after 30 days.',
        };
    }
    async restoreCourse(courseId, restoredBy) {
        const course = await this.prisma.course.findUnique({
            where: { id: courseId },
        });
        if (!course) {
            throw new common_1.NotFoundException('Course not found');
        }
        if (!course.deletedAt) {
            throw new common_1.BadRequestException('Course is not deleted');
        }
        const restoredCourse = await this.prisma.course.update({
            where: { id: courseId },
            data: {
                deletedAt: null,
                isActive: true,
            },
        });
        await (0, audit_helper_1.createAuditLog)(this.prisma, {
            action: audit_helper_1.AuditActions.COURSE_ACTIVATE,
            actorId: restoredBy || 'system',
            targetId: courseId,
            metadata: { restoredFromSoftDelete: true },
        });
        this.logger.log(`Course ${courseId} restored by ${restoredBy || 'system'}`);
        return {
            id: restoredCourse.id,
            code: restoredCourse.code,
            name: restoredCourse.name,
            message: 'Course has been restored successfully',
        };
    }
    async softDeleteClass(classId, options = {}) {
        const { reason, deletedBy } = options;
        const cls = await this.prisma.class.findUnique({
            where: { id: classId, deletedAt: null },
        });
        if (!cls) {
            throw new common_1.NotFoundException('Class not found or already deleted');
        }
        const updatedClass = await this.prisma.class.update({
            where: { id: classId },
            data: {
                deletedAt: new Date(),
                isActive: false,
            },
        });
        await (0, audit_helper_1.createAuditLog)(this.prisma, {
            action: audit_helper_1.AuditActions.COURSE_DEACTIVATE,
            actorId: deletedBy || 'system',
            targetId: classId,
            metadata: { reason, softDelete: true, type: 'class' },
        });
        this.logger.log(`Class ${classId} soft deleted by ${deletedBy || 'system'}`);
        return {
            id: updatedClass.id,
            deletedAt: updatedClass.deletedAt,
            message: 'Class has been deactivated. Data will be permanently deleted after 30 days.',
        };
    }
    async restoreClass(classId, restoredBy) {
        const cls = await this.prisma.class.findUnique({
            where: { id: classId },
        });
        if (!cls) {
            throw new common_1.NotFoundException('Class not found');
        }
        if (!cls.deletedAt) {
            throw new common_1.BadRequestException('Class is not deleted');
        }
        const restoredClass = await this.prisma.class.update({
            where: { id: classId },
            data: {
                deletedAt: null,
                isActive: true,
            },
        });
        await (0, audit_helper_1.createAuditLog)(this.prisma, {
            action: audit_helper_1.AuditActions.COURSE_ACTIVATE,
            actorId: restoredBy || 'system',
            targetId: classId,
            metadata: { restoredFromSoftDelete: true, type: 'class' },
        });
        this.logger.log(`Class ${classId} restored by ${restoredBy || 'system'}`);
        return {
            id: restoredClass.id,
            message: 'Class has been restored successfully',
        };
    }
    async softDeleteFile(fileId, options = {}) {
        const { reason, deletedBy } = options;
        const file = await this.prisma.file.findUnique({
            where: { id: fileId, isDeleted: false },
        });
        if (!file) {
            throw new common_1.NotFoundException('File not found or already deleted');
        }
        const updatedFile = await this.prisma.file.update({
            where: { id: fileId },
            data: {
                isDeleted: true,
                deletedAt: new Date(),
            },
        });
        await (0, audit_helper_1.createAuditLog)(this.prisma, {
            action: audit_helper_1.AuditActions.DELETE_MESSAGE,
            actorId: deletedBy || 'system',
            targetId: fileId,
            metadata: { reason, softDelete: true, type: 'file' },
        });
        this.logger.log(`File ${fileId} soft deleted by ${deletedBy || 'system'}`);
        return {
            id: updatedFile.id,
            filename: updatedFile.filename,
            deletedAt: updatedFile.deletedAt,
            message: 'File has been deleted. Data will be permanently deleted after 30 days.',
        };
    }
    async restoreFile(fileId, restoredBy) {
        const file = await this.prisma.file.findUnique({
            where: { id: fileId },
        });
        if (!file) {
            throw new common_1.NotFoundException('File not found');
        }
        if (!file.isDeleted) {
            throw new common_1.BadRequestException('File is not deleted');
        }
        const restoredFile = await this.prisma.file.update({
            where: { id: fileId },
            data: {
                isDeleted: false,
                deletedAt: null,
            },
        });
        await (0, audit_helper_1.createAuditLog)(this.prisma, {
            action: audit_helper_1.AuditActions.UNARCHIVE_CHANNEL,
            actorId: restoredBy || 'system',
            targetId: fileId,
            metadata: { restoredFromSoftDelete: true, type: 'file' },
        });
        this.logger.log(`File ${fileId} restored by ${restoredBy || 'system'}`);
        return {
            id: restoredFile.id,
            filename: restoredFile.filename,
            message: 'File has been restored successfully',
        };
    }
    async permanentDelete(type, id, deletedBy) {
        const gracePeriodMs = DEFAULT_GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000;
        switch (type) {
            case 'user':
                return this.permanentDeleteUser(id, gracePeriodMs, deletedBy);
            case 'channel':
                return this.permanentDeleteChannel(id, gracePeriodMs, deletedBy);
            case 'message':
                return this.permanentDeleteMessage(id, deletedBy);
            case 'course':
                return this.permanentDeleteCourse(id, gracePeriodMs, deletedBy);
            case 'class':
                return this.permanentDeleteClass(id, gracePeriodMs, deletedBy);
            case 'file':
                return this.permanentDeleteFile(id, deletedBy);
            default:
                throw new common_1.BadRequestException(`Unknown type: ${type}`);
        }
    }
    async permanentDeleteUser(userId, gracePeriodMs, deletedBy) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (!user.deletedAt) {
            throw new common_1.BadRequestException('User must be soft deleted first');
        }
        const deleteAfter = new Date(user.deletedAt.getTime() + gracePeriodMs);
        if (new Date() < deleteAfter) {
            const daysRemaining = Math.ceil((deleteAfter.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
            throw new common_1.ForbiddenException(`Cannot permanently delete user until grace period ends. ${daysRemaining} days remaining.`);
        }
        await this.prisma.user.delete({ where: { id: userId } });
        this.logger.log(`User ${userId} permanently deleted by ${deletedBy || 'system'}`);
        return { message: 'User permanently deleted', id: userId };
    }
    async permanentDeleteChannel(channelId, gracePeriodMs, deletedBy) {
        const channel = await this.prisma.channel.findUnique({
            where: { id: channelId },
        });
        if (!channel) {
            throw new common_1.NotFoundException('Channel not found');
        }
        if (!channel.deletedAt) {
            throw new common_1.BadRequestException('Channel must be soft deleted first');
        }
        const deleteAfter = new Date(channel.deletedAt.getTime() + gracePeriodMs);
        if (new Date() < deleteAfter) {
            const daysRemaining = Math.ceil((deleteAfter.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
            throw new common_1.ForbiddenException(`Cannot permanently delete channel until grace period ends. ${daysRemaining} days remaining.`);
        }
        await this.prisma.channel.delete({ where: { id: channelId } });
        this.logger.log(`Channel ${channelId} permanently deleted by ${deletedBy || 'system'}`);
        return { message: 'Channel permanently deleted', id: channelId };
    }
    async permanentDeleteMessage(messageId, deletedBy) {
        const message = await this.prisma.message.findUnique({
            where: { id: messageId },
        });
        if (!message) {
            throw new common_1.NotFoundException('Message not found');
        }
        if (!message.isDeleted) {
            throw new common_1.BadRequestException('Message must be soft deleted first');
        }
        await this.prisma.message.delete({ where: { id: messageId } });
        this.logger.log(`Message ${messageId} permanently deleted by ${deletedBy || 'system'}`);
        return { message: 'Message permanently deleted', id: messageId };
    }
    async permanentDeleteCourse(courseId, gracePeriodMs, deletedBy) {
        const course = await this.prisma.course.findUnique({
            where: { id: courseId },
        });
        if (!course) {
            throw new common_1.NotFoundException('Course not found');
        }
        if (!course.deletedAt) {
            throw new common_1.BadRequestException('Course must be soft deleted first');
        }
        const deleteAfter = new Date(course.deletedAt.getTime() + gracePeriodMs);
        if (new Date() < deleteAfter) {
            const daysRemaining = Math.ceil((deleteAfter.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
            throw new common_1.ForbiddenException(`Cannot permanently delete course until grace period ends. ${daysRemaining} days remaining.`);
        }
        await this.prisma.course.delete({ where: { id: courseId } });
        this.logger.log(`Course ${courseId} permanently deleted by ${deletedBy || 'system'}`);
        return { message: 'Course permanently deleted', id: courseId };
    }
    async permanentDeleteClass(classId, gracePeriodMs, deletedBy) {
        const cls = await this.prisma.class.findUnique({
            where: { id: classId },
        });
        if (!cls) {
            throw new common_1.NotFoundException('Class not found');
        }
        if (!cls.deletedAt) {
            throw new common_1.BadRequestException('Class must be soft deleted first');
        }
        const deleteAfter = new Date(cls.deletedAt.getTime() + gracePeriodMs);
        if (new Date() < deleteAfter) {
            const daysRemaining = Math.ceil((deleteAfter.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
            throw new common_1.ForbiddenException(`Cannot permanently delete class until grace period ends. ${daysRemaining} days remaining.`);
        }
        await this.prisma.class.delete({ where: { id: classId } });
        this.logger.log(`Class ${classId} permanently deleted by ${deletedBy || 'system'}`);
        return { message: 'Class permanently deleted', id: classId };
    }
    async permanentDeleteFile(fileId, deletedBy) {
        const file = await this.prisma.file.findUnique({
            where: { id: fileId },
        });
        if (!file) {
            throw new common_1.NotFoundException('File not found');
        }
        if (!file.isDeleted) {
            throw new common_1.BadRequestException('File must be soft deleted first');
        }
        await this.prisma.file.delete({ where: { id: fileId } });
        this.logger.log(`File ${fileId} permanently deleted by ${deletedBy || 'system'}`);
        return { message: 'File permanently deleted', id: fileId };
    }
    async getDeletedItems(type, includeDeleted) {
        const results = [];
        const gracePeriodMs = DEFAULT_GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000;
        if (!type || type === 'user') {
            const users = await this.prisma.user.findMany({
                where: { deletedAt: { not: null } },
                include: { userRoles: { include: { role: true } } },
            });
            results.push(...users.map(u => ({
                id: u.id,
                type: 'user',
                deletedAt: u.deletedAt,
                deletedBy: null,
                data: {
                    email: u.email,
                    firstName: u.firstName,
                    lastName: u.lastName,
                    roles: u.userRoles.map(ur => ur.role.name),
                },
                daysUntilPermanentDeletion: Math.max(0, Math.ceil((u.deletedAt.getTime() + gracePeriodMs - Date.now()) / (24 * 60 * 60 * 1000))),
            })));
        }
        if (!type || type === 'channel') {
            const channels = await this.prisma.channel.findMany({
                where: { deletedAt: { not: null } },
            });
            results.push(...channels.map(c => ({
                id: c.id,
                type: 'channel',
                deletedAt: c.deletedAt,
                deletedBy: null,
                data: {
                    name: c.name,
                    type: c.type,
                },
                daysUntilPermanentDeletion: Math.max(0, Math.ceil((c.deletedAt.getTime() + gracePeriodMs - Date.now()) / (24 * 60 * 60 * 1000))),
            })));
        }
        if (!type || type === 'message') {
            const messages = await this.prisma.message.findMany({
                where: { isDeleted: true },
                include: {
                    sender: { select: { id: true, firstName: true, lastName: true } },
                    channel: { select: { id: true, name: true } },
                },
            });
            results.push(...messages.map(m => ({
                id: m.id,
                type: 'message',
                deletedAt: m.deletedAt || m.createdAt,
                deletedBy: m.deletedBy,
                data: {
                    content: m.content.substring(0, 100) + (m.content.length > 100 ? '...' : ''),
                    sender: m.sender,
                    channel: m.channel,
                },
                daysUntilPermanentDeletion: m.deletedAt ? Math.max(0, Math.ceil((m.deletedAt.getTime() + gracePeriodMs - Date.now()) / (24 * 60 * 60 * 1000))) : 0,
            })));
        }
        if (!type || type === 'course') {
            const courses = await this.prisma.course.findMany({
                where: { deletedAt: { not: null } },
            });
            results.push(...courses.map(c => ({
                id: c.id,
                type: 'course',
                deletedAt: c.deletedAt,
                deletedBy: null,
                data: {
                    code: c.code,
                    name: c.name,
                    department: c.department,
                },
                daysUntilPermanentDeletion: Math.max(0, Math.ceil((c.deletedAt.getTime() + gracePeriodMs - Date.now()) / (24 * 60 * 60 * 1000))),
            })));
        }
        if (!type || type === 'class') {
            const classes = await this.prisma.class.findMany({
                where: { deletedAt: { not: null } },
                include: { course: { select: { code: true, name: true } } },
            });
            results.push(...classes.map(c => ({
                id: c.id,
                type: 'class',
                deletedAt: c.deletedAt,
                deletedBy: null,
                data: {
                    term: c.term,
                    section: c.section,
                    course: c.course,
                },
                daysUntilPermanentDeletion: Math.max(0, Math.ceil((c.deletedAt.getTime() + gracePeriodMs - Date.now()) / (24 * 60 * 60 * 1000))),
            })));
        }
        if (!type || type === 'file') {
            const files = await this.prisma.file.findMany({
                where: { isDeleted: true },
            });
            results.push(...files.map(f => ({
                id: f.id,
                type: 'file',
                deletedAt: f.deletedAt || f.createdAt,
                deletedBy: null,
                data: {
                    filename: f.filename,
                    originalName: f.originalName,
                    size: f.size,
                },
                daysUntilPermanentDeletion: f.deletedAt ? Math.max(0, Math.ceil((f.deletedAt.getTime() + gracePeriodMs - Date.now()) / (24 * 60 * 60 * 1000))) : 0,
            })));
        }
        return results.sort((a, b) => b.deletedAt.getTime() - a.deletedAt.getTime());
    }
    async cleanupOldDeletedItems() {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - DEFAULT_GRACE_PERIOD_DAYS);
        this.logger.log(`Starting cleanup of items soft-deleted before ${cutoffDate.toISOString()}`);
        const results = {
            users: 0,
            channels: 0,
            messages: 0,
            courses: 0,
            classes: 0,
            files: 0,
            total: 0,
        };
        try {
            const deletedUsers = await this.prisma.user.deleteMany({
                where: { deletedAt: { lt: cutoffDate } },
            });
            results.users = deletedUsers.count;
            results.total += deletedUsers.count;
            this.logger.log(`Permanently deleted ${deletedUsers.count} users`);
        }
        catch (error) {
            this.logger.error('Failed to delete old users:', error.message);
        }
        try {
            const deletedChannels = await this.prisma.channel.deleteMany({
                where: { deletedAt: { lt: cutoffDate } },
            });
            results.channels = deletedChannels.count;
            results.total += deletedChannels.count;
            this.logger.log(`Permanently deleted ${deletedChannels.count} channels`);
        }
        catch (error) {
            this.logger.error('Failed to delete old channels:', error.message);
        }
        try {
            const deletedCourses = await this.prisma.course.deleteMany({
                where: { deletedAt: { lt: cutoffDate } },
            });
            results.courses = deletedCourses.count;
            results.total += deletedCourses.count;
            this.logger.log(`Permanently deleted ${deletedCourses.count} courses`);
        }
        catch (error) {
            this.logger.error('Failed to delete old courses:', error.message);
        }
        try {
            const deletedClasses = await this.prisma.class.deleteMany({
                where: { deletedAt: { lt: cutoffDate } },
            });
            results.classes = deletedClasses.count;
            results.total += deletedClasses.count;
            this.logger.log(`Permanently deleted ${deletedClasses.count} classes`);
        }
        catch (error) {
            this.logger.error('Failed to delete old classes:', error.message);
        }
        try {
            const deletedFiles = await this.prisma.file.deleteMany({
                where: {
                    isDeleted: true,
                    deletedAt: { lt: cutoffDate },
                },
            });
            results.files = deletedFiles.count;
            results.total += deletedFiles.count;
            this.logger.log(`Permanently deleted ${deletedFiles.count} files`);
        }
        catch (error) {
            this.logger.error('Failed to delete old files:', error.message);
        }
        try {
            const deletedMessages = await this.prisma.message.deleteMany({
                where: {
                    isDeleted: true,
                    deletedAt: { lt: cutoffDate },
                },
            });
            results.messages = deletedMessages.count;
            results.total += deletedMessages.count;
            this.logger.log(`Permanently deleted ${deletedMessages.count} messages`);
        }
        catch (error) {
            this.logger.error('Failed to delete old messages:', error.message);
        }
        this.logger.log(`Cleanup completed. Total items deleted: ${results.total}`);
        return results;
    }
};
exports.SoftDeleteService = SoftDeleteService;
exports.SoftDeleteService = SoftDeleteService = SoftDeleteService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], SoftDeleteService);


/***/ }),
/* 127 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c, _d, _e;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SoftDeleteController = void 0;
const common_1 = __webpack_require__(2);
const swagger_1 = __webpack_require__(3);
const soft_delete_service_1 = __webpack_require__(126);
const jwt_auth_guard_1 = __webpack_require__(29);
const roles_guard_1 = __webpack_require__(32);
const roles_decorator_1 = __webpack_require__(33);
class SoftDeleteDto {
}
let SoftDeleteController = class SoftDeleteController {
    constructor(softDeleteService) {
        this.softDeleteService = softDeleteService;
    }
    async softDelete(type, id, dto, req) {
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
    async restore(type, id, req) {
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
    async permanentDelete(type, id, req) {
        return this.softDeleteService.permanentDelete(type, id, req.user.sub);
    }
    async getDeletedItems(type) {
        return this.softDeleteService.getDeletedItems(type);
    }
    async triggerCleanup(req) {
        const results = await this.softDeleteService.cleanupOldDeletedItems();
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
};
exports.SoftDeleteController = SoftDeleteController;
__decorate([
    (0, common_1.Delete)('soft-delete/:type/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Soft delete an item (user, channel, message, course, class, file)' }),
    __param(0, (0, common_1.Param)('type')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof soft_delete_service_1.SoftDeleteType !== "undefined" && soft_delete_service_1.SoftDeleteType) === "function" ? _b : Object, String, SoftDeleteDto, Object]),
    __metadata("design:returntype", Promise)
], SoftDeleteController.prototype, "softDelete", null);
__decorate([
    (0, common_1.Post)('restore/:type/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Restore a soft-deleted item' }),
    __param(0, (0, common_1.Param)('type')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_c = typeof soft_delete_service_1.SoftDeleteType !== "undefined" && soft_delete_service_1.SoftDeleteType) === "function" ? _c : Object, String, Object]),
    __metadata("design:returntype", Promise)
], SoftDeleteController.prototype, "restore", null);
__decorate([
    (0, common_1.Delete)('permanent-delete/:type/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Permanently delete an item (only after grace period)' }),
    __param(0, (0, common_1.Param)('type')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_d = typeof soft_delete_service_1.SoftDeleteType !== "undefined" && soft_delete_service_1.SoftDeleteType) === "function" ? _d : Object, String, Object]),
    __metadata("design:returntype", Promise)
], SoftDeleteController.prototype, "permanentDelete", null);
__decorate([
    (0, common_1.Get)('deleted-items'),
    (0, swagger_1.ApiOperation)({ summary: 'List all soft-deleted items' }),
    (0, swagger_1.ApiQuery)({ name: 'type', required: false, enum: ['user', 'channel', 'message', 'course', 'class', 'file'] }),
    __param(0, (0, common_1.Query)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_e = typeof soft_delete_service_1.SoftDeleteType !== "undefined" && soft_delete_service_1.SoftDeleteType) === "function" ? _e : Object]),
    __metadata("design:returntype", Promise)
], SoftDeleteController.prototype, "getDeletedItems", null);
__decorate([
    (0, common_1.Post)('cleanup-deleted-items'),
    (0, swagger_1.ApiOperation)({ summary: 'Trigger cleanup of items soft-deleted > 30 days ago' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SoftDeleteController.prototype, "triggerCleanup", null);
exports.SoftDeleteController = SoftDeleteController = __decorate([
    (0, swagger_1.ApiTags)('Admin - Soft Delete'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __metadata("design:paramtypes", [typeof (_a = typeof soft_delete_service_1.SoftDeleteService !== "undefined" && soft_delete_service_1.SoftDeleteService) === "function" ? _a : Object])
], SoftDeleteController);


/***/ }),
/* 128 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SoftDeleteCleanupService_1;
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SoftDeleteCleanupService = void 0;
const common_1 = __webpack_require__(2);
const schedule_1 = __webpack_require__(8);
const soft_delete_service_1 = __webpack_require__(126);
let SoftDeleteCleanupService = SoftDeleteCleanupService_1 = class SoftDeleteCleanupService {
    constructor(softDeleteService) {
        this.softDeleteService = softDeleteService;
        this.logger = new common_1.Logger(SoftDeleteCleanupService_1.name);
        this.isRunning = false;
    }
    async handleWeeklyCleanup() {
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
            this.logger.log(`Weekly cleanup completed in ${duration}ms. ` +
                `Deleted: ${results.total} items ` +
                `(users: ${results.users}, channels: ${results.channels}, ` +
                `messages: ${results.messages}, courses: ${results.courses}, ` +
                `classes: ${results.classes}, files: ${results.files})`);
        }
        catch (error) {
            this.logger.error('Weekly cleanup job failed:', error.message);
        }
        finally {
            this.isRunning = false;
        }
    }
    async runCleanupNow() {
        if (this.isRunning) {
            return { success: false, error: 'Cleanup job is already running' };
        }
        this.isRunning = true;
        this.logger.log('Starting manual soft delete cleanup...');
        try {
            const results = await this.softDeleteService.cleanupOldDeletedItems();
            return { success: true, results };
        }
        catch (error) {
            this.logger.error('Manual cleanup job failed:', error.message);
            return { success: false, error: error.message };
        }
        finally {
            this.isRunning = false;
        }
    }
    isCleanupRunning() {
        return this.isRunning;
    }
};
exports.SoftDeleteCleanupService = SoftDeleteCleanupService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_WEEK, {
        name: 'soft-delete-cleanup',
        timeZone: 'UTC',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SoftDeleteCleanupService.prototype, "handleWeeklyCleanup", null);
exports.SoftDeleteCleanupService = SoftDeleteCleanupService = SoftDeleteCleanupService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof soft_delete_service_1.SoftDeleteService !== "undefined" && soft_delete_service_1.SoftDeleteService) === "function" ? _a : Object])
], SoftDeleteCleanupService);


/***/ }),
/* 129 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UpdateModule = void 0;
const common_1 = __webpack_require__(2);
const update_controller_1 = __webpack_require__(130);
let UpdateModule = class UpdateModule {
};
exports.UpdateModule = UpdateModule;
exports.UpdateModule = UpdateModule = __decorate([
    (0, common_1.Module)({
        controllers: [update_controller_1.UpdateController],
    })
], UpdateModule);


/***/ }),
/* 130 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UpdateController = void 0;
const common_1 = __webpack_require__(2);
const swagger_1 = __webpack_require__(3);
const express_1 = __webpack_require__(16);
const fs_1 = __webpack_require__(100);
const path_1 = __webpack_require__(98);
let UpdateController = class UpdateController {
    constructor() {
        this.currentVersion = {
            versionCode: 2,
            versionName: '1.0.1',
            forceUpdate: false,
            updateUrl: '',
            changelog: [
                'Fixed login timeout issues - better error handling',
                'Improved connection stability',
                'Added SSL connection error handling',
                'UI/UX improvements',
            ],
            minVersionCode: 1,
        };
        const baseUrl = process.env.API_BASE_URL || '';
        this.currentVersion.updateUrl = baseUrl
            ? `${baseUrl}/downloads/pythagore-latest.apk`
            : '/downloads/pythagore-latest.apk';
    }
    async getVersion() {
        return {
            ...this.currentVersion,
            timestamp: new Date().toISOString(),
        };
    }
    async checkUpdate(body) {
        const { versionCode, platform } = body;
        const needsUpdate = versionCode < this.currentVersion.versionCode;
        const forceUpdate = versionCode < this.currentVersion.minVersionCode ||
            (needsUpdate && this.currentVersion.forceUpdate);
        return {
            hasUpdate: needsUpdate,
            forceUpdate,
            version: this.currentVersion.versionName,
            versionCode: this.currentVersion.versionCode,
            updateUrl: platform === 'android' ? this.currentVersion.updateUrl : null,
            changelog: this.currentVersion.changelog,
            message: needsUpdate
                ? `New version ${this.currentVersion.versionName} is available!`
                : 'You are using the latest version.',
        };
    }
    async getDownloadUrl() {
        return {
            url: this.currentVersion.updateUrl,
            version: this.currentVersion.versionName,
            versionCode: this.currentVersion.versionCode,
        };
    }
    async downloadApk(res) {
        const downloadsDir = (0, path_1.join)(process.cwd(), 'downloads');
        const filePath = (0, path_1.join)(downloadsDir, 'pythagore-latest.apk');
        if (!(0, fs_1.existsSync)(filePath)) {
            throw new common_1.NotFoundException('APK file not found. Please contact administrator.');
        }
        const file = (0, fs_1.createReadStream)(filePath);
        res.set({
            'Content-Type': 'application/vnd.android.package-archive',
            'Content-Disposition': `attachment; filename="pythagore-${this.currentVersion.versionName}.apk"`,
        });
        return new common_1.StreamableFile(file);
    }
};
exports.UpdateController = UpdateController;
__decorate([
    (0, common_1.Get)('version'),
    (0, swagger_1.ApiOperation)({ summary: 'Get latest app version info' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UpdateController.prototype, "getVersion", null);
__decorate([
    (0, common_1.Post)('check'),
    (0, swagger_1.ApiOperation)({ summary: 'Check if update is required' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UpdateController.prototype, "checkUpdate", null);
__decorate([
    (0, common_1.Get)('download/latest'),
    (0, swagger_1.ApiOperation)({ summary: 'Get download URL for latest APK' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UpdateController.prototype, "getDownloadUrl", null);
__decorate([
    (0, common_1.Get)('download/file'),
    (0, swagger_1.ApiOperation)({ summary: 'Download the latest APK file' }),
    __param(0, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_a = typeof express_1.Response !== "undefined" && express_1.Response) === "function" ? _a : Object]),
    __metadata("design:returntype", Promise)
], UpdateController.prototype, "downloadApk", null);
exports.UpdateController = UpdateController = __decorate([
    (0, swagger_1.ApiTags)('App Updates'),
    (0, common_1.Controller)('api/updates'),
    __metadata("design:paramtypes", [])
], UpdateController);


/***/ }),
/* 131 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MetricsModule = void 0;
const common_1 = __webpack_require__(2);
const nestjs_prometheus_1 = __webpack_require__(132);
const metrics_service_1 = __webpack_require__(30);
const metrics_controller_1 = __webpack_require__(133);
let MetricsModule = class MetricsModule {
};
exports.MetricsModule = MetricsModule;
exports.MetricsModule = MetricsModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [
            nestjs_prometheus_1.PrometheusModule.register({
                path: '/metrics',
                defaultMetrics: {
                    enabled: true,
                },
            }),
        ],
        controllers: [metrics_controller_1.MetricsController],
        providers: [metrics_service_1.MetricsService],
        exports: [metrics_service_1.MetricsService],
    })
], MetricsModule);


/***/ }),
/* 132 */
/***/ ((module) => {

module.exports = require("@willsoto/nestjs-prometheus");

/***/ }),
/* 133 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MetricsController = void 0;
const common_1 = __webpack_require__(2);
const express_1 = __webpack_require__(16);
const swagger_1 = __webpack_require__(3);
const prom_client_1 = __webpack_require__(31);
const metrics_service_1 = __webpack_require__(30);
const jwt_auth_guard_1 = __webpack_require__(29);
const roles_guard_1 = __webpack_require__(32);
const roles_decorator_1 = __webpack_require__(33);
let MetricsController = class MetricsController {
    constructor(metricsService) {
        this.metricsService = metricsService;
    }
    async getPrometheusMetrics(res) {
        const metrics = await prom_client_1.register.metrics();
        res.set('Content-Type', prom_client_1.register.contentType);
        res.end(metrics);
    }
    async getDashboard() {
        const metrics = await prom_client_1.register.getMetricsAsJSON();
        const dashboard = {
            timestamp: new Date().toISOString(),
            metrics: {},
        };
        for (const metric of metrics) {
            dashboard.metrics[metric.name] = {
                help: metric.help,
                type: metric.type,
                values: metric.values.map(v => ({
                    labels: v.labels,
                    value: v.value,
                })),
            };
        }
        return dashboard;
    }
    async getActiveUsers() {
        return {
            timestamp: new Date().toISOString(),
            activeUsers: 'See school_active_users gauge in Prometheus metrics',
            message: 'Use /metrics endpoint for Prometheus-compatible data',
        };
    }
    async getWebsocketConnections() {
        return {
            timestamp: new Date().toISOString(),
            websocketConnections: 'See school_websocket_connections gauge in Prometheus metrics',
            message: 'Use /metrics endpoint for Prometheus-compatible data',
        };
    }
};
exports.MetricsController = MetricsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Get Prometheus metrics',
        description: 'Returns metrics in Prometheus exposition format for scraping by Prometheus server',
    }),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof express_1.Response !== "undefined" && express_1.Response) === "function" ? _b : Object]),
    __metadata("design:returntype", Promise)
], MetricsController.prototype, "getPrometheusMetrics", null);
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Get metrics dashboard',
        description: 'Returns a human-readable JSON view of current metrics (admin only)',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MetricsController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)('active-users'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Get active users count',
        description: 'Returns current active users by role (admin only)',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MetricsController.prototype, "getActiveUsers", null);
__decorate([
    (0, common_1.Get)('websocket-connections'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Get WebSocket connections count',
        description: 'Returns current WebSocket connection count (admin only)',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MetricsController.prototype, "getWebsocketConnections", null);
exports.MetricsController = MetricsController = __decorate([
    (0, swagger_1.ApiTags)('Metrics'),
    (0, common_1.Controller)('metrics'),
    __metadata("design:paramtypes", [typeof (_a = typeof metrics_service_1.MetricsService !== "undefined" && metrics_service_1.MetricsService) === "function" ? _a : Object])
], MetricsController);


/***/ }),
/* 134 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PaymentsModule = void 0;
const common_1 = __webpack_require__(2);
const payments_controller_1 = __webpack_require__(135);
const payments_service_1 = __webpack_require__(136);
const prisma_module_1 = __webpack_require__(9);
let PaymentsModule = class PaymentsModule {
};
exports.PaymentsModule = PaymentsModule;
exports.PaymentsModule = PaymentsModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [payments_controller_1.PaymentsController],
        providers: [payments_service_1.PaymentsService],
        exports: [payments_service_1.PaymentsService],
    })
], PaymentsModule);


/***/ }),
/* 135 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PaymentsController = void 0;
const common_1 = __webpack_require__(2);
const swagger_1 = __webpack_require__(3);
const payments_service_1 = __webpack_require__(136);
const payments_dto_1 = __webpack_require__(137);
const jwt_auth_guard_1 = __webpack_require__(29);
const roles_guard_1 = __webpack_require__(32);
const roles_decorator_1 = __webpack_require__(33);
let PaymentsController = class PaymentsController {
    constructor(paymentsService) {
        this.paymentsService = paymentsService;
    }
    async getFeeBalance(studentId, req) {
        return this.paymentsService.getFeeBalance(studentId, req.user.sub, req.user.roles);
    }
    async getPaymentHistory(studentId, page, limit, req) {
        return this.paymentsService.getPaymentHistory(studentId, req.user.sub, req.user.roles, page ? parseInt(page) : 1, limit ? parseInt(limit) : 20);
    }
    async createPaymentIntent(dto, req) {
        return this.paymentsService.createPaymentIntent(dto, req.user.sub);
    }
    async confirmPayment(dto, req) {
        return this.paymentsService.confirmPayment(dto.paymentIntentId, req.user.sub);
    }
    async getReceipt(paymentId, req) {
        return this.paymentsService.getReceipt(paymentId, req.user.sub, req.user.roles);
    }
    async createInvoice(dto) {
        return this.paymentsService.createInvoice(dto);
    }
};
exports.PaymentsController = PaymentsController;
__decorate([
    (0, common_1.Get)('balance/:studentId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get fee balance and invoice list for a student' }),
    __param(0, (0, common_1.Param)('studentId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "getFeeBalance", null);
__decorate([
    (0, common_1.Get)('history/:studentId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get payment history for a student' }),
    __param(0, (0, common_1.Param)('studentId')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "getPaymentHistory", null);
__decorate([
    (0, common_1.Post)('intent'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a payment intent' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof payments_dto_1.CreatePaymentIntentDto !== "undefined" && payments_dto_1.CreatePaymentIntentDto) === "function" ? _b : Object, Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "createPaymentIntent", null);
__decorate([
    (0, common_1.Post)('confirm'),
    (0, swagger_1.ApiOperation)({ summary: 'Confirm a payment' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_c = typeof payments_dto_1.ConfirmPaymentDto !== "undefined" && payments_dto_1.ConfirmPaymentDto) === "function" ? _c : Object, Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "confirmPayment", null);
__decorate([
    (0, common_1.Get)('receipt/:paymentId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get payment receipt' }),
    __param(0, (0, common_1.Param)('paymentId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "getReceipt", null);
__decorate([
    (0, common_1.Post)('invoices'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new fee invoice (Admin only)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_d = typeof payments_dto_1.CreateInvoiceDto !== "undefined" && payments_dto_1.CreateInvoiceDto) === "function" ? _d : Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "createInvoice", null);
exports.PaymentsController = PaymentsController = __decorate([
    (0, swagger_1.ApiTags)('Payments'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('payments'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [typeof (_a = typeof payments_service_1.PaymentsService !== "undefined" && payments_service_1.PaymentsService) === "function" ? _a : Object])
], PaymentsController);


/***/ }),
/* 136 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PaymentsService = void 0;
const common_1 = __webpack_require__(2);
const prisma_service_1 = __webpack_require__(10);
let PaymentsService = class PaymentsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async verifyAccess(userId, userRoles, studentId) {
        if (userRoles?.includes('admin'))
            return;
        if (userId === studentId)
            return;
        const link = await this.prisma.parentStudent.findUnique({
            where: {
                parentId_studentId: {
                    parentId: userId,
                    studentId,
                },
            },
        });
        if (!link) {
            throw new common_1.ForbiddenException("You are not authorized to access this student's records");
        }
    }
    async createPaymentIntent(input, payerId) {
        const student = await this.prisma.user.findFirst({
            where: { id: input.studentId, userRoles: { some: { role: { name: 'student' } } } },
        });
        if (!student) {
            throw new common_1.NotFoundException('Student not found');
        }
        if (input.invoiceId) {
            const invoice = await this.prisma.feeInvoice.findUnique({
                where: { id: input.invoiceId },
            });
            if (!invoice) {
                throw new common_1.NotFoundException('Invoice not found');
            }
            if (invoice.studentId !== input.studentId) {
                throw new common_1.BadRequestException('Invoice does not belong to this student');
            }
        }
        const payment = await this.prisma.payment.create({
            data: {
                studentId: input.studentId,
                payerId,
                invoiceId: input.invoiceId,
                amount: input.amount,
                currency: input.currency || 'USD',
                status: 'pending',
                metadata: input.metadata || {},
            },
            include: {
                invoice: true,
            },
        });
        return {
            payment,
            clientSecret: `mock_secret_${payment.id}`,
        };
    }
    async confirmPayment(paymentId, payerId) {
        const payment = await this.prisma.payment.findUnique({
            where: { id: paymentId },
            include: { invoice: true },
        });
        if (!payment) {
            throw new common_1.NotFoundException('Payment not found');
        }
        if (payment.payerId !== payerId) {
            throw new common_1.BadRequestException('You are not authorized to confirm this payment');
        }
        if (payment.status !== 'pending') {
            throw new common_1.BadRequestException('Payment is not in pending status');
        }
        const updatedPayment = await this.prisma.payment.update({
            where: { id: paymentId },
            data: {
                status: 'completed',
                paidAt: new Date(),
                receiptUrl: `/receipts/${payment.id}.pdf`,
            },
            include: {
                invoice: true,
            },
        });
        if (payment.invoiceId) {
            await this.updateInvoiceStatus(payment.invoiceId);
        }
        return updatedPayment;
    }
    async updateInvoiceStatus(invoiceId) {
        const invoice = await this.prisma.feeInvoice.findUnique({
            where: { id: invoiceId },
            include: {
                payments: {
                    where: { status: 'completed' },
                },
            },
        });
        if (!invoice)
            return;
        const totalPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
        const totalAmount = Number(invoice.totalAmount);
        let status;
        if (totalPaid >= totalAmount) {
            status = 'paid';
        }
        else if (totalPaid > 0) {
            status = 'partial';
        }
        else if (new Date() > invoice.dueDate) {
            status = 'overdue';
        }
        else {
            status = 'pending';
        }
        await this.prisma.feeInvoice.update({
            where: { id: invoiceId },
            data: {
                paidAmount: totalPaid,
                status,
            },
        });
    }
    async getFeeBalance(studentId, userId, userRoles) {
        await this.verifyAccess(userId, userRoles, studentId);
        const invoices = await this.prisma.feeInvoice.findMany({
            where: { studentId },
            include: {
                payments: {
                    where: { status: 'completed' },
                },
            },
            orderBy: { dueDate: 'asc' },
        });
        const totalDue = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
        const totalPaid = invoices.reduce((sum, inv) => sum + inv.payments.reduce((pSum, p) => pSum + Number(p.amount), 0), 0);
        return {
            totalDue,
            totalPaid,
            remaining: totalDue - totalPaid,
            currency: 'USD',
            invoices: invoices.map((inv) => ({
                id: inv.id,
                title: inv.title,
                description: inv.description,
                items: inv.items,
                totalAmount: inv.totalAmount,
                paidAmount: inv.paidAmount,
                currency: inv.currency,
                dueDate: inv.dueDate,
                status: inv.status,
                createdAt: inv.createdAt,
            })),
        };
    }
    async getPaymentHistory(studentId, userId, userRoles, page = 1, limit = 20) {
        await this.verifyAccess(userId, userRoles, studentId);
        const skip = (page - 1) * limit;
        const [payments, total] = await Promise.all([
            this.prisma.payment.findMany({
                where: { studentId },
                include: {
                    invoice: {
                        select: { id: true, title: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.payment.count({ where: { studentId } }),
        ]);
        return {
            payments: payments.map((p) => ({
                id: p.id,
                amount: p.amount,
                currency: p.currency,
                status: p.status,
                paymentMethod: p.paymentMethod,
                paidAt: p.paidAt,
                receiptUrl: p.receiptUrl,
                createdAt: p.createdAt,
                invoice: p.invoice,
            })),
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }
    async createInvoice(input) {
        return this.prisma.feeInvoice.create({
            data: {
                studentId: input.studentId,
                title: input.title,
                description: input.description,
                items: input.items,
                totalAmount: input.totalAmount,
                currency: input.currency || 'USD',
                dueDate: input.dueDate,
                paidAmount: 0,
                status: 'pending',
            },
        });
    }
    async getReceipt(paymentId, userId, userRoles) {
        const payment = await this.prisma.payment.findUnique({
            where: { id: paymentId },
            include: {
                student: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
                payer: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
                invoice: true,
            },
        });
        if (!payment) {
            throw new common_1.NotFoundException('Payment not found');
        }
        if (payment.payerId !== userId && payment.studentId !== userId) {
            if (!userRoles?.includes('admin')) {
                throw new common_1.ForbiddenException('You are not authorized to view this receipt');
            }
        }
        return {
            payment: {
                id: payment.id,
                amount: payment.amount,
                currency: payment.currency,
                status: payment.status,
                paidAt: payment.paidAt,
                receiptUrl: payment.receiptUrl,
            },
            student: payment.student,
            payer: payment.payer,
            invoice: payment.invoice,
            generatedAt: new Date(),
        };
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], PaymentsService);


/***/ }),
/* 137 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FeeBalanceDto = exports.InvoiceResponseDto = exports.PaymentResponseDto = exports.CreateInvoiceDto = exports.InvoiceItemDto = exports.ConfirmPaymentDto = exports.CreatePaymentIntentDto = exports.InvoiceStatus = exports.PaymentMethod = exports.PaymentStatus = void 0;
const class_validator_1 = __webpack_require__(23);
const swagger_1 = __webpack_require__(3);
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "pending";
    PaymentStatus["COMPLETED"] = "completed";
    PaymentStatus["FAILED"] = "failed";
    PaymentStatus["REFUNDED"] = "refunded";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["CARD"] = "card";
    PaymentMethod["BANK_TRANSFER"] = "bank_transfer";
    PaymentMethod["CASH"] = "cash";
})(PaymentMethod || (exports.PaymentMethod = PaymentMethod = {}));
var InvoiceStatus;
(function (InvoiceStatus) {
    InvoiceStatus["PENDING"] = "pending";
    InvoiceStatus["PARTIAL"] = "partial";
    InvoiceStatus["PAID"] = "paid";
    InvoiceStatus["OVERDUE"] = "overdue";
})(InvoiceStatus || (exports.InvoiceStatus = InvoiceStatus = {}));
class CreatePaymentIntentDto {
    constructor() {
        this.currency = 'USD';
    }
}
exports.CreatePaymentIntentDto = CreatePaymentIntentDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Amount in cents' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreatePaymentIntentDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ default: 'USD' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreatePaymentIntentDto.prototype, "currency", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreatePaymentIntentDto.prototype, "studentId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreatePaymentIntentDto.prototype, "invoiceId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", typeof (_a = typeof Record !== "undefined" && Record) === "function" ? _a : Object)
], CreatePaymentIntentDto.prototype, "metadata", void 0);
class ConfirmPaymentDto {
}
exports.ConfirmPaymentDto = ConfirmPaymentDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConfirmPaymentDto.prototype, "paymentIntentId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: PaymentMethod }),
    (0, class_validator_1.IsEnum)(PaymentMethod),
    __metadata("design:type", String)
], ConfirmPaymentDto.prototype, "paymentMethod", void 0);
class InvoiceItemDto {
}
exports.InvoiceItemDto = InvoiceItemDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], InvoiceItemDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], InvoiceItemDto.prototype, "amount", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InvoiceItemDto.prototype, "category", void 0);
class CreateInvoiceDto {
}
exports.CreateInvoiceDto = CreateInvoiceDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateInvoiceDto.prototype, "studentId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Invoice title is required' }),
    __metadata("design:type", String)
], CreateInvoiceDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateInvoiceDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: 'array', items: { type: 'object' } }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Invoice items are required' }),
    __metadata("design:type", Array)
], CreateInvoiceDto.prototype, "items", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateInvoiceDto.prototype, "totalAmount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ default: 'USD' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateInvoiceDto.prototype, "currency", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsDateString)({}, { message: 'Due date must be a valid ISO date string' }),
    __metadata("design:type", typeof (_b = typeof Date !== "undefined" && Date) === "function" ? _b : Object)
], CreateInvoiceDto.prototype, "dueDate", void 0);
class PaymentResponseDto {
}
exports.PaymentResponseDto = PaymentResponseDto;
class InvoiceResponseDto {
}
exports.InvoiceResponseDto = InvoiceResponseDto;
class FeeBalanceDto {
}
exports.FeeBalanceDto = FeeBalanceDto;


/***/ }),
/* 138 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ParentModule = void 0;
const common_1 = __webpack_require__(2);
const parent_controller_1 = __webpack_require__(139);
const parent_service_1 = __webpack_require__(140);
const prisma_module_1 = __webpack_require__(9);
let ParentModule = class ParentModule {
};
exports.ParentModule = ParentModule;
exports.ParentModule = ParentModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [parent_controller_1.ParentController],
        providers: [parent_service_1.ParentService],
        exports: [parent_service_1.ParentService],
    })
], ParentModule);


/***/ }),
/* 139 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ParentController = void 0;
const common_1 = __webpack_require__(2);
const swagger_1 = __webpack_require__(3);
const parent_service_1 = __webpack_require__(140);
const jwt_auth_guard_1 = __webpack_require__(29);
const roles_guard_1 = __webpack_require__(32);
const roles_decorator_1 = __webpack_require__(33);
let ParentController = class ParentController {
    constructor(parentService) {
        this.parentService = parentService;
    }
    async getLinkedChildren(req) {
        return this.parentService.getLinkedChildren(req.user.sub);
    }
    async getStudentProgress(studentId, req) {
        return this.parentService.getStudentProgress(req.user.sub, studentId);
    }
    async getTeacherContacts(studentId, req) {
        return this.parentService.getTeacherContacts(req.user.sub, studentId);
    }
    async getDashboardStats(req) {
        return this.parentService.getDashboardStats(req.user.sub);
    }
};
exports.ParentController = ParentController;
__decorate([
    (0, common_1.Get)('children'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all children linked to the parent' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ParentController.prototype, "getLinkedChildren", null);
__decorate([
    (0, common_1.Get)('children/:studentId/progress'),
    (0, swagger_1.ApiOperation)({ summary: 'Get detailed progress for a specific child' }),
    __param(0, (0, common_1.Param)('studentId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ParentController.prototype, "getStudentProgress", null);
__decorate([
    (0, common_1.Get)('children/:studentId/teachers'),
    (0, swagger_1.ApiOperation)({ summary: 'Get teacher contacts for a specific child' }),
    __param(0, (0, common_1.Param)('studentId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ParentController.prototype, "getTeacherContacts", null);
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, swagger_1.ApiOperation)({ summary: 'Get parent dashboard statistics' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ParentController.prototype, "getDashboardStats", null);
exports.ParentController = ParentController = __decorate([
    (0, swagger_1.ApiTags)('Parent'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('parent'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('parent', 'admin'),
    __metadata("design:paramtypes", [typeof (_a = typeof parent_service_1.ParentService !== "undefined" && parent_service_1.ParentService) === "function" ? _a : Object])
], ParentController);


/***/ }),
/* 140 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ParentService = void 0;
const common_1 = __webpack_require__(2);
const prisma_service_1 = __webpack_require__(10);
let ParentService = class ParentService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getLinkedChildren(parentId) {
        const parentStudents = await this.prisma.parentStudent.findMany({
            where: { parentId },
            include: {
                student: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        gradeLevel: true,
                        avatarUrl: true,
                    },
                },
            },
        });
        return parentStudents.map((ps) => ps.student);
    }
    async getStudentProgress(parentId, studentId) {
        const link = await this.prisma.parentStudent.findUnique({
            where: {
                parentId_studentId: {
                    parentId,
                    studentId,
                },
            },
        });
        if (!link) {
            throw new common_1.NotFoundException('Student not found or not linked to parent');
        }
        const student = await this.prisma.user.findUnique({
            where: { id: studentId },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                gradeLevel: true,
                avatarUrl: true,
            },
        });
        if (!student) {
            throw new common_1.NotFoundException('Student not found');
        }
        const enrollments = await this.prisma.classEnrollment.findMany({
            where: {
                studentId,
                status: 'active',
            },
            include: {
                class: {
                    include: {
                        course: true,
                        assignments: {
                            include: {
                                grades: {
                                    where: { studentId },
                                },
                            },
                        },
                    },
                },
            },
        });
        const courses = enrollments.map((enrollment) => {
            const classAssignments = enrollment.class.assignments;
            const grades = classAssignments
                .flatMap((a) => a.grades)
                .filter((g) => g.score !== null);
            const totalScore = grades.reduce((sum, g) => sum + g.score, 0);
            const totalMaxScore = grades.reduce((sum, g) => sum + g.maxScore, 0);
            const percentage = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0;
            const letterGrade = this.calculateLetterGrade(percentage);
            const totalAssignments = classAssignments.length;
            const completedAssignments = classAssignments.filter((a) => a.grades.some((g) => g.studentId === studentId)).length;
            const progress = totalAssignments > 0 ? (completedAssignments / totalAssignments) * 100 : 0;
            return {
                id: enrollment.class.course.id,
                name: enrollment.class.course.name,
                code: enrollment.class.course.code,
                grade: percentage,
                letterGrade,
                progress,
            };
        });
        const gpa = courses.length > 0
            ? courses.reduce((sum, c) => sum + this.letterGradeToGPA(c.letterGrade), 0) / courses.length
            : 0;
        const recentGrades = await this.prisma.grade.findMany({
            where: { studentId },
            include: {
                assignment: {
                    select: {
                        title: true,
                        class: {
                            select: {
                                course: {
                                    select: { name: true },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: { gradedAt: 'desc' },
            take: 5,
        });
        const attendanceRecords = await this.prisma.attendanceRecord.findMany({
            where: { studentId },
        });
        const present = attendanceRecords.filter((r) => r.status === 'present').length;
        const absent = attendanceRecords.filter((r) => r.status === 'absent').length;
        const late = attendanceRecords.filter((r) => r.status === 'late').length;
        const excused = attendanceRecords.filter((r) => r.status === 'excused').length;
        const total = attendanceRecords.length;
        const attendanceRate = total > 0 ? ((present + late) / total) * 100 : 0;
        const allAssignments = await this.prisma.assignment.findMany({
            where: {
                class: {
                    enrollments: {
                        some: { studentId },
                    },
                },
            },
        });
        const submissions = await this.prisma.submission.findMany({
            where: { studentId },
        });
        return {
            ...student,
            gpa: parseFloat(gpa.toFixed(2)),
            attendanceRate: parseFloat(attendanceRate.toFixed(1)),
            totalAssignments: allAssignments.length,
            completedAssignments: submissions.length,
            courses,
            recentGrades: recentGrades.map((g) => ({
                id: g.id,
                assignmentName: g.assignment.title,
                courseName: g.assignment.class.course.name,
                score: g.score,
                maxScore: g.maxScore,
                earnedAt: g.gradedAt,
            })),
            attendanceSummary: {
                present,
                absent,
                late,
                excused,
                rate: parseFloat(attendanceRate.toFixed(1)),
            },
        };
    }
    async getTeacherContacts(parentId, studentId) {
        const link = await this.prisma.parentStudent.findUnique({
            where: {
                parentId_studentId: {
                    parentId,
                    studentId,
                },
            },
        });
        if (!link) {
            throw new common_1.NotFoundException('Student not found or not linked to parent');
        }
        const enrollments = await this.prisma.classEnrollment.findMany({
            where: { studentId },
            include: {
                class: {
                    include: {
                        teachers: {
                            include: {
                                teacher: {
                                    select: {
                                        id: true,
                                        firstName: true,
                                        lastName: true,
                                        email: true,
                                        avatarUrl: true,
                                    },
                                },
                            },
                        },
                        course: {
                            select: {
                                id: true,
                                name: true,
                                code: true,
                            },
                        },
                    },
                },
            },
        });
        const teacherMap = new Map();
        for (const enrollment of enrollments) {
            for (const classTeacher of enrollment.class.teachers) {
                const teacher = classTeacher.teacher;
                if (!teacherMap.has(teacher.id)) {
                    teacherMap.set(teacher.id, {
                        ...teacher,
                        courses: [],
                    });
                }
                teacherMap.get(teacher.id).courses.push({
                    id: enrollment.class.course.id,
                    name: enrollment.class.course.name,
                    code: enrollment.class.course.code,
                });
            }
        }
        const teachers = Array.from(teacherMap.values());
        for (const teacher of teachers) {
            const channel = await this.prisma.channel.findFirst({
                where: {
                    type: 'direct_message',
                    members: {
                        every: {
                            userId: { in: [parentId, teacher.id] },
                        },
                    },
                },
            });
            teacher.channelId = channel?.id;
        }
        return teachers;
    }
    async getDashboardStats(parentId) {
        const children = await this.getLinkedChildren(parentId);
        let totalOutstandingFees = 0;
        for (const child of children) {
            const invoices = await this.prisma.feeInvoice.findMany({
                where: {
                    studentId: child.id,
                    status: { in: ['pending', 'partial', 'overdue'] },
                },
            });
            totalOutstandingFees += invoices.reduce((sum, inv) => sum + (Number(inv.totalAmount) - Number(inv.paidAmount)), 0);
        }
        const upcomingConferences = await this.prisma.conference.count({
            where: {
                parentId,
                status: 'confirmed',
                confirmedDate: {
                    gte: new Date(),
                },
            },
        });
        const unreadChannels = await this.prisma.channelMember.findMany({
            where: {
                userId: parentId,
            },
            include: {
                channel: {
                    include: {
                        messages: {
                            orderBy: { createdAt: 'desc' },
                            take: 1,
                        },
                    },
                },
            },
        });
        const unreadMessages = unreadChannels.filter((cm) => {
            const lastMessage = cm.channel.messages[0];
            return lastMessage && (!cm.lastReadAt || cm.lastReadAt < lastMessage.createdAt);
        }).length;
        let pendingAssignments = 0;
        for (const child of children) {
            const assignments = await this.prisma.assignment.findMany({
                where: {
                    class: {
                        enrollments: {
                            some: { studentId: child.id },
                        },
                    },
                    dueDate: { gte: new Date() },
                },
                include: {
                    submissions: {
                        where: { studentId: child.id },
                    },
                },
            });
            pendingAssignments += assignments.filter((a) => a.submissions.length === 0).length;
        }
        const recentActivity = await this.getRecentActivity(parentId, children);
        return {
            totalChildren: children.length,
            totalOutstandingFees,
            upcomingConferences,
            unreadMessages,
            pendingAssignments,
            recentActivity,
        };
    }
    async getRecentActivity(parentId, children) {
        const activity = [];
        const childIds = children.map((c) => c.id);
        const recentGrades = await this.prisma.grade.findMany({
            where: { studentId: { in: childIds } },
            include: {
                student: { select: { firstName: true, lastName: true } },
                assignment: { select: { title: true } },
            },
            orderBy: { gradedAt: 'desc' },
            take: 3,
        });
        for (const grade of recentGrades) {
            activity.push({
                id: `grade-${grade.id}`,
                type: 'grade',
                title: 'New Grade Posted',
                description: `${grade.assignment.title}: ${grade.score}/${grade.maxScore}`,
                studentName: `${grade.student.firstName} ${grade.student.lastName}`,
                timestamp: grade.gradedAt,
            });
        }
        const recentAttendance = await this.prisma.attendanceRecord.findMany({
            where: {
                studentId: { in: childIds },
                status: { in: ['absent', 'late'] },
            },
            include: {
                student: { select: { firstName: true, lastName: true } },
                session: { select: { date: true } },
            },
            orderBy: { markedAt: 'desc' },
            take: 2,
        });
        for (const record of recentAttendance) {
            activity.push({
                id: `attendance-${record.id}`,
                type: 'attendance',
                title: `Marked ${record.status}`,
                description: `Attendance on ${record.session.date.toLocaleDateString()}`,
                studentName: `${record.student.firstName} ${record.student.lastName}`,
                timestamp: record.markedAt,
            });
        }
        return activity.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 5);
    }
    calculateLetterGrade(percentage) {
        if (percentage >= 97)
            return 'A+';
        if (percentage >= 93)
            return 'A';
        if (percentage >= 90)
            return 'A-';
        if (percentage >= 87)
            return 'B+';
        if (percentage >= 83)
            return 'B';
        if (percentage >= 80)
            return 'B-';
        if (percentage >= 77)
            return 'C+';
        if (percentage >= 73)
            return 'C';
        if (percentage >= 70)
            return 'C-';
        if (percentage >= 67)
            return 'D+';
        if (percentage >= 63)
            return 'D';
        if (percentage >= 60)
            return 'D-';
        return 'F';
    }
    letterGradeToGPA(letterGrade) {
        const gpaMap = {
            'A+': 4.0, 'A': 4.0, 'A-': 3.7,
            'B+': 3.3, 'B': 3.0, 'B-': 2.7,
            'C+': 2.3, 'C': 2.0, 'C-': 1.7,
            'D+': 1.3, 'D': 1.0, 'D-': 0.7,
            'F': 0.0,
        };
        return gpaMap[letterGrade] || 0;
    }
};
exports.ParentService = ParentService;
exports.ParentService = ParentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], ParentService);


/***/ }),
/* 141 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ConferencesModule = void 0;
const common_1 = __webpack_require__(2);
const conferences_controller_1 = __webpack_require__(142);
const conferences_service_1 = __webpack_require__(143);
const prisma_module_1 = __webpack_require__(9);
let ConferencesModule = class ConferencesModule {
};
exports.ConferencesModule = ConferencesModule;
exports.ConferencesModule = ConferencesModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [conferences_controller_1.ConferencesController],
        providers: [conferences_service_1.ConferencesService],
        exports: [conferences_service_1.ConferencesService],
    })
], ConferencesModule);


/***/ }),
/* 142 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ConferencesController = void 0;
const common_1 = __webpack_require__(2);
const swagger_1 = __webpack_require__(3);
const conferences_service_1 = __webpack_require__(143);
const conferences_dto_1 = __webpack_require__(144);
const jwt_auth_guard_1 = __webpack_require__(29);
const roles_guard_1 = __webpack_require__(32);
const roles_decorator_1 = __webpack_require__(33);
let ConferencesController = class ConferencesController {
    constructor(conferencesService) {
        this.conferencesService = conferencesService;
    }
    async getConferencesForStudent(studentId, req) {
        return this.conferencesService.getConferencesForStudent(studentId, req.user.sub);
    }
    async getMyConferences(req) {
        const role = req.user.roles.includes('parent') ? 'parent' : 'teacher';
        return this.conferencesService.getConferencesForUser(req.user.sub, role);
    }
    async getUpcomingConferences(req) {
        const role = req.user.roles.includes('parent') ? 'parent' : 'teacher';
        return this.conferencesService.getUpcomingConferences(req.user.sub, role);
    }
    async createConference(dto, req) {
        return this.conferencesService.createConference(dto, req.user.sub);
    }
    async confirmConference(id, dto, req) {
        return this.conferencesService.confirmConference(id, req.user.sub, dto.confirmedDate, dto.meetingLink);
    }
    async cancelConference(id, dto, req) {
        return this.conferencesService.cancelConference(id, req.user.sub, dto.reason);
    }
};
exports.ConferencesController = ConferencesController;
__decorate([
    (0, common_1.Get)('student/:studentId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all conferences for a student' }),
    __param(0, (0, common_1.Param)('studentId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ConferencesController.prototype, "getConferencesForStudent", null);
__decorate([
    (0, common_1.Get)('my'),
    (0, swagger_1.ApiOperation)({ summary: 'Get conferences for the current user' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ConferencesController.prototype, "getMyConferences", null);
__decorate([
    (0, common_1.Get)('upcoming'),
    (0, swagger_1.ApiOperation)({ summary: 'Get upcoming confirmed conferences' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ConferencesController.prototype, "getUpcomingConferences", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('parent'),
    (0, swagger_1.ApiOperation)({ summary: 'Request a new conference (Parent only)' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof conferences_dto_1.CreateConferenceDto !== "undefined" && conferences_dto_1.CreateConferenceDto) === "function" ? _b : Object, Object]),
    __metadata("design:returntype", Promise)
], ConferencesController.prototype, "createConference", null);
__decorate([
    (0, common_1.Patch)(':id/confirm'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('teacher'),
    (0, swagger_1.ApiOperation)({ summary: 'Confirm a conference (Teacher only)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_c = typeof conferences_dto_1.ConfirmConferenceDto !== "undefined" && conferences_dto_1.ConfirmConferenceDto) === "function" ? _c : Object, Object]),
    __metadata("design:returntype", Promise)
], ConferencesController.prototype, "confirmConference", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Cancel a conference' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_d = typeof conferences_dto_1.CancelConferenceDto !== "undefined" && conferences_dto_1.CancelConferenceDto) === "function" ? _d : Object, Object]),
    __metadata("design:returntype", Promise)
], ConferencesController.prototype, "cancelConference", null);
exports.ConferencesController = ConferencesController = __decorate([
    (0, swagger_1.ApiTags)('Conferences'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('conferences'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [typeof (_a = typeof conferences_service_1.ConferencesService !== "undefined" && conferences_service_1.ConferencesService) === "function" ? _a : Object])
], ConferencesController);


/***/ }),
/* 143 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ConferencesService = void 0;
const common_1 = __webpack_require__(2);
const prisma_service_1 = __webpack_require__(10);
let ConferencesService = class ConferencesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createConference(input, parentId) {
        const link = await this.prisma.parentStudent.findUnique({
            where: {
                parentId_studentId: {
                    parentId,
                    studentId: input.studentId,
                },
            },
        });
        if (!link) {
            throw new common_1.BadRequestException('Student not linked to parent');
        }
        const teacher = await this.prisma.user.findFirst({
            where: {
                id: input.teacherId,
                userRoles: { some: { role: { name: 'teacher' } } },
            },
        });
        if (!teacher) {
            throw new common_1.NotFoundException('Teacher not found');
        }
        const teachesStudent = await this.prisma.classTeacher.findFirst({
            where: {
                teacherId: input.teacherId,
                class: {
                    enrollments: {
                        some: { studentId: input.studentId },
                    },
                },
            },
        });
        if (!teachesStudent) {
            throw new common_1.BadRequestException('Teacher does not teach this student');
        }
        return this.prisma.conference.create({
            data: {
                studentId: input.studentId,
                parentId,
                teacherId: input.teacherId,
                proposedDates: input.proposedDates,
                durationMinutes: input.durationMinutes || 30,
                status: 'requested',
                notes: input.notes,
            },
            include: {
                student: { select: { id: true, firstName: true, lastName: true } },
                teacher: { select: { id: true, firstName: true, lastName: true, email: true } },
            },
        });
    }
    async getConferencesForStudent(studentId, userId) {
        const hasAccess = await this.verifyAccess(userId, studentId);
        if (!hasAccess) {
            throw new common_1.BadRequestException('No access to this student');
        }
        return this.prisma.conference.findMany({
            where: { studentId },
            include: {
                student: { select: { id: true, firstName: true, lastName: true } },
                teacher: { select: { id: true, firstName: true, lastName: true, email: true } },
                parent: { select: { id: true, firstName: true, lastName: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getConferencesForUser(userId, role) {
        const where = role === 'parent' ? { parentId: userId } : { teacherId: userId };
        return this.prisma.conference.findMany({
            where,
            include: {
                student: { select: { id: true, firstName: true, lastName: true } },
                teacher: { select: { id: true, firstName: true, lastName: true, email: true } },
                parent: { select: { id: true, firstName: true, lastName: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async confirmConference(conferenceId, teacherId, confirmedDate, meetingLink) {
        const conference = await this.prisma.conference.findUnique({
            where: { id: conferenceId },
        });
        if (!conference) {
            throw new common_1.NotFoundException('Conference not found');
        }
        if (conference.teacherId !== teacherId) {
            throw new common_1.BadRequestException('Only the assigned teacher can confirm');
        }
        if (conference.status !== 'requested') {
            throw new common_1.BadRequestException('Conference cannot be confirmed');
        }
        const proposedDates = conference.proposedDates;
        if (!proposedDates.includes(confirmedDate)) {
            throw new common_1.BadRequestException('Confirmed date must be one of the proposed dates');
        }
        return this.prisma.conference.update({
            where: { id: conferenceId },
            data: {
                status: 'confirmed',
                confirmedDate: new Date(confirmedDate),
                meetingLink,
            },
            include: {
                student: { select: { id: true, firstName: true, lastName: true } },
                teacher: { select: { id: true, firstName: true, lastName: true, email: true } },
                parent: { select: { id: true, firstName: true, lastName: true } },
            },
        });
    }
    async cancelConference(conferenceId, userId, reason) {
        const conference = await this.prisma.conference.findUnique({
            where: { id: conferenceId },
        });
        if (!conference) {
            throw new common_1.NotFoundException('Conference not found');
        }
        if (conference.parentId !== userId && conference.teacherId !== userId) {
            throw new common_1.BadRequestException('Not authorized to cancel this conference');
        }
        if (conference.status === 'cancelled' ||
            conference.status === 'completed') {
            throw new common_1.BadRequestException('Conference cannot be cancelled');
        }
        return this.prisma.conference.update({
            where: { id: conferenceId },
            data: {
                status: 'cancelled',
                cancelledBy: userId,
                cancelledReason: reason,
            },
            include: {
                student: { select: { id: true, firstName: true, lastName: true } },
                teacher: { select: { id: true, firstName: true, lastName: true, email: true } },
                parent: { select: { id: true, firstName: true, lastName: true } },
            },
        });
    }
    async getUpcomingConferences(userId, role) {
        const where = {
            ...(role === 'parent' ? { parentId: userId } : { teacherId: userId }),
            status: 'confirmed',
            confirmedDate: {
                gte: new Date(),
            },
        };
        return this.prisma.conference.findMany({
            where,
            include: {
                student: { select: { id: true, firstName: true, lastName: true } },
                teacher: { select: { id: true, firstName: true, lastName: true, email: true } },
                parent: { select: { id: true, firstName: true, lastName: true } },
            },
            orderBy: { confirmedDate: 'asc' },
        });
    }
    async verifyAccess(userId, studentId) {
        const parentLink = await this.prisma.parentStudent.findUnique({
            where: {
                parentId_studentId: {
                    parentId: userId,
                    studentId,
                },
            },
        });
        if (parentLink)
            return true;
        const teacherLink = await this.prisma.classTeacher.findFirst({
            where: {
                teacherId: userId,
                class: {
                    enrollments: {
                        some: { studentId },
                    },
                },
            },
        });
        if (teacherLink)
            return true;
        if (userId === studentId)
            return true;
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { userRoles: { include: { role: true } } },
        });
        return user?.userRoles.some((ur) => ur.role.name === 'admin') ?? false;
    }
};
exports.ConferencesService = ConferencesService;
exports.ConferencesService = ConferencesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], ConferencesService);


/***/ }),
/* 144 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ConferenceResponseDto = exports.CancelConferenceDto = exports.ConfirmConferenceDto = exports.CreateConferenceDto = exports.ConferenceStatus = void 0;
const class_validator_1 = __webpack_require__(23);
const swagger_1 = __webpack_require__(3);
var ConferenceStatus;
(function (ConferenceStatus) {
    ConferenceStatus["REQUESTED"] = "requested";
    ConferenceStatus["CONFIRMED"] = "confirmed";
    ConferenceStatus["CANCELLED"] = "cancelled";
    ConferenceStatus["COMPLETED"] = "completed";
    ConferenceStatus["NO_SHOW"] = "no_show";
})(ConferenceStatus || (exports.ConferenceStatus = ConferenceStatus = {}));
class CreateConferenceDto {
    constructor() {
        this.durationMinutes = 30;
    }
}
exports.CreateConferenceDto = CreateConferenceDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateConferenceDto.prototype, "studentId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateConferenceDto.prototype, "teacherId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String], example: ['2026-03-01T14:00:00Z', '2026-03-02T15:00:00Z'] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsDateString)({}, { each: true }),
    __metadata("design:type", Array)
], CreateConferenceDto.prototype, "proposedDates", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, default: 30 }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateConferenceDto.prototype, "durationMinutes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateConferenceDto.prototype, "notes", void 0);
class ConfirmConferenceDto {
}
exports.ConfirmConferenceDto = ConfirmConferenceDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], ConfirmConferenceDto.prototype, "confirmedDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ConfirmConferenceDto.prototype, "meetingLink", void 0);
class CancelConferenceDto {
}
exports.CancelConferenceDto = CancelConferenceDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CancelConferenceDto.prototype, "reason", void 0);
class ConferenceResponseDto {
}
exports.ConferenceResponseDto = ConferenceResponseDto;


/***/ }),
/* 145 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ReportCardsModule = void 0;
const common_1 = __webpack_require__(2);
const report_cards_controller_1 = __webpack_require__(146);
const report_cards_service_1 = __webpack_require__(147);
const prisma_module_1 = __webpack_require__(9);
let ReportCardsModule = class ReportCardsModule {
};
exports.ReportCardsModule = ReportCardsModule;
exports.ReportCardsModule = ReportCardsModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [report_cards_controller_1.ReportCardsController],
        providers: [report_cards_service_1.ReportCardsService],
        exports: [report_cards_service_1.ReportCardsService],
    })
], ReportCardsModule);


/***/ }),
/* 146 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ReportCardsController = void 0;
const common_1 = __webpack_require__(2);
const swagger_1 = __webpack_require__(3);
const report_cards_service_1 = __webpack_require__(147);
const report_cards_dto_1 = __webpack_require__(148);
const jwt_auth_guard_1 = __webpack_require__(29);
const roles_guard_1 = __webpack_require__(32);
const roles_decorator_1 = __webpack_require__(33);
let ReportCardsController = class ReportCardsController {
    constructor(reportCardsService) {
        this.reportCardsService = reportCardsService;
    }
    async getReportCardsForStudent(studentId, req) {
        return this.reportCardsService.getReportCardsForStudent(studentId, req.user.sub);
    }
    async getLatestReportCard(studentId, req) {
        return this.reportCardsService.getLatestReportCard(studentId, req.user.sub);
    }
    async getReportCardById(id, req) {
        return this.reportCardsService.getReportCardById(id, req.user.sub);
    }
    async createReportCard(dto) {
        return this.reportCardsService.createReportCard(dto);
    }
    async acknowledgeReportCard(id, req) {
        return this.reportCardsService.acknowledgeReportCard(id, req.user.sub);
    }
    async generateReportCard(studentId, academicYearId, term) {
        return this.reportCardsService.generateReportCard(studentId, academicYearId, term);
    }
};
exports.ReportCardsController = ReportCardsController;
__decorate([
    (0, common_1.Get)('student/:studentId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all report cards for a student' }),
    __param(0, (0, common_1.Param)('studentId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ReportCardsController.prototype, "getReportCardsForStudent", null);
__decorate([
    (0, common_1.Get)('student/:studentId/latest'),
    (0, swagger_1.ApiOperation)({ summary: 'Get the latest report card for a student' }),
    __param(0, (0, common_1.Param)('studentId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ReportCardsController.prototype, "getLatestReportCard", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a specific report card by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ReportCardsController.prototype, "getReportCardById", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'teacher'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new report card (Admin/Teacher only)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof report_cards_dto_1.CreateReportCardDto !== "undefined" && report_cards_dto_1.CreateReportCardDto) === "function" ? _b : Object]),
    __metadata("design:returntype", Promise)
], ReportCardsController.prototype, "createReportCard", null);
__decorate([
    (0, common_1.Post)(':id/acknowledge'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('parent'),
    (0, swagger_1.ApiOperation)({ summary: 'Acknowledge a report card (Parent only)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ReportCardsController.prototype, "acknowledgeReportCard", null);
__decorate([
    (0, common_1.Post)('generate'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'teacher'),
    (0, swagger_1.ApiOperation)({ summary: 'Generate a report card automatically (Admin/Teacher only)' }),
    __param(0, (0, common_1.Query)('studentId')),
    __param(1, (0, common_1.Query)('academicYearId')),
    __param(2, (0, common_1.Query)('term')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ReportCardsController.prototype, "generateReportCard", null);
exports.ReportCardsController = ReportCardsController = __decorate([
    (0, swagger_1.ApiTags)('Report Cards'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('report-cards'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [typeof (_a = typeof report_cards_service_1.ReportCardsService !== "undefined" && report_cards_service_1.ReportCardsService) === "function" ? _a : Object])
], ReportCardsController);


/***/ }),
/* 147 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ReportCardsService = void 0;
const common_1 = __webpack_require__(2);
const prisma_service_1 = __webpack_require__(10);
let ReportCardsService = class ReportCardsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createReportCard(input) {
        const student = await this.prisma.user.findFirst({
            where: {
                id: input.studentId,
                userRoles: { some: { role: { name: 'student' } } },
            },
        });
        if (!student) {
            throw new common_1.NotFoundException('Student not found');
        }
        const academicYear = await this.prisma.academicYear.findUnique({
            where: { id: input.academicYearId },
        });
        if (!academicYear) {
            throw new common_1.NotFoundException('Academic year not found');
        }
        const existing = await this.prisma.reportCard.findUnique({
            where: {
                studentId_academicYearId_term: {
                    studentId: input.studentId,
                    academicYearId: input.academicYearId,
                    term: input.term,
                },
            },
        });
        if (existing) {
            throw new common_1.BadRequestException('Report card already exists for this term');
        }
        return this.prisma.reportCard.create({
            data: {
                studentId: input.studentId,
                academicYearId: input.academicYearId,
                term: input.term,
                courseGrades: input.courseGrades,
                gpa: input.gpa,
                behaviorSummary: input.behaviorSummary,
                teacherComments: input.teacherComments,
                attendanceSummary: input.attendanceSummary,
            },
            include: {
                student: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
                academicYear: {
                    select: { id: true, name: true },
                },
            },
        });
    }
    async getReportCardsForStudent(studentId, userId) {
        const hasAccess = await this.verifyAccess(userId, studentId);
        if (!hasAccess) {
            throw new common_1.BadRequestException('No access to this student');
        }
        return this.prisma.reportCard.findMany({
            where: { studentId },
            include: {
                academicYear: {
                    select: { id: true, name: true },
                },
                acknowledgedUser: {
                    select: { id: true, firstName: true, lastName: true },
                },
            },
            orderBy: [{ academicYear: { startDate: 'desc' } }, { term: 'desc' }],
        });
    }
    async getLatestReportCard(studentId, userId) {
        const hasAccess = await this.verifyAccess(userId, studentId);
        if (!hasAccess) {
            throw new common_1.BadRequestException('No access to this student');
        }
        return this.prisma.reportCard.findFirst({
            where: { studentId },
            include: {
                academicYear: {
                    select: { id: true, name: true },
                },
                acknowledgedUser: {
                    select: { id: true, firstName: true, lastName: true },
                },
            },
            orderBy: [{ academicYear: { startDate: 'desc' } }, { term: 'desc' }],
        });
    }
    async getReportCardById(reportCardId, userId) {
        const reportCard = await this.prisma.reportCard.findUnique({
            where: { id: reportCardId },
            include: {
                student: {
                    select: { id: true, firstName: true, lastName: true },
                },
                academicYear: {
                    select: { id: true, name: true },
                },
                acknowledgedUser: {
                    select: { id: true, firstName: true, lastName: true },
                },
            },
        });
        if (!reportCard) {
            throw new common_1.NotFoundException('Report card not found');
        }
        const hasAccess = await this.verifyAccess(userId, reportCard.studentId);
        if (!hasAccess) {
            throw new common_1.BadRequestException('No access to this report card');
        }
        return reportCard;
    }
    async acknowledgeReportCard(reportCardId, parentId) {
        const reportCard = await this.prisma.reportCard.findUnique({
            where: { id: reportCardId },
        });
        if (!reportCard) {
            throw new common_1.NotFoundException('Report card not found');
        }
        const link = await this.prisma.parentStudent.findUnique({
            where: {
                parentId_studentId: {
                    parentId,
                    studentId: reportCard.studentId,
                },
            },
        });
        if (!link) {
            throw new common_1.BadRequestException('Parent not linked to student');
        }
        return this.prisma.reportCard.update({
            where: { id: reportCardId },
            data: {
                parentAcknowledgedAt: new Date(),
                acknowledgedBy: parentId,
            },
            include: {
                student: {
                    select: { id: true, firstName: true, lastName: true },
                },
                academicYear: {
                    select: { id: true, name: true },
                },
                acknowledgedUser: {
                    select: { id: true, firstName: true, lastName: true },
                },
            },
        });
    }
    async generateReportCard(studentId, academicYearId, term) {
        const student = await this.prisma.user.findFirst({
            where: {
                id: studentId,
                userRoles: { some: { role: { name: 'student' } } },
            },
        });
        if (!student) {
            throw new common_1.NotFoundException('Student not found');
        }
        const grades = await this.prisma.grade.findMany({
            where: { studentId },
            include: {
                assignment: {
                    include: {
                        class: {
                            include: {
                                course: true,
                            },
                        },
                    },
                },
            },
        });
        const courseGradesMap = new Map();
        for (const grade of grades) {
            const course = grade.assignment.class.course;
            if (!courseGradesMap.has(course.id)) {
                courseGradesMap.set(course.id, {
                    courseId: course.id,
                    courseName: course.name,
                    grades: [],
                });
            }
            courseGradesMap.get(course.id).grades.push(grade);
        }
        const courseGrades = Array.from(courseGradesMap.values()).map((course) => {
            const totalScore = course.grades.reduce((sum, g) => sum + g.score, 0);
            const totalMax = course.grades.reduce((sum, g) => sum + g.maxScore, 0);
            const percentage = totalMax > 0 ? (totalScore / totalMax) * 100 : 0;
            return {
                courseId: course.courseId,
                courseName: course.courseName,
                grade: parseFloat(percentage.toFixed(2)),
                letterGrade: this.calculateLetterGrade(percentage),
            };
        });
        const gpa = courseGrades.length > 0
            ? courseGrades.reduce((sum, c) => sum + this.letterGradeToGPA(c.letterGrade), 0) / courseGrades.length
            : 0;
        const attendanceRecords = await this.prisma.attendanceRecord.findMany({
            where: { studentId },
        });
        const present = attendanceRecords.filter((r) => r.status === 'present').length;
        const absent = attendanceRecords.filter((r) => r.status === 'absent').length;
        const late = attendanceRecords.filter((r) => r.status === 'late').length;
        const excused = attendanceRecords.filter((r) => r.status === 'excused').length;
        const total = attendanceRecords.length;
        const attendanceSummary = {
            present,
            absent,
            late,
            excused,
            rate: total > 0 ? parseFloat((((present + late) / total) * 100).toFixed(1)) : 0,
        };
        const behaviorRecords = await this.prisma.behaviorRecord.findMany({
            where: { studentId },
        });
        const positive = behaviorRecords.filter((r) => r.type === 'positive').length;
        const negative = behaviorRecords.filter((r) => r.type === 'negative').length;
        const totalPoints = behaviorRecords.reduce((sum, r) => sum + r.points, 0);
        const behaviorSummary = {
            positive,
            negative,
            totalPoints,
        };
        return this.createReportCard({
            studentId,
            academicYearId,
            term,
            courseGrades,
            gpa: parseFloat(gpa.toFixed(2)),
            behaviorSummary,
            attendanceSummary,
        });
    }
    async verifyAccess(userId, studentId) {
        const parentLink = await this.prisma.parentStudent.findUnique({
            where: {
                parentId_studentId: {
                    parentId: userId,
                    studentId,
                },
            },
        });
        if (parentLink)
            return true;
        if (userId === studentId)
            return true;
        const teacherLink = await this.prisma.classTeacher.findFirst({
            where: {
                teacherId: userId,
                class: {
                    enrollments: {
                        some: { studentId },
                    },
                },
            },
        });
        if (teacherLink)
            return true;
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { userRoles: { include: { role: true } } },
        });
        return user?.userRoles.some((ur) => ur.role.name === 'admin') ?? false;
    }
    calculateLetterGrade(percentage) {
        if (percentage >= 97)
            return 'A+';
        if (percentage >= 93)
            return 'A';
        if (percentage >= 90)
            return 'A-';
        if (percentage >= 87)
            return 'B+';
        if (percentage >= 83)
            return 'B';
        if (percentage >= 80)
            return 'B-';
        if (percentage >= 77)
            return 'C+';
        if (percentage >= 73)
            return 'C';
        if (percentage >= 70)
            return 'C-';
        if (percentage >= 67)
            return 'D+';
        if (percentage >= 63)
            return 'D';
        if (percentage >= 60)
            return 'D-';
        return 'F';
    }
    letterGradeToGPA(letterGrade) {
        const gpaMap = {
            'A+': 4.0, 'A': 4.0, 'A-': 3.7,
            'B+': 3.3, 'B': 3.0, 'B-': 2.7,
            'C+': 2.3, 'C': 2.0, 'C-': 1.7,
            'D+': 1.3, 'D': 1.0, 'D-': 0.7,
            'F': 0.0,
        };
        return gpaMap[letterGrade] || 0;
    }
};
exports.ReportCardsService = ReportCardsService;
exports.ReportCardsService = ReportCardsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], ReportCardsService);


/***/ }),
/* 148 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ReportCardResponseDto = exports.AcknowledgeReportCardDto = exports.CreateReportCardDto = void 0;
const class_validator_1 = __webpack_require__(23);
const swagger_1 = __webpack_require__(3);
class CreateReportCardDto {
}
exports.CreateReportCardDto = CreateReportCardDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateReportCardDto.prototype, "studentId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateReportCardDto.prototype, "academicYearId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Fall' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateReportCardDto.prototype, "term", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: 'array', items: { type: 'object' } }),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", typeof (_a = typeof Array !== "undefined" && Array) === "function" ? _a : Object)
], CreateReportCardDto.prototype, "courseGrades", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsDecimal)({ decimal_digits: '2' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateReportCardDto.prototype, "gpa", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateReportCardDto.prototype, "behaviorSummary", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateReportCardDto.prototype, "teacherComments", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateReportCardDto.prototype, "attendanceSummary", void 0);
class AcknowledgeReportCardDto {
}
exports.AcknowledgeReportCardDto = AcknowledgeReportCardDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], AcknowledgeReportCardDto.prototype, "parentId", void 0);
class ReportCardResponseDto {
}
exports.ReportCardResponseDto = ReportCardResponseDto;


/***/ }),
/* 149 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.winstonConfig = void 0;
exports.sanitizeLogData = sanitizeLogData;
exports.createRequestLogger = createRequestLogger;
const nest_winston_1 = __webpack_require__(7);
const winston = __importStar(__webpack_require__(150));
const path = __importStar(__webpack_require__(98));
const jsonFormat = winston.format.combine(winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston.format.errors({ stack: true }), winston.format.json());
const consoleFormat = winston.format.combine(winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston.format.errors({ stack: true }), winston.format.colorize(), nest_winston_1.utilities.format.nestLike('SMS', {
    colors: true,
    prettyPrint: true,
}));
const isProduction = process.env.NODE_ENV === 'production';
const logDir = path.join(process.cwd(), 'logs');
const transports = [];
if (isProduction) {
    transports.push(new winston.transports.File({
        filename: path.join(logDir, 'app.log'),
        level: 'info',
        format: jsonFormat,
        maxsize: 5242880,
        maxFiles: 5,
    }), new winston.transports.File({
        filename: path.join(logDir, 'error.log'),
        level: 'error',
        format: jsonFormat,
        maxsize: 5242880,
        maxFiles: 5,
    }));
}
else {
    transports.push(new winston.transports.Console({
        format: consoleFormat,
    }));
}
exports.winstonConfig = {
    levels: {
        error: 0,
        warn: 1,
        info: 2,
        http: 3,
        verbose: 4,
        debug: 5,
        silly: 6,
    },
    level: isProduction ? 'info' : 'debug',
    defaultMeta: {
        service: 'school-messaging-system',
        environment: process.env.NODE_ENV || 'development',
    },
    transports,
    exceptionHandlers: isProduction
        ? [
            new winston.transports.File({
                filename: path.join(logDir, 'exceptions.log'),
                format: jsonFormat,
                maxsize: 5242880,
                maxFiles: 5,
            }),
        ]
        : [new winston.transports.Console({ format: consoleFormat })],
    rejectionHandlers: isProduction
        ? [
            new winston.transports.File({
                filename: path.join(logDir, 'rejections.log'),
                format: jsonFormat,
                maxsize: 5242880,
                maxFiles: 5,
            }),
        ]
        : [new winston.transports.Console({ format: consoleFormat })],
    exitOnError: false,
};
function sanitizeLogData(data, sensitiveFields = ['password', 'passwordHash', 'token', 'refreshToken', 'secret', 'apiKey']) {
    if (!data || typeof data !== 'object') {
        return data;
    }
    if (Array.isArray(data)) {
        return data.map(item => sanitizeLogData(item, sensitiveFields));
    }
    const sanitized = { ...data };
    for (const field of sensitiveFields) {
        if (field in sanitized) {
            sanitized[field] = '***REDACTED***';
        }
    }
    return sanitized;
}
function createRequestLogger(logger, requestId, userId) {
    return logger.child({
        requestId,
        userId: userId || 'anonymous',
    });
}


/***/ }),
/* 150 */
/***/ ((module) => {

module.exports = require("winston");

/***/ }),
/* 151 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SanitizeOnlyPipe = exports.SanitizePipe = void 0;
exports.sanitizeString = sanitizeString;
exports.sanitizeObject = sanitizeObject;
const common_1 = __webpack_require__(2);
const common_2 = __webpack_require__(2);
const DOMPurify = __webpack_require__(27);
const jsdom_1 = __webpack_require__(28);
const window = new jsdom_1.JSDOM('').window;
const purify = DOMPurify(window);
const purifyConfig = {
    ALLOWED_TAGS: [
        'b', 'i', 'em', 'strong', 'u', 'a', 'p', 'br', 'ul', 'ol', 'li',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'div', 'blockquote',
        'code', 'pre', 'hr'
    ],
    ALLOWED_ATTR: [
        'href', 'title', 'target', 'class', 'id', 'rel'
    ],
    ALLOW_DATA_ATTR: false,
    SANITIZE_DOM: true,
    FORBID_ATTR: ['style', 'onclick', 'onerror', 'onload', 'onmouseover'],
    TRANSFORM_TAGS: {
        'a': (tagName, attribs) => {
            return {
                tagName: 'a',
                attribs: {
                    ...attribs,
                    target: '_blank',
                    rel: 'noopener noreferrer nofollow',
                },
            };
        },
    },
};
const plainTextConfig = {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
};
function sanitizeString(value, allowFormatting = true) {
    if (typeof value !== 'string') {
        return value;
    }
    const config = allowFormatting ? purifyConfig : plainTextConfig;
    return purify.sanitize(value, config);
}
function sanitizeObject(obj, allowFormatting = true) {
    if (typeof obj === 'string') {
        return sanitizeString(obj, allowFormatting);
    }
    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item, allowFormatting));
    }
    if (obj !== null && typeof obj === 'object') {
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            sanitized[key] = sanitizeObject(value, allowFormatting);
        }
        return sanitized;
    }
    return obj;
}
let SanitizePipe = class SanitizePipe {
    constructor(options) {
        const opts = options ?? {};
        this.validationPipe = new common_2.ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            transformOptions: { enableImplicitConversion: true },
            ...opts,
        });
    }
    async transform(value, metadata) {
        const sanitizedValue = sanitizeObject(value, true);
        return this.validationPipe.transform(sanitizedValue, metadata);
    }
};
exports.SanitizePipe = SanitizePipe;
exports.SanitizePipe = SanitizePipe = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [Object])
], SanitizePipe);
let SanitizeOnlyPipe = class SanitizeOnlyPipe {
    constructor(allowFormatting = true) {
        this.allowFormatting = allowFormatting;
    }
    transform(value, metadata) {
        return sanitizeObject(value, this.allowFormatting);
    }
};
exports.SanitizeOnlyPipe = SanitizeOnlyPipe;
exports.SanitizeOnlyPipe = SanitizeOnlyPipe = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Boolean])
], SanitizeOnlyPipe);


/***/ }),
/* 152 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MetricsInterceptor_1;
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MetricsInterceptor = void 0;
const common_1 = __webpack_require__(2);
const operators_1 = __webpack_require__(153);
const metrics_service_1 = __webpack_require__(30);
let MetricsInterceptor = MetricsInterceptor_1 = class MetricsInterceptor {
    constructor(metricsService) {
        this.metricsService = metricsService;
        this.logger = new common_1.Logger(MetricsInterceptor_1.name);
    }
    intercept(context, next) {
        const start = Date.now();
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();
        const method = request.method;
        const route = this.getRoutePattern(request) || request.path || 'unknown';
        return next.handle().pipe((0, operators_1.tap)({
            next: () => {
                this.recordMetrics(method, route, response.statusCode, start);
            },
            error: (error) => {
                const statusCode = error.status || 500;
                this.recordMetrics(method, route, statusCode, start);
                this.metricsService.recordError(error.name || 'UnknownError', `${method} ${route}`);
            },
        }));
    }
    getRoutePattern(request) {
        if (request.route?.path) {
            return request.route.path;
        }
        const baseUrl = request.baseUrl || '';
        const path = request.path || '';
        if (baseUrl && path) {
            const normalizedPath = this.normalizePath(path);
            return `${baseUrl}${normalizedPath}`;
        }
        return undefined;
    }
    normalizePath(path) {
        const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
        let normalized = path.replace(uuidRegex, ':id');
        const numericIdRegex = /\/\d+(?=\/|$)/g;
        normalized = normalized.replace(numericIdRegex, '/:id');
        return normalized;
    }
    recordMetrics(method, route, statusCode, startTime) {
        const duration = (Date.now() - startTime) / 1000;
        try {
            this.metricsService.recordHttpRequest(method, route, statusCode, duration);
            if (duration > 1) {
                this.logger.warn(`Slow request detected: ${method} ${route} took ${duration.toFixed(3)}s`);
            }
        }
        catch (error) {
            this.logger.error(`Failed to record metrics: ${error.message}`);
        }
    }
};
exports.MetricsInterceptor = MetricsInterceptor;
exports.MetricsInterceptor = MetricsInterceptor = MetricsInterceptor_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof metrics_service_1.MetricsService !== "undefined" && metrics_service_1.MetricsService) === "function" ? _a : Object])
], MetricsInterceptor);


/***/ }),
/* 153 */
/***/ ((module) => {

module.exports = require("rxjs/operators");

/***/ }),
/* 154 */
/***/ ((module) => {

module.exports = require("helmet");

/***/ }),
/* 155 */
/***/ ((module) => {

module.exports = require("compression");

/***/ }),
/* 156 */
/***/ ((module) => {

module.exports = require("dotenv");

/***/ }),
/* 157 */
/***/ ((module) => {

module.exports = require("cookie-parser");

/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__(0);
/******/ 	
/******/ })()
;