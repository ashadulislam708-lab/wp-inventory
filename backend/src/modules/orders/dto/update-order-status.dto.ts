import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OrderStatusEnum } from '../../../shared/enums/order-status.enum.js';

export class UpdateOrderStatusDto {
    @ApiProperty({
        description: 'New order status',
        enum: OrderStatusEnum,
    })
    @IsEnum(OrderStatusEnum)
    status: OrderStatusEnum;
}
