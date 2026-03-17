import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../orders/entities/order.entity.js';
import { Product } from '../products/entities/product.entity.js';
import { SyncLog } from '../sync/entities/sync-log.entity.js';
import { DashboardController } from './controllers/dashboard.controller.js';
import { DashboardService } from './services/dashboard.service.js';

@Module({
    imports: [TypeOrmModule.forFeature([Order, Product, SyncLog])],
    controllers: [DashboardController],
    providers: [DashboardService],
})
export class DashboardModule {}
