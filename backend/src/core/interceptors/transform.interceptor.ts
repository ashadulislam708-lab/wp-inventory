import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ResponsePayloadDto } from '@shared/dtos';

/**
 * Transform Interceptor to standardize API responses
 * Automatically wraps all responses in ResponsePayloadDto  format
 */
@Injectable()
export class TransformInterceptor<T>
    implements NestInterceptor<T, ResponsePayloadDto<T>>
{
    intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Observable<ResponsePayloadDto<T>> {
        const ctx = context.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();

        return next.handle().pipe(
            map((data) => {
                if (data instanceof ResponsePayloadDto) {
                    return data;
                }

                if (
                    data &&
                    typeof data === 'object' &&
                    'success' in data &&
                    'statusCode' in data &&
                    'message' in data
                ) {
                    return data as ResponsePayloadDto<T>;
                }

                return new ResponsePayloadDto({
                    success: true,
                    statusCode: response.statusCode,
                    message: 'Success',
                    data: data,
                    timestamp: new Date().toISOString(),
                    path: request.url,
                });
            }),
        );
    }
}
