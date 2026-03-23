import {
    Controller,
    Get,
    Patch,
    Param,
    Body,
    Query,
    HttpCode,
    HttpStatus,
    ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ProductService } from '../services/product.service.js';
import { ListProductsDto } from '../dto/list-products.dto.js';
import { AdjustStockDto } from '../dto/adjust-stock.dto.js';
import { StockHistoryDto } from '../dto/stock-history.dto.js';
import { CurrentUser } from '../../../core/decorators/current-user.decorator.js';
import type { IJwtPayload } from '../../../shared/interfaces/jwt-payload.js';

@ApiTags('Products')
@ApiBearerAuth()
@Controller('products')
export class ProductController {
    constructor(private readonly productService: ProductService) {}

    /**
     * List products with filtering and pagination
     * GET /api/products
     */
    @Get()
    @HttpCode(HttpStatus.OK)
    async findAll(@Query() dto: ListProductsDto) {
        return this.productService.listProducts(dto);
    }

    /**
     * Adjust variation stock (placed before :id routes to avoid param conflict)
     * PATCH /api/products/variations/:id/stock
     */
    @Patch('variations/:id/stock')
    @HttpCode(HttpStatus.OK)
    async adjustVariationStock(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: AdjustStockDto,
        @CurrentUser() user: IJwtPayload,
    ) {
        return this.productService.adjustVariationStock(id, dto, user);
    }

    /**
     * Product detail with variations
     * GET /api/products/:id
     */
    @Get(':id')
    @HttpCode(HttpStatus.OK)
    async findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.productService.getProductById(id);
    }

    /**
     * Adjust product stock
     * PATCH /api/products/:id/stock
     */
    @Patch(':id/stock')
    @HttpCode(HttpStatus.OK)
    async adjustProductStock(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: AdjustStockDto,
        @CurrentUser() user: IJwtPayload,
    ) {
        return this.productService.adjustProductStock(id, dto, user);
    }

    /**
     * Stock adjustment history for a product
     * GET /api/products/:id/stock-history
     */
    @Get(':id/stock-history')
    @HttpCode(HttpStatus.OK)
    async getStockHistory(
        @Param('id', ParseUUIDPipe) id: string,
        @Query() dto: StockHistoryDto,
    ) {
        return this.productService.getStockHistory(id, dto);
    }
}
