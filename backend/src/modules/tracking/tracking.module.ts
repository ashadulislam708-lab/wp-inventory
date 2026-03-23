import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../orders/entities/order.entity.js';
import { TrackingController } from './controllers/tracking.controller.js';
import { TrackingService } from './services/tracking.service.js';

@Module({
    imports: [TypeOrmModule.forFeature([Order])],
    controllers: [TrackingController],
    providers: [TrackingService],
})
export class TrackingModule {}
