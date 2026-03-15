import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity.js';
import { OrderItem } from './entities/order-item.entity.js';
import { OrderNote } from './entities/order-note.entity.js';
import { Product } from '../products/entities/product.entity.js';
import { ProductVariation } from '../products/entities/product-variation.entity.js';
import { StockAdjustmentLog } from '../products/entities/stock-adjustment-log.entity.js';
import { InvoiceModule } from '../invoice/invoice.module.js';
import { OrderController } from './controllers/order.controller.js';
import { OrderService } from './services/order.service.js';
import { OrderNoteService } from './services/order-note.service.js';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Order,
            OrderItem,
            OrderNote,
            Product,
            ProductVariation,
            StockAdjustmentLog,
        ]),
        InvoiceModule,
    ],
    controllers: [OrderController],
    providers: [OrderService, OrderNoteService],
    exports: [OrderService, OrderNoteService],
})
export class OrderModule {}
