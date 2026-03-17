import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SyncLog } from './entities/sync-log.entity.js';
import { StockReconciliationService } from './stock-reconciliation.service.js';
import { SyncLogService } from './sync-log.service.js';
import { SyncLogController } from './sync-log.controller.js';
import { WooCommerceModule } from '../woocommerce/woocommerce.module.js';

@Module({
    imports: [TypeOrmModule.forFeature([SyncLog]), WooCommerceModule],
    controllers: [SyncLogController],
    providers: [StockReconciliationService, SyncLogService],
    exports: [StockReconciliationService, SyncLogService],
})
export class SyncModule {}
