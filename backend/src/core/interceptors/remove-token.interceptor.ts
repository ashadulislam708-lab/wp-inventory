import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { catchError, map, Observable, throwError } from 'rxjs';

@Injectable()
export class RemoveToken implements NestInterceptor {
    constructor(
        @Inject(ConfigService) private readonly configService: ConfigService,
    ) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const res = context.switchToHttp().getResponse();
        return next.handle().pipe(
            map((value) => {
                if (value.success) {
                    res.cookie(
                        this.configService.get<string>(
                            'AUTH_TOKEN_COOKIE_NAME',
                        ),
                        '',
                        {
                            httpOnly: true,
                        },
                    );
                    return {
                        success: true,
                        message: value.message,
                        refreshToken: value?.refreshToken,
                    };
                } else {
                    return value;
                }
            }),
            catchError((err) => {
                return throwError(() => err);
            }),
        );
    }
}
