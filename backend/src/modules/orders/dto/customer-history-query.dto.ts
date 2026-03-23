import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CustomerHistoryQueryDto {
    @ApiProperty({ description: 'Bangladesh mobile number to look up' })
    @IsString()
    @IsNotEmpty()
    phone: string;
}
