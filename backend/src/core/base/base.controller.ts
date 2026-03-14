import {
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    HttpCode,
    HttpStatus,
    ParseUUIDPipe,
} from '@nestjs/common';
import { ApiSwagger } from '../decorators';
import { BaseService } from './base.service';
import { BaseEntity } from './base.entity';
import {
    PaginationDto,
    CreatedResponseDto,
    PaginatedResponseDto,
    SuccessResponseDto,
    UpdatedResponseDto,
    DeletedResponseDto,
} from '@shared/dtos';

/**
 * Base Controller with common CRUD operations
 * Provides standardized REST endpoints for all resources
 *
 * @template T - Entity type that extends BaseEntity
 * @template CreateDto - DTO for creating entity
 * @template UpdateDto - DTO for updating entity
 *
 * Usage:
 * @Controller('users')
 * @ApiTags('Users')  // Don't forget to add @ApiTags in child controller
 * export class UserController extends BaseController<User, CreateUserDto, UpdateUserDto> {
 *   constructor(userService: UserService) {
 *     super(userService);
 *   }
 * }
 */
export abstract class BaseController<
    T extends BaseEntity,
    CreateDto = any,
    UpdateDto = any,
> {
    constructor(protected readonly service: BaseService<T>) {}

    /**
     * Create a new entity
     * POST /resource
     *
     * @param createDto - Data for creating the entity
     * @returns Created entity wrapped in CreatedResponseDto
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiSwagger({
        resourceName: 'Resource',
        operation: 'create',
        successStatus: 201,
    })
    async create(@Body() createDto: CreateDto): Promise<CreatedResponseDto<T>> {
        const entity = await this.service.create(createDto as any);
        return new CreatedResponseDto(
            entity,
            `${this.service['entityName'] || 'Resource'} created successfully`,
        );
    }

    /**
     * Get all entities with pagination
     * GET /resource?page=1&limit=10&sortBy=createdAt&sortOrder=DESC
     *
     * @param paginationDto - Pagination parameters
     * @returns Paginated response wrapped in PaginatedResponseDto
     *
     * Override this method in child controller to implement actual pagination
     */
    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Resources',
        operation: 'getAll',
        isArray: true,
        withPagination: true,
    })
    async findAll(
        @Query() paginationDto: PaginationDto,
    ): Promise<PaginatedResponseDto<T>> {
        // Default implementation - returns all
        // Override in child controller for actual pagination
        const entities = await this.service.findAll();

        const page = paginationDto.page || 1;
        const limit = paginationDto.limit || 10;
        const skip = (page - 1) * limit;

        const paginatedEntities = entities.slice(skip, skip + limit);

        return new PaginatedResponseDto(
            paginatedEntities,
            page,
            limit,
            entities.length,
            `${this.service['entityName'] || 'Resources'} retrieved successfully`,
        );
    }

    /**
     * Get entity by ID
     * GET /resource/:id
     *
     * @param id - Entity UUID
     * @returns Entity wrapped in SuccessResponseDto or throws NotFoundException
     */
    @Get(':id')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Resource',
        operation: 'getOne',
    })
    async findOne(
        @Param('id', ParseUUIDPipe) id: string,
    ): Promise<SuccessResponseDto<T>> {
        const entity = await this.service.findByIdOrFail(id);
        return new SuccessResponseDto(
            entity,
            `${this.service['entityName'] || 'Resource'} retrieved successfully`,
        );
    }

    /**
     * Update entity by ID
     * PATCH /resource/:id
     *
     * @param id - Entity UUID
     * @param updateDto - Data for updating the entity
     * @returns Updated entity wrapped in UpdatedResponseDto
     */
    @Patch(':id')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Resource',
        operation: 'update',
    })
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateDto: UpdateDto,
    ): Promise<UpdatedResponseDto<T>> {
        const updated = await this.service.update(id, updateDto as any);
        const entity = updated || (await this.service.findByIdOrFail(id));
        return new UpdatedResponseDto(
            entity,
            `${this.service['entityName'] || 'Resource'} updated successfully`,
        );
    }

    /**
     * Soft delete entity by ID
     * DELETE /resource/:id
     *
     * @param id - Entity UUID
     * @returns Success message wrapped in DeletedResponseDto
     */
    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Resource',
        operation: 'delete',
    })
    async remove(
        @Param('id', ParseUUIDPipe) id: string,
    ): Promise<DeletedResponseDto> {
        await this.service.remove(id);
        return new DeletedResponseDto(
            `${this.service['entityName'] || 'Resource'} deleted successfully`,
        );
    }

    /**
     * Count total entities
     * GET /resource/count
     *
     * Override route order by defining this in child controller BEFORE @Get(':id')
     */
    protected async count(): Promise<{ count: number }> {
        const entities = await this.service.findAll();
        return { count: entities.length };
    }

    /**
     * Restore soft-deleted entity
     * PATCH /resource/:id/restore
     *
     * Implement in child controller if needed
     */
    protected restore(@Param('id', ParseUUIDPipe) id: string): {
        message: string;
        id: string;
    } {
        // Implement restore logic in repository first
        return {
            message: `${this.service['entityName']} restored successfully`,
            id,
        };
    }

    /**
     * Hard delete entity
     * DELETE /resource/:id/permanent
     *
     * Implement in child controller if needed
     */
    protected async permanentDelete(
        @Param('id', ParseUUIDPipe) id: string,
    ): Promise<{ message: string; id: string }> {
        await this.service.delete(id);
        return {
            message: `${this.service['entityName']} permanently deleted`,
            id,
        };
    }

    /**
     * Bulk create entities
     * POST /resource/bulk
     *
     * Implement in child controller if needed
     */
    protected async bulkCreate(@Body() createDtos: CreateDto[]): Promise<T[]> {
        const entities = await Promise.all(
            createDtos.map((dto) => this.service.create(dto as any)),
        );
        return entities;
    }

    /**
     * Bulk delete entities
     * DELETE /resource/bulk
     *
     * Implement in child controller if needed
     */
    protected async bulkDelete(
        @Body() ids: string[],
    ): Promise<{ message: string; count: number }> {
        let count = 0;
        for (const id of ids) {
            await this.service.remove(id);
            count++;
        }
        return {
            message: `${count} ${this.service['entityName']}(s) deleted successfully`,
            count,
        };
    }

    /**
     * Search entities
     * GET /resource/search?q=searchTerm
     *
     * Implement in child controller with specific search logic
     */
    protected search(@Query('q') searchTerm: string): T[] {
        // Implement search logic in child controller
        return [];
    }

    /**
     * Export entities to CSV/JSON
     * GET /resource/export?format=csv
     *
     * Implement in child controller if needed
     */
    protected async export(
        @Query('format') format: 'csv' | 'json' = 'json',
    ): Promise<any> {
        const entities = await this.service.findAll();
        if (format === 'json') {
            return entities;
        }
        return entities;
    }
}
