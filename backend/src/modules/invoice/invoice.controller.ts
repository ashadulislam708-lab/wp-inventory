import {
    Controller,
    Get,
    Param,
    HttpCode,
    HttpStatus,
    ParseUUIDPipe,
} from '@nestjs/common';
import {
    ApiTags,
    ApiBearerAuth,
    ApiOperation,
    ApiParam,
} from '@nestjs/swagger';
import { InvoiceService } from './invoice.service.js';

@ApiTags('Invoices')
@ApiBearerAuth()
@Controller('invoices')
export class InvoiceController {
    constructor(private readonly invoiceService: InvoiceService) {}

    /**
     * Get invoice data for printing (thermal receipt 3x4 inch)
     * GET /api/invoices/:orderId
     */
    @Get(':orderId')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Get invoice data for an order',
        description:
            'Returns formatted invoice data for thermal receipt printing (3x4 inch). Includes order details, line items, totals, and QR code.',
    })
    @ApiParam({
        name: 'orderId',
        description: 'Order UUID',
        type: 'string',
        format: 'uuid',
    })
    async getInvoice(@Param('orderId', ParseUUIDPipe) orderId: string) {
        return this.invoiceService.getInvoiceDataByOrderId(orderId);
    }
}
