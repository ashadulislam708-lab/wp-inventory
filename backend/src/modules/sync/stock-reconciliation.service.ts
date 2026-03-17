import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SyncLog } from './entities/sync-log.entity.js';
import { WooCommerceService } from '../woocommerce/services/woocommerce.service.js';
import { SyncDirectionEnum } from '../../shared/enums/sync-direction.enum.js';
import { SyncLogStatusEnum } from '../../shared/enums/sync-log-status.enum.js';

/**
 * Hourly stock reconciliation cron job.
 * PRD requirement: Every hour, iterate all products with a wcId,
 * push the local stock quantity to WooCommerce (local stock wins),
 * and log the reconciliation in sync_logs.
 */
@Injectable()
export class StockReconciliationService {
    private readonly logger = new Logger(StockReconciliationService.name);
    private isRunning = false;

    constructor(
        private readonly wooCommerceService: WooCommerceService,
        @InjectRepository(SyncLog)
        private readonly syncLogRepository: Repository<SyncLog>,
    ) {}

    /**
     * Run stock reconciliation every hour.
     * Uses a guard flag to prevent overlapping runs.
     */
    @Cron(CronExpression.EVERY_HOUR)
    async handleStockReconciliation(): Promise<void> {
        if (this.isRunning) {
            this.logger.warn(
                'Stock reconciliation already in progress, skipping this run',
            );
            return;
        }

        this.isRunning = true;
        const startTime = Date.now();

        this.logger.log('Starting hourly stock reconciliation...');

        try {
            const result = await this.wooCommerceService.reconcileAllStock();

            const duration = ((Date.now() - startTime) / 1000).toFixed(1);

            this.logger.log(
                `Stock reconciliation completed in ${duration}s — ` +
                    `Total: ${result.total}, Success: ${result.success}, ` +
                    `Failed: ${result.failed}, Skipped: ${result.skipped}`,
            );

            // Log the overall reconciliation run in sync_logs
            const log = this.syncLogRepository.create({
                direction: SyncDirectionEnum.OUTBOUND,
                entityType: 'reconciliation',
                entityId: null,
                status:
                    result.failed === 0
                        ? SyncLogStatusEnum.SUCCESS
                        : SyncLogStatusEnum.FAILED,
                payload: {
                    total: result.total,
                    success: result.success,
                    failed: result.failed,
                    skipped: result.skipped,
                    durationSeconds: parseFloat(duration),
                },
                error:
                    result.failed > 0
                        ? `${result.failed} product(s) failed to sync`
                        : null,
            });
            await this.syncLogRepository.save(log);
        } catch (error: any) {
            this.logger.error(`Stock reconciliation failed: ${error.message}`);

            // Log the failure
            try {
                const log = this.syncLogRepository.create({
                    direction: SyncDirectionEnum.OUTBOUND,
                    entityType: 'reconciliation',
                    entityId: null,
                    status: SyncLogStatusEnum.FAILED,
                    payload: null,
                    error: error.message,
                });
                await this.syncLogRepository.save(log);
            } catch {
                // Ignore logging errors
            }
        } finally {
            this.isRunning = false;
        }
    }
}
