import { Controller, Get, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from '../services/dashboard.service.js';
import { PaginationDto } from '../../../shared/dtos/pagination.dto.js';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) {}

    /**
     * Dashboard stats summary
     * GET /api/dashboard/stats
     */
    @Get('stats')
    @HttpCode(HttpStatus.OK)
    async getStats() {
        return this.dashboardService.getStats();
    }

    /**
     * Products with low stock
     * GET /api/dashboard/low-stock
     */
    @Get('low-stock')
    @HttpCode(HttpStatus.OK)
    async getLowStock(@Query() paginationDto: PaginationDto) {
        return this.dashboardService.getLowStockProducts(
            paginationDto.page,
            paginationDto.limit,
        );
    }

    /**
     * Recent orders (paginated)
     * GET /api/dashboard/recent-orders
     */
    @Get('recent-orders')
    @HttpCode(HttpStatus.OK)
    async getRecentOrders(@Query() paginationDto: PaginationDto) {
        return this.dashboardService.getRecentOrders(
            paginationDto.page,
            paginationDto.limit,
        );
    }
}
