import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Query,
    Delete,
    HttpCode,
    HttpStatus,
    ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BaseController } from 'src/core/base';
import { ApiSwagger, Public } from 'src/core/decorators';
import { ResponsePayloadDto } from '@shared/dtos';
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from './dtos';
import { User } from './user.entity';

@ApiTags('Users')
@Controller('users')
export class UserController extends BaseController<
    User,
    CreateUserDto,
    UpdateUserDto
> {
    constructor(private readonly userService: UserService) {
        super(userService);
    }

    /**
     * Override create to use custom createUser method
     */
    @Public()
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiSwagger({
        resourceName: 'User',
        operation: 'create',
        requestDto: CreateUserDto,
        responseDto: UserResponseDto,
        successStatus: 201,
        errors: [
            { status: 400, description: 'Invalid input data' },
            { status: 409, description: 'User with this email already exists' },
        ],
    })
    async create(
        @Body() createUserDto: CreateUserDto,
    ): Promise<ResponsePayloadDto<User>> {
        return await this.userService.createUser(createUserDto);
    }

    /**
     * Override update to use custom updateUser method
     */
    @Patch(':id')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'User',
        operation: 'update',
        requestDto: UpdateUserDto,
        responseDto: UserResponseDto,
        errors: [
            { status: 400, description: 'Invalid input data or UUID format' },
            { status: 404, description: 'User not found' },
        ],
    })
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateUserDto: UpdateUserDto,
    ): Promise<ResponsePayloadDto<User>> {
        const user = await this.userService.updateUser(id, updateUserDto);
        return new ResponsePayloadDto({
            success: true,
            statusCode: 200,
            message: 'User updated successfully',
            data: user,
            timestamp: new Date().toISOString(),
        });
    }

    /**
     * Get all active users
     * GET /users/active
     */
    @Get('active')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Active Users',
        operation: 'getAll',
        responseDto: UserResponseDto,
        isArray: true,
        withPagination: true,
        errors: [{ status: 401, description: 'Unauthorized' }],
    })
    async getActiveUsers() {
        return this.userService.getActiveUsers();
    }

    /**
     * Search users by email
     * GET /users/search?email=test@example.com
     */
    @Get('search')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Users',
        operation: 'search',
        summary: 'Search users by email',
        responseDto: UserResponseDto,
        isArray: true,
        errors: [
            { status: 400, description: 'Invalid email format' },
            { status: 401, description: 'Unauthorized' },
        ],
    })
    async searchByEmail(@Query('email') email: string) {
        if (!email) {
            return [];
        }
        const user = await this.userService.findByEmail(email);
        return user ? [user] : [];
    }

    /**
     * Count total users
     * GET /users/count
     */
    @Get('count')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Users',
        operation: 'count',
        summary: 'Get total count of users',
        errors: [{ status: 401, description: 'Unauthorized' }],
    })
    async count() {
        return super.count();
    }

    /**
     * Get all users with pagination
     * GET /users?page=1&limit=10
     */
    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Users',
        operation: 'getAll',
        responseDto: UserResponseDto,
        isArray: true,
        withPagination: true,
        errors: [{ status: 401, description: 'Unauthorized' }],
    })
    async findAll(@Query() paginationDto: any) {
        return super.findAll(paginationDto);
    }

    /**
     * Get user by ID
     * GET /users/:id
     */
    @Get(':id')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'User',
        operation: 'getOne',
        responseDto: UserResponseDto,
        errors: [
            { status: 400, description: 'Invalid UUID format' },
            { status: 401, description: 'Unauthorized' },
            { status: 404, description: 'User not found' },
        ],
    })
    async findOne(@Param('id', ParseUUIDPipe) id: string) {
        return super.findOne(id);
    }

    /**
     * Delete user by ID
     * DELETE /users/:id
     */
    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'User',
        operation: 'delete',
        errors: [
            { status: 400, description: 'Invalid UUID format' },
            { status: 401, description: 'Unauthorized' },
            { status: 404, description: 'User not found' },
        ],
    })
    async remove(@Param('id', ParseUUIDPipe) id: string) {
        return super.remove(id);
    }
}
