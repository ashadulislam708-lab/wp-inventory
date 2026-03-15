import {
    Controller,
    Get,
    Post,
    Param,
    Body,
    HttpCode,
    HttpStatus,
    ParseUUIDPipe,
    UseGuards,
} from '@nestjs/common';
import {
    ApiTags,
    ApiBearerAuth,
    ApiOperation,
    ApiParam,
} from '@nestjs/swagger';
import { WooCommerceService } from '../../woocommerce/services/woocommerce.service.js';
import { UserService } from '../../users/user.service.js';
import { ResetPasswordDto } from '../dto/reset-password.dto.js';
import { Roles } from '../../../core/decorators/roles.decorator.js';
import { RolesGuard } from '../../../core/guards/roles.guard.js';
import { UserRoleEnum } from '../../../shared/enums/user-role.enum.js';

@ApiTags('Settings')
@ApiBearerAuth()
@Controller('settings')
@UseGuards(RolesGuard)
@Roles(UserRoleEnum.ADMIN)
export class SettingsController {
    constructor(
        private readonly wooCommerceService: WooCommerceService,
        private readonly userService: UserService,
    ) {}

    /**
     * Check WooCommerce connection status
     * GET /api/settings/wc-status
     */
    @Get('wc-status')
    @HttpCode(HttpStatus.OK)
    async getWcStatus() {
        return this.wooCommerceService.checkWcStatus();
    }

    /**
     * Reset another user's password (admin only)
     * POST /api/settings/users/:id/reset-password
     *
     * The admin provides a new password which is hashed with bcrypt (10 rounds)
     * and stored for the target user.
     */
    @Post('users/:id/reset-password')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Reset user password (admin only)',
        description:
            "Admin-only endpoint to reset another user's password. Hashes the new password with bcrypt (10 salt rounds) and updates the target user.",
    })
    @ApiParam({
        name: 'id',
        description: 'Target user UUID whose password to reset',
        type: 'string',
        format: 'uuid',
    })
    async resetUserPassword(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: ResetPasswordDto,
    ) {
        // Verify the target user exists
        const user = await this.userService.getUserById(id);

        // Update the user's password via UserService (handles bcrypt hashing with 10 rounds)
        await this.userService.updateUser(id, { password: dto.newPassword });

        return {
            message: `Password for user ${user.email} has been reset successfully`,
        };
    }
}
