import { Module } from '@nestjs/common';
import { SettingsController } from './controllers/settings.controller.js';
import { WooCommerceModule } from '../woocommerce/woocommerce.module.js';
import { UserModule } from '../users/user.module.js';

@Module({
    imports: [WooCommerceModule, UserModule],
    controllers: [SettingsController],
})
export class SettingsModule {}
