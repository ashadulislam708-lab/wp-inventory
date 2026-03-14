import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RegisterFcmTokenDto {
    @ApiProperty({
        example:
            'fGxV7Z8qTQmXxX9X9X9X9X:APA91bF9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X',
        description:
            "Device FCM token - obtained from Firebase SDK on the client device. Will be added to the user's array of device tokens.",
    })
    @IsNotEmpty()
    @IsString()
    fcmToken: string;
}
