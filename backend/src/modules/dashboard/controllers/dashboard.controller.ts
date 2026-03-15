import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from '../services/dashboard.service.js';

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
    async getLowStock() {
        return this.dashboardService.getLowStockProducts();
    }

    /**
     * Recent orders (last 10)
     * GET /api/dashboard/recent-orders
     */
    @Get('recent-orders')
    @HttpCode(HttpStatus.OK)
    async getRecentOrders() {
        return this.dashboardService.getRecentOrders();
    }
}
