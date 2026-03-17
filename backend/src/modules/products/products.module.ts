import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity.js';
import { ProductVariation } from './entities/product-variation.entity.js';
import { StockAdjustmentLog } from './entities/stock-adjustment-log.entity.js';
import { ProductController } from './controllers/product.controller.js';
import { ProductService } from './services/product.service.js';
import { WooCommerceModule } from '../woocommerce/woocommerce.module.js';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Product,
            ProductVariation,
            StockAdjustmentLog,
        ]),
        forwardRef(() => WooCommerceModule),
    ],
    controllers: [ProductController],
    providers: [ProductService],
    exports: [ProductService],
})
export class ProductModule {}
