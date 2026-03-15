import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CategoryService } from '../services/category.service.js';

@ApiTags('Categories')
@ApiBearerAuth()
@Controller('categories')
export class CategoryController {
    constructor(private readonly categoryService: CategoryService) {}

    /**
     * List all categories (synced from WooCommerce, used for product filtering)
     * GET /api/categories
     */
    @Get()
    @HttpCode(HttpStatus.OK)
    async findAll() {
        return this.categoryService.findAll();
    }
}
