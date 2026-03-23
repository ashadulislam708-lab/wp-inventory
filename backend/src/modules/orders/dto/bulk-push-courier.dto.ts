import { IsArray, ArrayMinSize, ArrayMaxSize, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BulkPushCourierDto {
    @ApiProperty({
        description: 'Array of order UUIDs to push to courier',
        example: ['uuid-1', 'uuid-2'],
    })
    @IsArray()
    @ArrayMinSize(1)
    @ArrayMaxSize(50)
    @IsUUID('4', { each: true })
    orderIds: string[];
}
