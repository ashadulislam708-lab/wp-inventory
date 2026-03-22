import {
    Controller,
    Get,
    Post,
    Patch,
    Param,
    Body,
    Query,
    HttpCode,
    HttpStatus,
    ParseUUIDPipe,
    Res,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
    UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { OrderService } from '../services/order.service.js';
import { CreateOrderDto } from '../dto/create-order.dto.js';
import { UpdateOrderDto } from '../dto/update-order.dto.js';
import { UpdateOrderStatusDto } from '../dto/update-order-status.dto.js';
import { ListOrdersDto } from '../dto/list-orders.dto.js';
import { CreateOrderNoteDto } from '../dto/create-order-note.dto.js';
import { CustomerHistoryQueryDto } from '../dto/customer-history-query.dto.js';
import { CurrentUser } from '../../../core/decorators/current-user.decorator.js';
import { Roles } from '../../../core/decorators/roles.decorator.js';
import { RolesGuard } from '../../../core/guards/roles.guard.js';
import { UserRoleEnum } from '../../../shared/enums/user-role.enum.js';
import type { IJwtPayload } from '../../../shared/interfaces/jwt-payload.js';
import { OrderNoteService } from '../services/order-note.service.js';

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
export class OrderController {
    constructor(
        private readonly orderService: OrderService,
        private readonly orderNoteService: OrderNoteService,
    ) {}

    /**
     * List orders with filtering and pagination
     * GET /api/orders
     */
    @Get()
    @HttpCode(HttpStatus.OK)
    async findAll(@Query() dto: ListOrdersDto) {
        return this.orderService.listOrders(dto);
    }

    /**
     * Export filtered orders as CSV
     * GET /api/orders/export
     */
    @Get('export')
    async exportOrders(@Query() dto: ListOrdersDto, @Res() res: any) {
        const csv = await this.orderService.exportOrders(dto);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=orders-${new Date().toISOString().split('T')[0]}.csv`,
        );
        res.send(csv);
    }

    /**
     * Get customer order history stats by phone number
     * GET /api/orders/customer-history?phone=01XXXXXXXXX
     */
    @Get('customer-history')
    @HttpCode(HttpStatus.OK)
    async getCustomerHistory(@Query() dto: CustomerHistoryQueryDto) {
        return this.orderService.getCustomerHistory(dto.phone);
    }

    /**
     * Create order with auto invoice ID, stock decrement, Steadfast push
     * POST /api/orders
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(
        @Body() dto: CreateOrderDto,
        @CurrentUser() user: IJwtPayload,
    ) {
        return this.orderService.createOrder(dto, user);
    }

    /**
     * Bulk import orders from CSV file
     * POST /api/orders/import
     * Admin-only endpoint
     * Must be defined before parameterized :id routes
     */
    @Post('import')
    @HttpCode(HttpStatus.OK)
    @UseGuards(RolesGuard)
    @Roles(UserRoleEnum.ADMIN)
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        description: 'CSV file with order data',
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    async importOrders(
        @UploadedFile() file: Express.Multer.File,
        @CurrentUser() user: IJwtPayload,
    ) {
        if (!file) {
            throw new BadRequestException('CSV file is required');
        }

        if (!file.originalname.endsWith('.csv')) {
            throw new BadRequestException('File must be a CSV file');
        }

        return this.orderService.importOrdersFromCsv(file.buffer, user);
    }

    /**
     * Get order detail with line items
     * GET /api/orders/:id
     */
    @Get(':id')
    @HttpCode(HttpStatus.OK)
    async findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.orderService.getOrderById(id);
    }

    /**
     * Edit order details (PENDING/CONFIRMED only)
     * Allows changing: customerName, customerPhone, customerAddress, shippingZone
     * Does NOT allow changing order items.
     * Recalculates shippingFee and grandTotal when shippingZone changes.
     * Re-pushes to Steadfast if consignment details changed.
     * PATCH /api/orders/:id
     */
    @Patch(':id')
    @HttpCode(HttpStatus.OK)
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateOrderDto,
    ) {
        return this.orderService.updateOrderDetails(id, dto);
    }

    /**
     * Update order status with side effects
     * PATCH /api/orders/:id/status
     */
    @Patch(':id/status')
    @HttpCode(HttpStatus.OK)
    async updateStatus(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateOrderStatusDto,
        @CurrentUser() user: IJwtPayload,
    ) {
        return this.orderService.updateOrderStatus(id, dto, user);
    }

    /**
     * Get invoice data for print
     * GET /api/orders/:id/invoice
     */
    @Get(':id/invoice')
    @HttpCode(HttpStatus.OK)
    async getInvoice(@Param('id', ParseUUIDPipe) id: string) {
        return this.orderService.getInvoiceData(id);
    }

    /**
     * Get QR code for order
     * GET /api/orders/:id/qr
     */
    @Get(':id/qr')
    @HttpCode(HttpStatus.OK)
    async getQrCode(@Param('id', ParseUUIDPipe) id: string) {
        return this.orderService.getQrCode(id);
    }

    /**
     * Retry Steadfast courier push
     * POST /api/orders/:id/retry-courier
     */
    @Post(':id/retry-courier')
    @HttpCode(HttpStatus.OK)
    async retryCourier(@Param('id', ParseUUIDPipe) id: string) {
        return this.orderService.retryCourier(id);
    }

    /**
     * Add a note to an order
     * POST /api/orders/:id/notes
     */
    @Post(':id/notes')
    @HttpCode(HttpStatus.CREATED)
    async addNote(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: CreateOrderNoteDto,
        @CurrentUser() user: IJwtPayload,
    ) {
        return this.orderNoteService.addNote(id, dto, user);
    }

    /**
     * List notes for an order
     * GET /api/orders/:id/notes
     */
    @Get(':id/notes')
    @HttpCode(HttpStatus.OK)
    async listNotes(@Param('id', ParseUUIDPipe) id: string) {
        return this.orderNoteService.listNotes(id);
    }
}
