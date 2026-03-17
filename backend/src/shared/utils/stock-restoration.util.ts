import { EntityManager } from 'typeorm';
import { Product } from '../../modules/products/entities/product.entity.js';
import { ProductVariation } from '../../modules/products/entities/product-variation.entity.js';
import { StockAdjustmentLog } from '../../modules/products/entities/stock-adjustment-log.entity.js';
import { OrderItem } from '../../modules/orders/entities/order-item.entity.js';

/**
 * Restore stock for order items within a transaction.
 * Skips items where stockDecremented is false (stock was never taken).
 *
 * @param manager - Active EntityManager from an ongoing transaction
 * @param items - Order items to restore stock for
 * @param adjustedById - User ID who triggered the restoration, or null for system actions (webhooks)
 * @param reasonText - Human-readable reason (e.g. "Order Cancelled", "Order Returned")
 * @param invoiceId - The order's invoice ID for the log entry
 */
export async function restoreOrderItemsStock(
    manager: EntityManager,
    items: OrderItem[],
    adjustedById: string | null,
    reasonText: string,
    invoiceId: string,
): Promise<void> {
    for (const item of items) {
        // Skip items where stock was never decremented (e.g. WC webhook with insufficient stock)
        if (item.stockDecremented === false) {
            continue;
        }

        if (item.variationId) {
            const variation = await manager.findOne(ProductVariation, {
                where: { id: item.variationId },
                lock: { mode: 'pessimistic_write' },
            });
            if (variation) {
                const prevQty = variation.stockQuantity;
                variation.stockQuantity += item.quantity;
                await manager.save(ProductVariation, variation);

                // Also restore parent product stock
                const product = await manager.findOne(Product, {
                    where: { id: item.productId! },
                    lock: { mode: 'pessimistic_write' },
                });
                if (product) {
                    product.stockQuantity += item.quantity;
                    await manager.save(Product, product);
                }

                await manager.save(
                    manager.create(StockAdjustmentLog, {
                        productId: item.productId!,
                        variationId: item.variationId,
                        adjustedById,
                        previousQty: prevQty,
                        newQty: variation.stockQuantity,
                        reason: `${reasonText} - ${invoiceId}`,
                    }),
                );
            }
        } else if (item.productId) {
            const product = await manager.findOne(Product, {
                where: { id: item.productId },
                lock: { mode: 'pessimistic_write' },
            });
            if (product) {
                const prevQty = product.stockQuantity;
                product.stockQuantity += item.quantity;
                await manager.save(Product, product);

                await manager.save(
                    manager.create(StockAdjustmentLog, {
                        productId: product.id,
                        variationId: null,
                        adjustedById,
                        previousQty: prevQty,
                        newQty: product.stockQuantity,
                        reason: `${reasonText} - ${invoiceId}`,
                    }),
                );
            }
        }
    }
}
