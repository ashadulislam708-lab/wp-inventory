import { ApiProperty } from '@nestjs/swagger';
import {
    IsBoolean,
    IsEmail,
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
} from 'class-validator';
import { SocialLoginTypeEnum } from 'src/shared/enums';

export class SocialLoginDto {
    @ApiProperty({
        example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjFlOWdkazcifQ...',
        description: 'Social login token (Google, Kakao, Naver, etc.)',
    })
    @IsNotEmpty()
    @IsString()
    token: string;

    @ApiProperty({ example: 'John Doe' })
    @IsNotEmpty()
    @IsString()
    fullName: string;

    @ApiProperty({ example: 'john.doe@example.com' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({
        enum: SocialLoginTypeEnum,
        example: SocialLoginTypeEnum.GOOGLE,
    })
    @IsEnum(SocialLoginTypeEnum)
    @IsNotEmpty()
    socialLoginType: SocialLoginTypeEnum;

    @ApiProperty({
        example: false,
        description: 'Keep user logged in for 30 days instead of 1 day',
        required: false,
    })
    @IsOptional()
    @IsBoolean()
    rememberMe?: boolean;

    @ApiProperty({ example: true, required: false })
    @IsOptional()
    @IsBoolean()
    termsAndConditionsAccepted?: boolean;
}
