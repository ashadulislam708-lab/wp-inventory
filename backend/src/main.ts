import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser = require('cookie-parser');
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { envConfigService } from './config/env-config.service';
import {
    HttpExceptionFilter,
    AllExceptionsFilter,
} from './core/filters/http-exception.filter';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        cors: true,
        rawBody: true,
    });

    app.useGlobalFilters(new AllExceptionsFilter(), new HttpExceptionFilter());

    // Add API prefix - all routes will be /api/*
    app.setGlobalPrefix('api', {
        exclude: ['docs', 'docs-json', 'docs-yaml'],
    });

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            forbidUnknownValues: true,
            transform: true,
            transformOptions: {
                enableImplicitConversion: true,
            },
        }),
    );

    app.enableCors({
        origin: envConfigService.getOrigins(),
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: true,
        allowedHeaders: [
            'Content-Type',
            'Authorization',
            'x-requested-with',
            'x-forwarded-for',
        ],
        exposedHeaders: ['Authorization'],
    });

    app.use(cookieParser());

    if (!envConfigService.isProduction()) {
        const config = new DocumentBuilder()
            .setTitle('Glam Lavish API')
            .setDescription('Glam Lavish Inventory Management System API')
            .setVersion('1.0')
            .addBearerAuth()
            .addTag('Authentication', 'Auth endpoints')
            .addTag('Users', 'User management (admin only)')
            .addTag('Categories', 'Product categories (read-only)')
            .addTag('Products', 'Product and stock management')
            .addTag('Orders', 'Order CRUD and status management')
            .addTag('Dashboard', 'Dashboard stats and widgets')
            .addTag('WooCommerce', 'WC integration and sync')
            .addTag('Tracking', 'Public order tracking')
            .addTag('Settings', 'System settings')
            .build();

        const document = SwaggerModule.createDocument(app, config, {
            operationIdFactory: (controllerKey: string, methodKey: string) =>
                methodKey,
        });

        SwaggerModule.setup('docs', app, document, {
            swaggerOptions: {
                persistAuthorization: true,
                docExpansion: 'none',
                filter: true,
                showRequestDuration: true,
                withCredentials: true,
            },
            customSiteTitle: 'Glam Lavish API Docs',
        });
    }

    const port = envConfigService.getPort() || '8040';
    await app.listen(port);

    console.log(`Glam Lavish API running on: http://localhost:${port}`);
    if (!envConfigService.isProduction()) {
        console.log(`Swagger docs at: http://localhost:${port}/docs`);
    }
}

void bootstrap();
