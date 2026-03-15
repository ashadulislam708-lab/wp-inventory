import { IsInt, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AdjustStockDto {
    @ApiProperty({
        description:
            'Stock adjustment amount (positive to add, negative to subtract)',
        example: -5,
    })
    @IsNotEmpty()
    @IsInt()
    quantity: number;

    @ApiProperty({
        description: 'Reason for adjustment',
        example: 'Physical count adjustment',
    })
    @IsNotEmpty()
    @IsString()
    reason: string;
}
