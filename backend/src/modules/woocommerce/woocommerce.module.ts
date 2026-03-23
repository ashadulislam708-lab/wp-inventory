import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../products/entities/product.entity.js';
import { ProductVariation } from '../products/entities/product-variation.entity.js';
import { Category } from '../categories/entities/category.entity.js';
import { Order } from '../orders/entities/order.entity.js';
import { OrderItem } from '../orders/entities/order-item.entity.js';
import { StockAdjustmentLog } from '../products/entities/stock-adjustment-log.entity.js';
import { InvoiceCounter } from '../invoice/entities/invoice-counter.entity.js';
import { SyncLog } from '../sync/entities/sync-log.entity.js';
import { WooCommerceController } from './controllers/woocommerce.controller.js';
import { WooCommerceService } from './services/woocommerce.service.js';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Product,
            ProductVariation,
            Category,
            Order,
            OrderItem,
            StockAdjustmentLog,
            InvoiceCounter,
            SyncLog,
        ]),
    ],
    controllers: [WooCommerceController],
    providers: [WooCommerceService],
    exports: [WooCommerceService],
})
export class WooCommerceModule {}
