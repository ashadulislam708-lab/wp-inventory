import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

//DB
import { TypeOrmModule } from '@nestjs/typeorm';
import { appDataSource } from './config/db.config';

//Config
import { ConfigModule } from '@nestjs/config';
import jwtConfig from './config/jwt.config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { AcceptLanguageResolver, I18nModule, QueryResolver } from 'nestjs-i18n';
import { join } from 'path';
import { CorsMiddleware } from './core/middleware';
import { UserModule } from './modules/users';
import { AuthModule } from './modules/auth';
import { PassportModule } from '@nestjs/passport';
import { JwtAuthGuard, JwtStrategy } from './core/guards';
import { OtpModule } from '@modules/otp/otp.module';
import { FeaturesModule } from './modules/features/features.module';
import { LanguageEnum } from '@shared/enums';

@Module({
    imports: [
        ServeStaticModule.forRoot({
            rootPath: join(__dirname, '..', 'src/shared/icons'),
            serveRoot: '/diagnosis-icons',
        }),
        ServeStaticModule.forRoot({
            rootPath: join(process.cwd(), 'src', 'test'),
            serveRoot: '/test',
        }),
        ConfigModule.forRoot({
            load: [jwtConfig],
            isGlobal: true,
        }),
        TypeOrmModule.forRoot(appDataSource.options),
        ThrottlerModule.forRoot([
            {
                ttl: 60000,
                limit: 10,
            },
        ]),
        I18nModule.forRoot({
            fallbackLanguage: LanguageEnum.KOREAN,
            loaderOptions: {
                path: join(process.cwd(), 'src/i18n'),
                watch: true,
            },
            resolvers: [
                { use: QueryResolver, options: ['lang'] },
                AcceptLanguageResolver,
            ],
            typesOutputPath: join(
                process.cwd(),
                'src/generated/i18n.generated.ts',
            ),
            formatter: (template: string, ...args: any[]) => {
                let result = template;
                if (args[0]) {
                    Object.keys(args[0]).forEach((key) => {
                        result = result.replace(
                            new RegExp(`\\{\\{${key}\\}\\}`, 'g'),
                            args[0][key],
                        );
                        result = result.replace(
                            new RegExp(`\\{${key}\\}`, 'g'),
                            args[0][key],
                        );
                    });
                }
                return result;
            },
        }),
        PassportModule.register({ defaultStrategy: 'jwt' }),
        UserModule,
        AuthModule,
        OtpModule,
        FeaturesModule,
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
