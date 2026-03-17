import { Module, Global } from '@nestjs/common';
import { SteadfastService } from './steadfast.service.js';

@Global()
@Module({
    providers: [SteadfastService],
    exports: [SteadfastService],
})
export class CourierModule {}
