import { Controller, Get, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TrackingService } from '../services/tracking.service.js';
import { Public } from '../../../core/decorators/public.decorator.js';

@ApiTags('Tracking')
@Controller('tracking')
export class TrackingController {
    constructor(private readonly trackingService: TrackingService) {}

    /**
     * Public order tracking by invoice ID (no auth required)
     * GET /api/tracking/:invoiceId
     */
    @Public()
    @Get(':invoiceId')
    @HttpCode(HttpStatus.OK)
    async getTracking(@Param('invoiceId') invoiceId: string) {
        return this.trackingService.getTrackingByInvoiceId(invoiceId);
    }
}
