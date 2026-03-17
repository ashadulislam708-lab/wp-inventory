import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderNoteDto {
    @ApiProperty({ description: 'Note content' })
    @IsString()
    @IsNotEmpty()
    content: string;
}
