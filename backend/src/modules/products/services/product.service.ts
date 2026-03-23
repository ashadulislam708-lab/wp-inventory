import {
    Injectable,
    NotFoundException,
    BadRequestException,
    Inject,
    forwardRef,
    Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, SelectQueryBuilder, In } from 'typeorm';
import { Product } from '../entities/product.entity.js';
import { ProductVariation } from '../entities/product-variation.entity.js';
import { StockAdjustmentLog } from '../entities/stock-adjustment-log.entity.js';
import {
    ListProductsDto,
    StockStatusFilter,
} from '../dto/list-products.dto.js';
import { AdjustStockDto } from '../dto/adjust-stock.dto.js';
import { StockHistoryDto } from '../dto/stock-history.dto.js';
import { IJwtPayload } from '../../../shared/interfaces/jwt-payload.js';
import { WooCommerceService } from '../../woocommerce/services/woocommerce.service.js';

@Injectable()
export class ProductService {
    private readonly logger = new Logger(ProductService.name);

    constructor(
        @InjectRepository(Product)
        private readonly productRepository: Repository<Product>,
        @InjectRepository(ProductVariation)
        private readonly variationRepository: Repository<ProductVariation>,
        @InjectRepository(StockAdjustmentLog)
        private readonly stockLogRepository: Repository<StockAdjustmentLog>,
        private readonly dataSource: DataSource,
        @Inject(forwardRef(() => WooCommerceService))
        private readonly wooCommerceService: WooCommerceService,
    ) {}

