import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OtpController } from './otp.controller';
import { Otp } from './otp.entity';
import { OtpService } from './otp.service';
import { User } from '@modules/users';
import { UtilsModule } from '@infrastructure/utils/utils.module';
import { I18nHelper } from 'src/core/utils/i18n.helper';

@Module({
    imports: [TypeOrmModule.forFeature([Otp, User]), UtilsModule],
    providers: [OtpService, I18nHelper],
    controllers: [OtpController],
    exports: [OtpService],
})
export class OtpModule {}
