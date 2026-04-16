import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateCourierInfoDto {
    @IsOptional()
    @IsString()
    @MaxLength(100)
    courierConsignmentId?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    courierTrackingCode?: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    courierTrackingUrl?: string;
}