    /**
     * List products with pagination, search, category filter, and stock status filter
     */
    async listProducts(dto: ListProductsDto) {
        const page = dto.page || 1;
        const limit = dto.limit || 25;
        const skip = (page - 1) * limit;

        const qb: SelectQueryBuilder<Product> = this.productRepository
            .createQueryBuilder('product')
            .leftJoinAndSelect('product.category', 'category')
            .leftJoinAndSelect('product.variations', 'variations')
            .where('product.deletedAt IS NULL');

        // Filter by specific product IDs
        if (dto.ids) {
            const idList = dto.ids.split(',').map((id) => id.trim());
            qb.andWhere('product.id IN (:...ids)', { ids: idList });
        }

        // Search by name or SKU
        if (dto.search) {
            qb.andWhere(
                '(product.name ILIKE :search OR product.sku ILIKE :search)',
                {
                    search: `%${dto.search}%`,
                },
            );
        }

        // Filter by category
        if (dto.category) {
            qb.andWhere('product.categoryId = :categoryId', {
                categoryId: dto.category,
            });
        }

        // Filter by stock status
        if (dto.stockStatus) {
            switch (dto.stockStatus) {
                case StockStatusFilter.OUT_OF_STOCK:
                    qb.andWhere('product.stockQuantity = 0');
                    break;
                case StockStatusFilter.LOW:
                    qb.andWhere(
                        'product.stockQuantity > 0 AND product.stockQuantity <= product.lowStockThreshold',
                    );
                    break;
                case StockStatusFilter.IN_STOCK:
                    qb.andWhere(
                        'product.stockQuantity > product.lowStockThreshold',
                    );
                    break;
            }
        }

        qb.orderBy('product.createdAt', 'DESC');
        qb.skip(skip).take(limit);

        const [data, total] = await qb.getManyAndCount();

        return {
            data,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Get product detail with variations
     */
    async getProductById(id: string) {
        const product = await this.productRepository.findOne({
            where: { id },
            relations: ['category', 'variations'],
        });

        if (!product) {
            throw new NotFoundException(`Product with ID ${id} not found`);
        }

        // Fetch recent stock history
        const stockLogs = await this.stockLogRepository.find({
            where: { productId: id },
            relations: ['adjustedBy'],
            order: { createdAt: 'DESC' },
            take: 50,
        });

        const stockHistory = stockLogs.map((log) => ({
            id: log.id,
            previousQty: log.previousQty,
            newQty: log.newQty,
            reason: log.reason,
            adjustedBy: log.adjustedBy?.name || 'System',
            createdAt: log.createdAt,
        }));

        return { ...product, stockHistory };
    }

    /**
     * Adjust product stock
     * Returns updated product with previous quantity and sync status
     */
    async adjustProductStock(
        productId: string,
        dto: AdjustStockDto,
        user: IJwtPayload,
    ) {
        return this.dataSource
            .transaction(async (manager) => {
                const product = await manager.findOne(Product, {
                    where: { id: productId },
                    lock: { mode: 'pessimistic_write' },
                });

                if (!product) {
                    throw new NotFoundException(
                        `Product with ID ${productId} not found`,
                    );
                }

                const previousQuantity = product.stockQuantity;
                const newQuantity = previousQuantity + dto.quantity;

                // NEVER allow negative stock
                if (newQuantity < 0) {
                    throw new BadRequestException(
                        `Insufficient stock for ${product.name} (available: ${previousQuantity}, adjustment: ${dto.quantity})`,
                    );
                }

                product.stockQuantity = newQuantity;
                await manager.save(Product, product);

                // Log stock adjustment
                const stockLog = manager.create(StockAdjustmentLog, {
                    productId: product.id,
                    variationId: null,
                    adjustedById: user.id,
                    previousQty: previousQuantity,
                    newQty: newQuantity,
                    reason: dto.reason,
                    note: dto.note ?? null,
                });
                await manager.save(StockAdjustmentLog, stockLog);

                return {
                    id: product.id,
                    name: product.name,
                    stockQuantity: newQuantity,
                    previousQuantity,
                    wcSyncStatus: product.syncStatus,
                };
            })
            .then((result) => {
                // Push stock to WooCommerce (non-blocking, after transaction commits)
                this.wooCommerceService
                    .pushStockToWc(result.id, null)
                    .catch((err) => {
                        this.logger.error(
                            `Failed to push stock to WC after adjustment for product ${result.id}: ${err.message}`,
                        );
                    });
                return result;
            });
    }

    /**
     * Adjust variation stock
     */
    async adjustVariationStock(
        variationId: string,
        dto: AdjustStockDto,
        user: IJwtPayload,
    ) {
        return this.dataSource
            .transaction(async (manager) => {
                const variation = await manager.findOne(ProductVariation, {
                    where: { id: variationId },
                    lock: { mode: 'pessimistic_write' },
                });

                if (!variation) {
                    throw new NotFoundException(
                        `Variation with ID ${variationId} not found`,
                    );
                }

                const previousQuantity = variation.stockQuantity;
                const newQuantity = previousQuantity + dto.quantity;

                // NEVER allow negative stock
                if (newQuantity < 0) {
                    throw new BadRequestException(
                        `Insufficient stock for variation (available: ${previousQuantity}, adjustment: ${dto.quantity})`,
                    );
                }

                variation.stockQuantity = newQuantity;
                await manager.save(ProductVariation, variation);

                // Also update parent product total stock
                const product = await manager.findOne(Product, {
                    where: { id: variation.productId },
                    lock: { mode: 'pessimistic_write' },
                });

                if (product) {
                    // Recalculate parent stock from all variations
                    const allVariations = await manager.find(ProductVariation, {
                        where: { productId: product.id },
                    });
                    product.stockQuantity = allVariations.reduce(
                        (sum, v) => sum + v.stockQuantity,
                        0,
                    );
                    await manager.save(Product, product);
                }

                // Log stock adjustment
                const stockLog = manager.create(StockAdjustmentLog, {
                    productId: variation.productId,
                    variationId: variation.id,
                    adjustedById: user.id,
                    previousQty: previousQuantity,
                    newQty: newQuantity,
                    reason: dto.reason,
                    note: dto.note ?? null,
                });
                await manager.save(StockAdjustmentLog, stockLog);

                return {
                    id: variation.id,
                    productId: variation.productId,
                    stockQuantity: newQuantity,
                    previousQuantity,
                    wcSyncStatus: 'SYNCED',
                };
            })
            .then((result) => {
                // Push variation stock to WooCommerce (non-blocking, after transaction commits)
                this.wooCommerceService
                    .pushStockToWc(result.productId, result.id)
                    .catch((err) => {
                        this.logger.error(
                            `Failed to push variation stock to WC after adjustment for variation ${result.id}: ${err.message}`,
                        );
                    });
                return result;
            });
    }

    /**
     * Get stock history for a product (paginated)
     */
    async getStockHistory(productId: string, dto: StockHistoryDto) {
        const product = await this.productRepository.findOne({
            where: { id: productId },
        });

        if (!product) {
            throw new NotFoundException(
                `Product with ID ${productId} not found`,
            );
        }

        const page = dto.page || 1;
        const limit = dto.limit || 25;
        const skip = (page - 1) * limit;

        const [data, total] = await this.stockLogRepository.findAndCount({
            where: { productId },
            relations: ['adjustedBy'],
            order: { createdAt: 'DESC' },
            skip,
            take: limit,
        });

        const formattedData = data.map((log) => ({
            id: log.id,
            previousQty: log.previousQty,
            newQty: log.newQty,
            reason: log.reason,
            adjustedBy: log.adjustedBy?.name || 'System',
            createdAt: log.createdAt,
        }));

        return {
            data: formattedData,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Export products as CSV
     */
    async exportProducts(dto: ListProductsDto) {
        const allDto = { ...dto, page: 1, limit: 10000 };
        const result = await this.listProducts(allDto);

        const headers = [
            'Name',
            'SKU',
            'Type',
            'Category',
            'Stock Quantity',
            'Low Stock Threshold',
            'Regular Price',
            'Sale Price',
            'Sync Status',
        ];

        const rows = result.data.map((product) =>
            [
                `"${(product.name || '').replace(/"/g, '""')}"`,
                product.sku || '',
                product.type,
                product.category?.name || '',
                product.stockQuantity,
                product.lowStockThreshold,
                product.regularPrice,
                product.salePrice ?? '',
                product.syncStatus,
            ].join(','),
        );

        return [headers.join(','), ...rows].join('\n');
    }

    /**
     * Get product repository for use by other services
     */
    getRepository(): Repository<Product> {
        return this.productRepository;
    }

    /**
     * Get variation repository for use by other services
     */
    getVariationRepository(): Repository<ProductVariation> {
        return this.variationRepository;
    }
}
