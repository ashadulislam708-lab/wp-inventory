import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';

// DB
import { TypeOrmModule } from '@nestjs/typeorm';
import { appDataSource } from './config/db.config';

// Config
import { ConfigModule } from '@nestjs/config';
import jwtConfig from './config/jwt.config';
import { CorsMiddleware } from './core/middleware';
import { PassportModule } from '@nestjs/passport';
import { JwtAuthGuard, JwtStrategy } from './core/guards';

// Feature Modules
import { AuthModule } from './modules/auth';
import { UserModule } from './modules/users';
import { CategoryModule } from './modules/categories/categories.module';
import { ProductModule } from './modules/products/products.module';
import { OrderModule } from './modules/orders/orders.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { WooCommerceModule } from './modules/woocommerce/woocommerce.module';
import { TrackingModule } from './modules/tracking/tracking.module';
import { SettingsModule } from './modules/settings/settings.module';
import { SyncModule } from './modules/sync/sync.module';
import { InvoiceModule } from './modules/invoice/invoice.module';

// Infrastructure
import { CourierModule } from './infrastructure/courier/courier.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            load: [jwtConfig],
            isGlobal: true,
        }),
        TypeOrmModule.forRoot(appDataSource.options),
        ThrottlerModule.forRoot([
            {
                ttl: 60000,
                limit: 60,
            },
        ]),
        PassportModule.register({ defaultStrategy: 'jwt' }),
        ScheduleModule.forRoot(),

        // Infrastructure
        CourierModule,

        // Feature Modules
        AuthModule,
        UserModule,
        CategoryModule,
        ProductModule,
        OrderModule,
        DashboardModule,
        WooCommerceModule,
        TrackingModule,
        SettingsModule,
        SyncModule,
        InvoiceModule,
    ],
    controllers: [AppController],
    providers: [
        AppService,
        JwtStrategy,
        {
            provide: APP_GUARD,
            useClass: JwtAuthGuard,
        },
    ],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(CorsMiddleware).forRoutes('*');
    }
}
