import {
    Controller,
    Get,
    Post,
    Query,
    HttpCode,
    HttpStatus,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SyncLogService } from './sync-log.service.js';
import { StockReconciliationService } from './stock-reconciliation.service.js';
import { ListSyncLogsDto } from './dto/list-sync-logs.dto.js';
import { Roles } from '../../core/decorators/roles.decorator.js';
import { RolesGuard } from '../../core/guards/roles.guard.js';
import { UserRoleEnum } from '../../shared/enums/user-role.enum.js';

@ApiTags('Sync')
@ApiBearerAuth()
@Controller('sync')
@UseGuards(RolesGuard)
@Roles(UserRoleEnum.ADMIN)
export class SyncLogController {
    constructor(
        private readonly syncLogService: SyncLogService,
        private readonly stockReconciliationService: StockReconciliationService,
    ) {}

    /**
     * List sync logs with filtering and pagination
     * GET /api/sync/logs
     */
    @Get('logs')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'List sync logs',
        description:
            'Returns paginated sync logs with optional filters for direction, entity type, status, and date range.',
    })
    async listSyncLogs(@Query() dto: ListSyncLogsDto) {
        return this.syncLogService.listSyncLogs(dto);
    }

    /**
     * Manually trigger stock reconciliation
     * POST /api/sync/reconcile
     */
    @Post('reconcile')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Trigger stock reconciliation',
        description:
            'Manually triggers the hourly stock reconciliation job. Compares local stock vs WooCommerce and pushes local stock (local wins).',
    })
    async triggerReconciliation() {
        await this.stockReconciliationService.handleStockReconciliation();
        return {
            message: 'Stock reconciliation triggered successfully',
        };
    }
}
