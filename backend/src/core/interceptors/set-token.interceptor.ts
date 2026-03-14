import {
    CallHandler,
    ExecutionContext,
    Inject,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { catchError, map, Observable, throwError } from 'rxjs';

@Injectable()
export class SetToken implements NestInterceptor {
    constructor(
        @Inject(ConfigService) private readonly configService: ConfigService,
    ) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const res = context.switchToHttp().getResponse();
        return next.handle().pipe(
            map((value) => {
                if (value.success && value.data?.token) {
                    res.cookie(
                        this.configService.get<string>(
                            'AUTH_TOKEN_COOKIE_NAME',
                        ),
                        value.data.token,
                        {
                            httpOnly: true,
                            secure: true,
                            sameSite: 'none',
                        },
                    );

                    return value;
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
