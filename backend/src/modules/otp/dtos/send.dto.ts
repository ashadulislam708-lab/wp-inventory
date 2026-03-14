import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class SendOtpDto {
    @ApiProperty({
        example: 'example@gmail.com',
        description: 'The name of the user',
    })
    @IsNotEmpty()
    @IsEmail()
    email: string;
}
