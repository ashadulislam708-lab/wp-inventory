import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ShippingZoneEnum } from '../../../shared/enums/shipping-zone.enum.js';

/**
 * DTO for updating order details (customer info + shipping zone).
 * Only allowed for orders in PENDING or CONFIRMED status.
 * Does NOT allow changing order items.
 * Recalculates shippingFee and grandTotal when shippingZone changes.
 */
export class UpdateOrderDto {
    @ApiPropertyOptional({ description: 'Customer full name' })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    customerName?: string;

    @ApiPropertyOptional({ description: 'Bangladesh mobile number' })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    customerPhone?: string;

    @ApiPropertyOptional({ description: 'Full delivery address' })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    customerAddress?: string;

    @ApiPropertyOptional({
        description: 'Shipping zone -- recalculates shippingFee and grandTotal',
        enum: ShippingZoneEnum,
    })
    @IsOptional()
    @IsEnum(ShippingZoneEnum)
    shippingZone?: ShippingZoneEnum;
}
