import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    HttpCode,
    HttpStatus,
    ParseUUIDPipe,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from './user.service.js';
import { CreateUserDto } from './dtos/create-user.dto.js';
import { UpdateUserDto } from './dtos/update-user.dto.js';
import { Roles } from '../../core/decorators/roles.decorator.js';
import { RolesGuard } from '../../core/guards/roles.guard.js';
import { UserRoleEnum } from '../../shared/enums/user-role.enum.js';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(RolesGuard)
@Roles(UserRoleEnum.ADMIN)
export class UserController {
    constructor(private readonly userService: UserService) {}

    /**
     * List all users (admin only)
     * GET /api/users
     */
    @Get()
    @HttpCode(HttpStatus.OK)
    async findAll() {
        return this.userService.getAllUsers();
    }

    /**
     * Get user by ID (admin only)
     * GET /api/users/:id
     */
    @Get(':id')
    @HttpCode(HttpStatus.OK)
    async findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.userService.getUserById(id);
    }

    /**
     * Create user (admin only)
     * POST /api/users
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() createUserDto: CreateUserDto) {
        return this.userService.createUser(createUserDto);
    }

    /**
     * Update user details / reset password (admin only)
     * PATCH /api/users/:id
     */
    @Patch(':id')
    @HttpCode(HttpStatus.OK)
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateUserDto: UpdateUserDto,
    ) {
        return this.userService.updateUser(id, updateUserDto);
    }

    /**
     * Deactivate user (soft - set isActive=false, admin only)
     * DELETE /api/users/:id
     */
    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    async deactivate(@Param('id', ParseUUIDPipe) id: string) {
        return this.userService.deactivateUser(id);
    }
}
