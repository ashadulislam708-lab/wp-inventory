# Base Classes Guide (Controller, Service, Repository, Entity)# Base Classes Guide (Controller, Service, Repository, Entity)



## 📚 Overview## 📚 Overview



This guide covers the **four-layer architecture** that provides standardized CRUD operations and reduces boilerplate code across your application:This guide covers the **four-layer architecture** that provides standardized CRUD operations and reduces boilerplate code across your application:



1. **BaseEntity** - Common database fields (id, timestamps, soft delete)1. **BaseEntity** - Common database fields (id, timestamps, soft delete)

2. **BaseRepository** - Database access layer with CRUD operations2. **BaseRepository** - Database access layer with CRUD operations

3. **BaseService** - Business logic layer with validation3. **BaseService** - Business logic layer with validation

4. **BaseController** - HTTP endpoint layer with standardized responses4. **BaseController** - HTTP endpoint layer with standardized responses



## 🏗️ Architecture Flow## 🏗️ Architecture Flow



``````

Request → Controller → Service → Repository → DatabaseRequest → Controller → Service → Repository → Database

         (BaseController) (BaseService) (BaseRepository) (BaseEntity)         (BaseController) (BaseService) (BaseRepository) (BaseEntity)

``````



**Data Flow:**---

- **Controller** receives HTTP request → validates input → calls Service

- **Service** applies business logic → validates data → calls Repository## 1️⃣ BaseEntity

- **Repository** executes database query → returns entity

- **Entity** represents database table row### Overview

Provides common fields that every entity needs: `id`, `createdAt`, `updatedAt`, and `deletedAt` (for soft delete).

---

### Implementation

## 1️⃣ BaseEntity

```typescript

### Overviewimport {

Provides common fields that every entity needs: `id`, `createdAt`, `updatedAt`, and `deletedAt` (for soft delete).  PrimaryGeneratedColumn,

  CreateDateColumn,

### Implementation  UpdateDateColumn,

  DeleteDateColumn,

**Location**: `src/core/base/base.entity.ts`  BaseEntity as TypeOrmBaseEntity,

} from 'typeorm';

```typescript

import {export abstract class BaseEntity extends TypeOrmBaseEntity {

  PrimaryGeneratedColumn,  @PrimaryGeneratedColumn('uuid')

  CreateDateColumn,  id: string;

  UpdateDateColumn,

  DeleteDateColumn,  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })

  BaseEntity as TypeOrmBaseEntity,  createdAt: Date;

} from 'typeorm';

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })

export abstract class BaseEntity extends TypeOrmBaseEntity {  updatedAt: Date;

  @PrimaryGeneratedColumn('uuid')

  id: string;  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })

  deletedAt?: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })}

  createdAt: Date;```



  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })### Features

  updatedAt: Date;- ✅ **UUID Primary Key** - Automatically generated unique identifier

- ✅ **Auto Timestamps** - `createdAt` and `updatedAt` managed automatically

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })- ✅ **Soft Delete Support** - `deletedAt` field for soft deletion

  deletedAt?: Date;- ✅ **TypeORM Active Record** - Extends TypeORM's BaseEntity for convenience methods

}

```### Usage Example



### Features```typescript

- ✅ **UUID Primary Key** - Automatically generated unique identifierimport { Entity, Column } from 'typeorm';

- ✅ **Auto Timestamps** - `createdAt` and `updatedAt` managed automaticallyimport { BaseEntity } from 'src/core/base/base.entity';

- ✅ **Soft Delete Support** - `deletedAt` field for soft deletion

- ✅ **TypeORM Active Record** - Extends TypeORM's BaseEntity for convenience methods@Entity('products')

export class Product extends BaseEntity {

### Usage Example  @Column()

  name: string;

```typescript

import { Entity, Column } from 'typeorm';  @Column({ type: 'decimal', precision: 10, scale: 2 })

import { BaseEntity } from 'src/core/base/base.entity';  price: number;



@Entity('products')  @Column({ nullable: true })

export class Product extends BaseEntity {  description?: string;

  @Column()

  name: string;  // id, createdAt, updatedAt, deletedAt inherited automatically

}

  @Column({ type: 'decimal', precision: 10, scale: 2 })```

  price: number;

### Database Schema Generated

  @Column({ nullable: true })

  description?: string;```sql

CREATE TABLE products (

  // id, createdAt, updatedAt, deletedAt inherited automatically  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

}  name VARCHAR NOT NULL,

```  price DECIMAL(10,2) NOT NULL,

  description VARCHAR NULL,

### Database Schema Generated  created_at TIMESTAMP DEFAULT NOW(),

  updated_at TIMESTAMP DEFAULT NOW(),

```sql  deleted_at TIMESTAMP NULL

CREATE TABLE products ();

  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),```

  name VARCHAR NOT NULL,

  price DECIMAL(10,2) NOT NULL,---

  description VARCHAR NULL,

  created_at TIMESTAMP DEFAULT NOW(),## 2️⃣ BaseRepository

  updated_at TIMESTAMP DEFAULT NOW(),

  deleted_at TIMESTAMP NULL### Overview

);Provides common database operations with TypeORM. Handles CRUD operations and includes support for relations and soft deletes.

```

### Implementation

### Field Reference

```typescript

| Field | Type | Description | Auto-Managed |import {

|-------|------|-------------|--------------|  Repository,

| `id` | UUID | Primary key, unique identifier | ✅ On insert |  FindOptionsWhere,

| `createdAt` | Date | Record creation timestamp | ✅ On insert |  FindManyOptions,

| `updatedAt` | Date | Last update timestamp | ✅ On update |  DeepPartial,

| `deletedAt` | Date? | Soft delete timestamp (nullable) | ✅ On soft delete |  FindOptionsRelations,

} from 'typeorm';

---import { BaseEntity } from './base.entity';



## 2️⃣ BaseRepositoryexport abstract class BaseRepository<T extends BaseEntity> {

  constructor(protected readonly repository: Repository<T>) {}

### Overview

Provides common database operations with TypeORM. Handles CRUD operations and includes support for relations and soft deletes.  protected defaultRelations?: FindOptionsRelations<T>;



### Implementation  async findById(id: string, relations?: FindOptionsRelations<T>): Promise<T | null>

  async findAll(options?: FindManyOptions<T>): Promise<T[]>

**Location**: `src/core/base/base.repository.ts`  async findOne(where: FindOptionsWhere<T>, relations?: FindOptionsRelations<T>): Promise<T | null>

  async create(data: DeepPartial<T>): Promise<T>

```typescript  async update(id: string, data: DeepPartial<T>): Promise<T | null>

import {  async softDelete(id: string): Promise<boolean>

  Repository,  async delete(id: string): Promise<boolean>

  FindOptionsWhere,  async count(options?: FindManyOptions<T>): Promise<number>

  FindManyOptions,}

  DeepPartial,```

  FindOptionsRelations,

} from 'typeorm';### Features

import { BaseEntity } from './base.entity';- ✅ **Type-Safe Queries** - Full TypeScript support

- ✅ **Relation Loading** - Automatic relation handling with `defaultRelations`

export abstract class BaseRepository<T extends BaseEntity> {- ✅ **Soft Delete** - Built-in soft delete support

  constructor(protected readonly repository: Repository<T>) {}- ✅ **Flexible Queries** - Supports TypeORM FindOptions

- ✅ **Count Operations** - Built-in counting support

  protected defaultRelations?: FindOptionsRelations<T>;

### Usage Example

  // Find by ID

  async findById(#### Basic Repository

    id: string,

    relations?: FindOptionsRelations<T>```typescript

  ): Promise<T | null> {import { Injectable } from '@nestjs/common';

    return this.repository.findOne({import { InjectRepository } from '@nestjs/typeorm';

      where: { id } as FindOptionsWhere<T>,import { Repository } from 'typeorm';

      relations: relations || this.defaultRelations,import { BaseRepository } from 'src/core/base/base.repository';

    });import { Product } from './entities/product.entity';

  }

@Injectable()

  // Find all with optionsexport class ProductRepository extends BaseRepository<Product> {

  async findAll(options?: FindManyOptions<T>): Promise<T[]> {  constructor(

    return this.repository.find({    @InjectRepository(Product)

      ...options,    repository: Repository<Product>,

      relations: options?.relations || this.defaultRelations,  ) {

    });    super(repository);

  }  }

}

  // Find one by conditions```

  async findOne(

    where: FindOptionsWhere<T>,#### Repository with Relations

    relations?: FindOptionsRelations<T>

  ): Promise<T | null> {```typescript

    return this.repository.findOne({@Injectable()

      where,export class ProductRepository extends BaseRepository<Product> {

      relations: relations || this.defaultRelations,  // Define default relations to load

    });  protected defaultRelations = {

  }    category: true,

    tags: true,

  // Create new entity  };

  async create(data: DeepPartial<T>): Promise<T> {

    const entity = this.repository.create(data);  constructor(

    return this.repository.save(entity);    @InjectRepository(Product)

  }    repository: Repository<Product>,

  ) {

  // Update entity    super(repository);

  async update(id: string, data: DeepPartial<T>): Promise<T | null> {  }

    await this.repository.update(id, data as any);

    return this.findById(id);  // Custom query methods

  }  async findByCategory(categoryId: string): Promise<Product[]> {

    return this.repository.find({

  // Soft delete      where: { categoryId },

  async softDelete(id: string): Promise<boolean> {      relations: this.defaultRelations,

    const result = await this.repository.softDelete(id);    });

    return result.affected > 0;  }

  }

  async searchByName(query: string): Promise<Product[]> {

  // Hard delete    return this.repository

  async delete(id: string): Promise<boolean> {      .createQueryBuilder('product')

    const result = await this.repository.delete(id);      .where('product.name LIKE :query', { query: `%${query}%` })

    return result.affected > 0;      .leftJoinAndSelect('product.category', 'category')

  }      .getMany();

  }

  // Count entities

  async count(options?: FindManyOptions<T>): Promise<number> {  async findFeatured(): Promise<Product[]> {

    return this.repository.count(options);    return this.findAll({

  }      where: { isFeatured: true },

}      order: { createdAt: 'DESC' },

```      take: 10,

    });

### Features  }

- ✅ **Type-Safe Queries** - Full TypeScript support}

- ✅ **Relation Loading** - Automatic relation handling with `defaultRelations````

- ✅ **Soft Delete Aware** - Automatically excludes soft-deleted records

- ✅ **Flexible Queries** - Supports TypeORM FindOptions### Method Reference

- ✅ **Count Operations** - Built-in counting support

| Method | Description | Returns | Soft Delete Aware |

### Usage Example|--------|-------------|---------|-------------------|

| `findById(id, relations?)` | Find entity by ID | `T \| null` | ✅ Yes |

#### Basic Repository| `findAll(options?)` | Find all entities | `T[]` | ✅ Yes |

| `findOne(where, relations?)` | Find one by conditions | `T \| null` | ✅ Yes |

```typescript| `create(data)` | Create new entity | `T` | N/A |

import { Injectable } from '@nestjs/common';| `update(id, data)` | Update entity | `T \| null` | N/A |

import { InjectRepository } from '@nestjs/typeorm';| `softDelete(id)` | Soft delete entity | `boolean` | N/A |

import { Repository } from 'typeorm';| `delete(id)` | Hard delete entity | `boolean` | N/A |

import { BaseRepository } from 'src/core/base/base.repository';| `count(options?)` | Count entities | `number` | ✅ Yes |

import { Product } from './entities/product.entity';

---

@Injectable()

export class ProductRepository extends BaseRepository<Product> {## 3️⃣ BaseService

  constructor(

    @InjectRepository(Product)### Overview

    repository: Repository<Product>,Provides business logic layer with automatic error handling and validation. Services call repositories and throw appropriate exceptions.

  ) {

    super(repository);### Implementation

  }

}```typescript

```import { NotFoundException } from '@nestjs/common';

import { BaseRepository } from './base.repository';

#### Repository with Relationsimport { BaseEntity } from './base.entity';

import { FindManyOptions, DeepPartial, FindOptionsRelations } from 'typeorm';

```typescript

@Injectable()export abstract class BaseService<T extends BaseEntity> {

export class ProductRepository extends BaseRepository<Product> {  constructor(

  // Define default relations to load    protected readonly repository: BaseRepository<T>,

  protected defaultRelations = {    protected readonly entityName: string,

    category: true,  ) {}

    tags: true,

  };  protected defaultRelations?: FindOptionsRelations<T>;



  constructor(  async findByIdOrFail(id: string, relations?: FindOptionsRelations<T>): Promise<T>

    @InjectRepository(Product)  async findAll(options?: FindManyOptions<T>): Promise<T[]>

    repository: Repository<Product>,  async create(data: DeepPartial<T>): Promise<T>

  ) {  async update(id: string, data: DeepPartial<T>): Promise<T | null>

    super(repository);  async remove(id: string): Promise<void>  // Soft delete

  }  async delete(id: string): Promise<void>  // Hard delete

}}

``````



#### Repository with Custom Queries### Features

- ✅ **Auto Error Handling** - Throws `NotFoundException` automatically

```typescript- ✅ **Entity Name in Errors** - Clear error messages with entity name

@Injectable()- ✅ **Validation** - Ensures entity exists before operations

export class ProductRepository extends BaseRepository<Product> {- ✅ **Relation Support** - Inherits relation loading from repository

  constructor(- ✅ **Type Safety** - Full TypeScript support

    @InjectRepository(Product)

    repository: Repository<Product>,### Usage Example

  ) {

    super(repository);#### Basic Service

  }

```typescript

  async findByCategory(categoryId: string): Promise<Product[]> {import { Injectable } from '@nestjs/common';

    return this.repository.find({import { BaseService } from 'src/core/base/base.service';

      where: { categoryId },import { Product } from './entities/product.entity';

      relations: { category: true },import { ProductRepository } from './product.repository';

    });

  }@Injectable()

export class ProductService extends BaseService<Product> {

  async searchByName(query: string): Promise<Product[]> {  constructor(private readonly productRepository: ProductRepository) {

    return this.repository    super(productRepository, 'Product');

      .createQueryBuilder('product')  }

      .where('product.name LIKE :query', { query: `%${query}%` })}

      .leftJoinAndSelect('product.category', 'category')```

      .getMany();

  }#### Service with Custom Logic



  async findFeatured(): Promise<Product[]> {```typescript

    return this.findAll({import { Injectable, BadRequestException } from '@nestjs/common';

      where: { isFeatured: true },import { BaseService } from 'src/core/base/base.service';

      order: { createdAt: 'DESC' },import { I18nHelper } from 'src/core/utils/i18n.helper';

      take: 10,import { Product } from './entities/product.entity';

    });import { ProductRepository } from './product.repository';

  }import { CreateProductDto, UpdateProductDto } from './dto';



  async findByPriceRange(min: number, max: number): Promise<Product[]> {@Injectable()

    return this.repositoryexport class ProductService extends BaseService<Product> {

      .createQueryBuilder('product')  constructor(

      .where('product.price BETWEEN :min AND :max', { min, max })    private readonly productRepository: ProductRepository,

      .getMany();    private readonly i18nHelper: I18nHelper,

  }  ) {

}    super(productRepository, 'Product');

```  }



### Method Reference  // Override create with custom validation

  async create(data: DeepPartial<Product>): Promise<Product> {

| Method | Description | Returns | Soft Delete Aware |    // Custom validation

|--------|-------------|---------|-------------------|    if (data.price && data.price < 0) {

| `findById(id, relations?)` | Find entity by ID | `T \| null` | ✅ Yes |      throw new BadRequestException(

| `findAll(options?)` | Find all entities | `T[]` | ✅ Yes |        this.i18nHelper.t('product.invalidPrice')

| `findOne(where, relations?)` | Find one by conditions | `T \| null` | ✅ Yes |      );

| `create(data)` | Create new entity | `T` | N/A |    }

| `update(id, data)` | Update entity | `T \| null` | N/A |

| `softDelete(id)` | Soft delete entity | `boolean` | N/A |    // Generate slug

| `delete(id)` | Hard delete entity | `boolean` | N/A |    if (data.name) {

| `count(options?)` | Count entities | `number` | ✅ Yes |      data.slug = this.generateSlug(data.name);

    }

---

    return super.create(data);

## 3️⃣ BaseService  }



### Overview  // Custom business methods

Provides business logic layer with automatic error handling and validation. Services call repositories and throw appropriate exceptions.  async getFeaturedProducts(): Promise<Product[]> {

    return this.productRepository.findFeatured();

### Implementation  }



**Location**: `src/core/base/base.service.ts`  async searchByName(query: string): Promise<Product[]> {

    if (!query || query.length < 3) {

```typescript      throw new BadRequestException(

import { NotFoundException } from '@nestjs/common';        this.i18nHelper.t('product.searchTooShort')

import { BaseRepository } from './base.repository';      );

import { BaseEntity } from './base.entity';    }

import { FindManyOptions, DeepPartial, FindOptionsRelations } from 'typeorm';    return this.productRepository.searchByName(query);

  }

export abstract class BaseService<T extends BaseEntity> {

  constructor(  async updateStock(id: string, quantity: number): Promise<Product> {

    protected readonly repository: BaseRepository<T>,    const product = await this.findByIdOrFail(id);

    protected readonly entityName: string,    

  ) {}    if (quantity < 0) {

      throw new BadRequestException(

  protected defaultRelations?: FindOptionsRelations<T>;        this.i18nHelper.t('product.invalidStock')

      );

  // Find by ID or throw error    }

  async findByIdOrFail(

    id: string,    product.stock = quantity;

    relations?: FindOptionsRelations<T>    return this.repository.update(id, { stock: quantity });

  ): Promise<T> {  }

    const entity = await this.repository.findById(

      id,  private generateSlug(name: string): string {

      relations || this.defaultRelations    return name

    );      .toLowerCase()

      .trim()

    if (!entity) {      .replace(/[^\w\s-]/g, '')

      throw new NotFoundException(`${this.entityName} with ID ${id} not found`);      .replace(/[\s_-]+/g, '-')

    }      .replace(/^-+|-+$/g, '');

  }

    return entity;}

  }```



  // Find all entities#### Service with i18n Support

  async findAll(options?: FindManyOptions<T>): Promise<T[]> {

    return this.repository.findAll({```typescript

      ...options,@Injectable()

      relations: options?.relations || this.defaultRelations,export class ProductService extends BaseService<Product> {

    });  constructor(

  }    private readonly productRepository: ProductRepository,

    private readonly i18nHelper: I18nHelper,

  // Create new entity  ) {

  async create(data: DeepPartial<T>): Promise<T> {    super(productRepository, 'Product');

    return this.repository.create(data);  }

  }

  async findByIdOrFail(id: string): Promise<Product> {

  // Update entity    const product = await this.repository.findById(id);

  async update(id: string, data: DeepPartial<T>): Promise<T | null> {    if (!product) {

    await this.findByIdOrFail(id);      throw new NotFoundException(

    return this.repository.update(id, data);        this.i18nHelper.t('product.notFound', { args: { id } })

  }      );

    }

  // Soft delete    return product;

  async remove(id: string): Promise<void> {  }

    await this.findByIdOrFail(id);

    await this.repository.softDelete(id);  async create(data: DeepPartial<Product>): Promise<Product> {

  }    // Validation with translated messages

    if (!data.name) {

  // Hard delete      throw new BadRequestException(

  async delete(id: string): Promise<void> {        this.i18nHelper.t('product.nameRequired')

    await this.findByIdOrFail(id);      );

    await this.repository.delete(id);    }

  }

}    return super.create(data);

```  }

}

### Features```

- ✅ **Auto Error Handling** - Throws `NotFoundException` automatically

- ✅ **Entity Name in Errors** - Clear error messages with entity name### Error Handling

- ✅ **Validation** - Ensures entity exists before operations

- ✅ **Relation Support** - Inherits relation loading from repositoryBaseService automatically throws `NotFoundException` with clear messages:

- ✅ **Type Safety** - Full TypeScript support

```typescript

### Usage Example// Throws: "Product with ID abc-123 not found"

const product = await productService.findByIdOrFail('abc-123');

#### Basic Service

// With i18n: "제품 ID abc-123을 찾을 수 없습니다" (Korean)

```typescriptconst product = await productService.findByIdOrFail('abc-123');

import { Injectable } from '@nestjs/common';```

import { BaseService } from 'src/core/base/base.service';

import { Product } from './entities/product.entity';---

import { ProductRepository } from './product.repository';

## 4️⃣ BaseController

@Injectable()

export class ProductService extends BaseService<Product> {### Overview

  constructor(private readonly productRepository: ProductRepository) {

    super(productRepository, 'Product');```typescript

  }import { Controller } from '@nestjs/common';

}import { BaseController } from 'src/core/base';

```import { Product } from './product.entity';

import { ProductService } from './product.service';

#### Service with Custom Logicimport { CreateProductDto, UpdateProductDto } from './dtos';



```typescript@Controller('products')

import { Injectable, BadRequestException } from '@nestjs/common';export class ProductController extends BaseController<

import { BaseService } from 'src/core/base/base.service';  Product,

import { I18nHelper } from 'src/core/utils/i18n.helper';  CreateProductDto,

import { Product } from './entities/product.entity';  UpdateProductDto

import { ProductRepository } from './product.repository';> {

  constructor(private readonly productService: ProductService) {

@Injectable()    super(productService);

export class ProductService extends BaseService<Product> {  }

  constructor(

    private readonly productRepository: ProductRepository,  // That's it! You get all CRUD operations automatically

    private readonly i18nHelper: I18nHelper,}

  ) {```

    super(productRepository, 'Product');

  }**Available Endpoints:**

- `POST /products` - Create product

  // Override create with custom validation- `GET /products` - Get all products (with pagination)

  async create(data: DeepPartial<Product>): Promise<Product> {- `GET /products/:id` - Get product by ID

    if (data.price && data.price < 0) {- `PATCH /products/:id` - Update product

      throw new BadRequestException(- `DELETE /products/:id` - Soft delete product

        this.i18nHelper.t('product.invalidPrice')

      );### 2. Controller with Custom Methods

    }

```typescript

    if (data.name) {import { Controller, Get, Query, HttpCode, HttpStatus } from '@nestjs/common';

      data.slug = this.generateSlug(data.name);import { BaseController } from 'src/core/base';

    }import { Product } from './product.entity';

import { ProductService } from './product.service';

    return super.create(data);import { CreateProductDto, UpdateProductDto } from './dtos';

  }

@Controller('products')

  // Custom business methodsexport class ProductController extends BaseController<

  async getFeaturedProducts(): Promise<Product[]> {  Product,

    return this.productRepository.findFeatured();  CreateProductDto,

  }  UpdateProductDto

> {

  async searchByName(query: string): Promise<Product[]> {  constructor(private readonly productService: ProductService) {

    if (!query || query.length < 3) {    super(productService);

      throw new BadRequestException(  }

        this.i18nHelper.t('product.searchTooShort')

      );  /**

    }   * Custom method - Search products by name

    return this.productRepository.searchByName(query);   * IMPORTANT: Define BEFORE inherited @Get(':id') to avoid route conflicts

  }   */

  @Get('search')

  async updateStock(id: string, quantity: number): Promise<Product> {  @HttpCode(HttpStatus.OK)

    const product = await this.findByIdOrFail(id);  async searchByName(@Query('name') name: string) {

        return this.productService.searchByName(name);

    if (quantity < 0) {  }

      throw new BadRequestException(

        this.i18nHelper.t('product.invalidStock')  /**

      );   * Custom method - Get featured products

    }   */

  @Get('featured')

    product.stock = quantity;  @HttpCode(HttpStatus.OK)

    return this.repository.update(id, { stock: quantity });  async getFeatured() {

  }    return this.productService.getFeaturedProducts();

  }

  private generateSlug(name: string): string {

    return name  /**

      .toLowerCase()   * Use protected count method

      .trim()   */

      .replace(/[^\w\s-]/g, '')  @Get('count')

      .replace(/[\s_-]+/g, '-')  @HttpCode(HttpStatus.OK)

      .replace(/^-+|-+$/g, '');  async count() {

  }    return super.count();

}  }

```}

```

### Error Handling

### 3. Controller with Overridden Methods

BaseService automatically throws `NotFoundException` with clear messages:

```typescript

```typescriptimport {

// Throws: "Product with ID abc-123 not found"  Controller,

const product = await productService.findByIdOrFail('abc-123');  Post,

  Patch,

// With i18n: "제품 ID abc-123을 찾을 수 없습니다" (Korean)  Body,

const product = await productService.findByIdOrFail('abc-123');  Param,

```  HttpCode,

  HttpStatus,

### Method Reference  ParseUUIDPipe,

} from '@nestjs/common';

| Method | Description | Throws | Returns |import { BaseController } from 'src/core/base';

|--------|-------------|--------|---------|import { Product } from './product.entity';

| `findByIdOrFail(id, relations?)` | Find by ID or throw | NotFoundException | `T` |import { ProductService } from './product.service';

| `findAll(options?)` | Find all entities | - | `T[]` |import { CreateProductDto, UpdateProductDto } from './dtos';

| `create(data)` | Create new entity | - | `T` |

| `update(id, data)` | Update entity | NotFoundException | `T \| null` |@Controller('products')

| `remove(id)` | Soft delete | NotFoundException | `void` |export class ProductController extends BaseController<

| `delete(id)` | Hard delete | NotFoundException | `void` |  Product,

  CreateProductDto,

---  UpdateProductDto

> {

## 4️⃣ BaseController  constructor(private readonly productService: ProductService) {

    super(productService);

### Overview  }

Provides HTTP endpoints with standardized responses, automatic validation, and Swagger documentation. Controllers call services and wrap responses in standardized DTOs.

  /**

### Implementation   * Override create to add custom logic

   * For example: upload product images, send notifications, etc.

**Location**: `src/core/base/base.controller.ts`   */

  @Post()

```typescript  @HttpCode(HttpStatus.CREATED)

import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';  async create(@Body() createProductDto: CreateProductDto) {

import { ParseUUIDPipe } from '@nestjs/common';    // Custom pre-processing

import { BaseEntity } from './base.entity';    const slug = this.generateSlug(createProductDto.name);

import { BaseService } from './base.service';    

import { PaginationDto } from 'src/shared/dtos/pagination.dto';    // Use service method with additional logic

import {    const product = await this.productService.createProduct({

  SuccessResponseDto,      ...createProductDto,

  CreatedResponseDto,      slug,

  UpdatedResponseDto,    });

  DeletedResponseDto,

  PaginatedResponseDto,    // Custom post-processing

} from 'src/shared/dtos/response.dto';    await this.notifyNewProduct(product);



@Controller()    return product;

export abstract class BaseController<  }

  T extends BaseEntity,

  CreateDto,  /**

  UpdateDto,   * Override update to add validation

> {   */

  constructor(protected readonly service: BaseService<T>) {}  @Patch(':id')

  @HttpCode(HttpStatus.OK)

  // ==================== PUBLIC ROUTES ====================  async update(

    @Param('id', ParseUUIDPipe) id: string,

  @Post()    @Body() updateProductDto: UpdateProductDto,

  async create(@Body() createDto: CreateDto): Promise<CreatedResponseDto<T>> {  ) {

    const entity = await this.service.create(createDto as any);    // Custom validation

    return {    if (updateProductDto.price && updateProductDto.price < 0) {

      success: true,      throw new BadRequestException('Price cannot be negative');

      statusCode: 201,    }

      message: 'Created successfully',

      data: entity,    return this.productService.updateProduct(id, updateProductDto);

    };  }

  }

  private generateSlug(name: string): string {

  @Get()    return name.toLowerCase().replace(/\s+/g, '-');

  async findAll(  }

    @Query() paginationDto: PaginationDto

  ): Promise<PaginatedResponseDto<T>> {  private async notifyNewProduct(product: Product): Promise<void> {

    const { page = 1, limit = 10, sortBy, sortOrder } = paginationDto;    // Send notification logic

    const skip = (page - 1) * limit;  }

}

    const [data, total] = await Promise.all([```

      this.service.findAll({

        skip,### 4. Controller with All Protected Methods Enabled

        take: limit,

        order: sortBy ? { [sortBy]: sortOrder || 'ASC' } : undefined,```typescript

      }),import {

      this.service.repository.count(),  Controller,

    ]);  Get,

  Post,

    return {  Delete,

      success: true,  Patch,

      statusCode: 200,  Body,

      message: 'Retrieved successfully',  Param,

      data,  Query,

      pagination: {  HttpCode,

        page,  HttpStatus,

        limit,  ParseUUIDPipe,

        total,} from '@nestjs/common';

        totalPages: Math.ceil(total / limit),import { BaseController } from 'src/core/base';

      },import { Roles } from 'src/core/decorators';

    };import { Product } from './product.entity';

  }import { ProductService } from './product.service';

import { CreateProductDto, UpdateProductDto } from './dtos';

  @Get(':id')

  async findOne(@Controller('products')

    @Param('id', ParseUUIDPipe) id: stringexport class ProductController extends BaseController<

  ): Promise<SuccessResponseDto<T>> {  Product,

    const entity = await this.service.findByIdOrFail(id);  CreateProductDto,

    return {  UpdateProductDto

      success: true,> {

      statusCode: 200,  constructor(private readonly productService: ProductService) {

      message: 'Retrieved successfully',    super(productService);

      data: entity,  }

    };

  }  // ============== Public Protected Methods ==============



  @Patch(':id')  /**

  async update(   * Count total products

    @Param('id', ParseUUIDPipe) id: string,   * GET /products/count

    @Body() updateDto: UpdateDto   */

  ): Promise<UpdatedResponseDto<T>> {  @Get('count')

    const entity = await this.service.update(id, updateDto as any);  @HttpCode(HttpStatus.OK)

    return {  async count() {

      success: true,    return super.count();

      statusCode: 200,  }

      message: 'Updated successfully',

      data: entity,  /**

    };   * Search products

  }   * GET /products/search?q=laptop

   */

  @Delete(':id')  @Get('search')

  async remove(  @HttpCode(HttpStatus.OK)

    @Param('id', ParseUUIDPipe) id: string  async search(@Query('q') searchTerm: string) {

  ): Promise<DeletedResponseDto> {    return super.search(searchTerm);

    await this.service.remove(id);  }

    return {

      success: true,  /**

      statusCode: 200,   * Export products

      message: 'Deleted successfully',   * GET /products/export?format=json

      id,   */

    };  @Get('export')

  }  @HttpCode(HttpStatus.OK)

  async export(@Query('format') format: 'csv' | 'json' = 'json') {

  // ==================== PROTECTED METHODS (OPT-IN) ====================    return super.export(format);

  }

  protected async count(): Promise<{ count: number }> {

    const count = await this.service.repository.count();  /**

    return { count };   * Bulk create products

  }   * POST /products/bulk

   */

  protected async restore(id: string): Promise<{ message: string; id: string }> {  @Post('bulk')

    // Restore logic (requires TypeORM restore method)  @HttpCode(HttpStatus.CREATED)

    return {  @Roles('admin')

      message: 'Restored successfully',  async bulkCreate(@Body() createDtos: CreateProductDto[]) {

      id,    return super.bulkCreate(createDtos);

    };  }

  }

  /**

  protected async permanentDelete(id: string): Promise<{ message: string; id: string }> {   * Restore soft-deleted product

    await this.service.delete(id);   * PATCH /products/:id/restore

    return {   */

      message: 'Permanently deleted',  @Patch(':id/restore')

      id,  @HttpCode(HttpStatus.OK)

    };  @Roles('admin')

  }  async restore(@Param('id', ParseUUIDPipe) id: string) {

    return super.restore(id);

  protected async bulkCreate(createDtos: CreateDto[]): Promise<T[]> {  }

    return Promise.all(

      createDtos.map(dto => this.service.create(dto as any))  /**

    );   * Bulk delete products

  }   * DELETE /products/bulk

   */

  protected async bulkDelete(ids: string[]): Promise<{ message: string; count: number }> {  @Delete('bulk')

    await Promise.all(ids.map(id => this.service.remove(id)));  @HttpCode(HttpStatus.OK)

    return {  @Roles('admin')

      message: `Deleted ${ids.length} items`,  async bulkDelete(@Body() ids: string[]) {

      count: ids.length,    return super.bulkDelete(ids);

    };  }

  }

  /**

  protected async search(searchTerm: string): Promise<T[]> {   * Permanently delete product

    // Override in child class for custom search logic   * DELETE /products/:id/permanent

    return this.service.findAll();   */

  }  @Delete(':id/permanent')

  @HttpCode(HttpStatus.OK)

  protected async export(format: string): Promise<any> {  @Roles('admin')

    // Override in child class for custom export logic  async permanentDelete(@Param('id', ParseUUIDPipe) id: string) {

    const data = await this.service.findAll();    return super.permanentDelete(id);

    return { format, data };  }

  }}

}```

```

### 5. Controller with Pagination Implementation

### Features

- ✅ **5 Public Routes** - Standard CRUD operations```typescript

- ✅ **7 Protected Methods** - Opt-in advanced featuresimport { Controller, Get, Query, HttpCode, HttpStatus } from '@nestjs/common';

- ✅ **Standardized Responses** - Automatic DTO wrappingimport { BaseController } from 'src/core/base';

- ✅ **UUID Validation** - Automatic via ParseUUIDPipeimport { PaginationDto } from 'src/shared/dto';

- ✅ **Swagger Docs** - Auto-generated via @ApiSwaggerimport { IPaginatedResponse } from 'src/shared/interfaces';

- ✅ **Pagination** - Built into findAllimport { Product } from './product.entity';

- ✅ **Type Safety** - Full generic supportimport { ProductService } from './product.service';

import { CreateProductDto, UpdateProductDto } from './dtos';

### Response DTOs

@Controller('products')

All responses are automatically wrapped:export class ProductController extends BaseController<

  Product,

| Route | HTTP Code | Response DTO | Structure |  CreateProductDto,

|-------|-----------|--------------|-----------|  UpdateProductDto

| `create()` | 201 | CreatedResponseDto | `{ success: true, statusCode: 201, message, data: T }` |> {

| `findAll()` | 200 | PaginatedResponseDto | `{ success: true, statusCode: 200, message, data: T[], pagination: {...} }` |  constructor(private readonly productService: ProductService) {

| `findOne()` | 200 | SuccessResponseDto | `{ success: true, statusCode: 200, message, data: T }` |    super(productService);

| `update()` | 200 | UpdatedResponseDto | `{ success: true, statusCode: 200, message, data: T }` |  }

| `remove()` | 200 | DeletedResponseDto | `{ success: true, statusCode: 200, message, id }` |

  /**

### Usage Examples   * Override findAll with proper pagination

   * GET /products?page=1&limit=10&sortBy=price&sortOrder=ASC

#### 1. Simple Controller (All Defaults)   */

  @Get()

```typescript  @HttpCode(HttpStatus.OK)

import { Controller } from '@nestjs/common';  async findAll(

import { ApiTags } from '@nestjs/swagger';    @Query() paginationDto: PaginationDto,

import { BaseController } from 'src/core/base/base.controller';  ): Promise<IPaginatedResponse<Product>> {

import { Product } from './entities/product.entity';    const page = paginationDto.page || 1;

import { CreateProductDto } from './dto/create-product.dto';    const limit = paginationDto.limit || 10;

import { UpdateProductDto } from './dto/update-product.dto';    const sortBy = paginationDto.sortBy || 'createdAt';

import { ProductService } from './product.service';    const sortOrder = paginationDto.sortOrder || 'DESC';



@ApiTags('Products')    // Call service method that handles actual DB pagination

@Controller('products')    return this.productService.findAllPaginated({

export class ProductController extends BaseController<      page,

  Product,      limit,

  CreateProductDto,      sortBy,

  UpdateProductDto      sortOrder,

> {    });

  constructor(private readonly productService: ProductService) {  }

    super(productService);}

  }```

  

  // That's it! You get all 5 CRUD routes automatically:## 🎨 Advanced Patterns

  // POST   /products

  // GET    /products### Pattern 1: With Guards and Decorators

  // GET    /products/:id

  // PATCH  /products/:id```typescript

  // DELETE /products/:idimport { Controller, UseGuards } from '@nestjs/common';

}import { BaseController } from 'src/core/base';

```import { JwtAuthGuard } from 'src/core/guards';

import { Roles, Public } from 'src/core/decorators';

**Generated Routes:**import { Product } from './product.entity';

import { ProductService } from './product.service';

```bash

# Create product@Controller('products')

POST /products@UseGuards(JwtAuthGuard) // Protect all routes

Body: { "name": "Product 1", "price": 99.99 }export class ProductController extends BaseController<Product> {

Response: { "success": true, "statusCode": 201, "message": "Created successfully", "data": {...} }  constructor(private readonly productService: ProductService) {

    super(productService);

# Get all products (paginated)  }

GET /products?page=1&limit=10&sortBy=createdAt&sortOrder=DESC

Response: { "success": true, "statusCode": 200, "data": [...], "pagination": {...} }  // This route is public (overrides controller-level guard)

  @Public()

# Get one product  @Get()

GET /products/abc-123-uuid  async findAll() {

Response: { "success": true, "statusCode": 200, "data": {...} }    return super.findAll();

  }

# Update product

PATCH /products/abc-123-uuid  // This route requires admin role

Body: { "price": 89.99 }  @Roles('admin')

Response: { "success": true, "statusCode": 200, "message": "Updated successfully", "data": {...} }  @Post()

  async create(@Body() dto: CreateProductDto) {

# Soft delete product    return super.create(dto);

DELETE /products/abc-123-uuid  }

Response: { "success": true, "statusCode": 200, "message": "Deleted successfully", "id": "abc-123-uuid" }}

``````



#### 2. Controller with Custom Methods### Pattern 2: With Response Interceptors



```typescript```typescript

@ApiTags('Products')import { Controller, UseInterceptors } from '@nestjs/common';

@Controller('products')import { BaseController } from 'src/core/base';

export class ProductController extends BaseController<import { TransformInterceptor } from 'src/core/interceptors';

  Product,

  CreateProductDto,@Controller('products')

  UpdateProductDto@UseInterceptors(TransformInterceptor) // Format all responses

> {export class ProductController extends BaseController<Product> {

  constructor(private readonly productService: ProductService) {  // All responses will be formatted as:

    super(productService);  // {

  }  //   statusCode: 200,

  //   message: "Success",

  // Add custom endpoint  //   data: {...},

  @Get('featured')  //   timestamp: "2025-10-28T..."

  @ApiSwagger({  // }

    operation: 'Get Featured Products',}

    summary: 'Get all featured products',```

    ok: { type: Product, isArray: true },

  })### Pattern 3: Mixing Base and Custom Routes

  async getFeatured(): Promise<SuccessResponseDto<Product[]>> {

    const products = await this.productService.getFeaturedProducts();```typescript

    return {@Controller('products')

      success: true,export class ProductController extends BaseController<Product> {

      statusCode: 200,  constructor(private readonly productService: ProductService) {

      message: 'Featured products retrieved successfully',    super(productService);

      data: products,  }

    };

  }  // Custom routes (define FIRST to avoid conflicts)

  @Get('featured') async getFeatured() { }

  // Add search endpoint  @Get('on-sale') async getOnSale() { }

  @Get('search')  @Get('categories/:category') async getByCategory() { }

  @ApiSwagger({  

    operation: 'Search Products',  // Base routes work automatically

    summary: 'Search products by name',  // GET /products

    ok: { type: Product, isArray: true },  // GET /products/:id

  })  // POST /products

  async search(  // PATCH /products/:id

    @Query('q') query: string,  // DELETE /products/:id

  ): Promise<SuccessResponseDto<Product[]>> {}

    const products = await this.productService.searchByName(query);```

    return {

      success: true,## ⚠️ Important Notes

      statusCode: 200,

      message: `Found ${products.length} products`,### Route Order Matters!

      data: products,Define custom routes **BEFORE** they conflict with inherited routes:

    };

  }```typescript

}// ✅ CORRECT

```@Get('count')  // Define first

async count() { }

**⚠️ Important: Route Order**

@Get(':id')   // Inherited, matches last

Place specific routes **BEFORE** the `:id` route to avoid conflicts:// Automatically inherited from BaseController



```typescript// ❌ WRONG - count will never be reached!

@Get('featured')      // ✅ Good - specific route first// GET /products/:id comes first and matches /products/count

async getFeatured() {}```



@Get('search')        // ✅ Good - specific route first### Type Safety

async search() {}Always specify types for better IDE support:



@Get(':id')          // ✅ Good - parameterized route last```typescript

async findOne() {}   // (inherited from BaseController)// ✅ GOOD

```export class ProductController extends BaseController<

  Product,

#### 3. Controller with Overridden Methods  CreateProductDto,

  UpdateProductDto

```typescript> { }

@ApiTags('Products')

@Controller('products')// ⚠️ OK but less type safety

export class ProductController extends BaseController<export class ProductController extends BaseController<Product> { }

  Product,```

  CreateProductDto,

  UpdateProductDto### Override vs Extend

> {- **Override** when you need different behavior

  constructor(- **Extend** (super) when you want to add to base behavior

    private readonly productService: ProductService,

    private readonly i18nHelper: I18nHelper,```typescript

  ) {// Override (replace completely)

    super(productService);@Post()

  }async create(@Body() dto: CreateDto) {

  return this.service.customCreate(dto);

  // Override create to add custom logic}

  @Post()

  @ApiSwagger({// Extend (add to base)

    operation: 'Create Product',@Post()

    summary: 'Create a new product',async create(@Body() dto: CreateDto) {

    created: { type: Product },  const result = await super.create(dto);

  })  await this.doSomethingExtra(result);

  async create(  return result;

    @Body() createDto: CreateProductDto,}

  ): Promise<CreatedResponseDto<Product>> {```

    // Custom validation

    if (createDto.price < 0) {## 📊 Summary

      throw new BadRequestException(

        this.i18nHelper.t('product.invalidPrice')| Method | Route | Default Status | Can Override | Protected |

      );|--------|-------|----------------|--------------|-----------|

    }| create | POST / | 201 | ✅ | ❌ |

| findAll | GET / | 200 | ✅ | ❌ |

    // Call service| findOne | GET /:id | 200 | ✅ | ❌ |

    const product = await this.productService.create(createDto);| update | PATCH /:id | 200 | ✅ | ❌ |

| remove | DELETE /:id | 200 | ✅ | ❌ |

    // Return standardized response| count | GET /count | 200 | ✅ | ✅ |

    return {| restore | PATCH /:id/restore | 200 | ✅ | ✅ |

      success: true,| permanentDelete | DELETE /:id/permanent | 200 | ✅ | ✅ |

      statusCode: 201,| bulkCreate | POST /bulk | 201 | ✅ | ✅ |

      message: this.i18nHelper.t('product.created'),| bulkDelete | DELETE /bulk | 200 | ✅ | ✅ |

      data: product,| search | GET /search | 200 | ✅ | ✅ |

    };| export | GET /export | 200 | ✅ | ✅ |

  }

## 🎯 Best Practices

  // Override findAll with custom filters

  @Get()1. ✅ Extend BaseController for standard CRUD resources

  @ApiSwagger({2. ✅ Override methods when you need custom behavior

    operation: 'Get All Products',3. ✅ Define custom routes before inherited ones

    summary: 'Get all products with filters',4. ✅ Use protected methods selectively (expose only what you need)

    ok: { type: Product, isArray: true },5. ✅ Always specify generic types for type safety

  })6. ✅ Use decorators (@Roles, @Public) for access control

  async findAll(7. ✅ Keep controllers thin - business logic in services

    @Query() paginationDto: PaginationDto,8. ❌ Don't create custom controllers if base functionality is enough

    @Query('category') category?: string,9. ❌ Don't expose all protected methods unless needed

    @Query('minPrice') minPrice?: number,10. ❌ Don't forget to add proper guards and validation

  ): Promise<PaginatedResponseDto<Product>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const options = {
      skip,
      take: limit,
      where: {
        ...(category && { category }),
        ...(minPrice && { price: MoreThanOrEqual(minPrice) }),
      },
    };

    const [data, total] = await Promise.all([
      this.productService.findAll(options),
      this.productService.repository.count(options),
    ]);

    return {
      success: true,
      statusCode: 200,
      message: this.i18nHelper.t('product.list'),
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
```

#### 4. Controller with Protected Methods Enabled

```typescript
@ApiTags('Products')
@Controller('products')
export class ProductController extends BaseController<
  Product,
  CreateProductDto,
  UpdateProductDto
> {
  constructor(private readonly productService: ProductService) {
    super(productService);
  }

  // Enable count endpoint
  @Get('count')
  @ApiSwagger({
    operation: 'Count Products',
    summary: 'Get total product count',
    ok: { type: Number },
  })
  async countProducts(): Promise<{ count: number }> {
    return super.count();
  }

  // Enable restore endpoint
  @Patch(':id/restore')
  @ApiSwagger({
    operation: 'Restore Product',
    summary: 'Restore soft-deleted product',
    ok: { description: 'Product restored' },
  })
  async restoreProduct(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ message: string; id: string }> {
    return super.restore(id);
  }

  // Enable permanent delete endpoint
  @Delete(':id/permanent')
  @Roles(String(RolesEnum.ADMIN))
  @ApiSwagger({
    operation: 'Permanent Delete',
    summary: 'Permanently delete product',
    ok: { description: 'Product permanently deleted' },
  })
  async permanentDeleteProduct(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ message: string; id: string }> {
    return super.permanentDelete(id);
  }

  // Enable bulk create
  @Post('bulk')
  @Roles(String(RolesEnum.ADMIN))
  @ApiSwagger({
    operation: 'Bulk Create Products',
    summary: 'Create multiple products at once',
    created: { type: Product, isArray: true },
  })
  async bulkCreateProducts(
    @Body() createDtos: CreateProductDto[],
  ): Promise<Product[]> {
    return super.bulkCreate(createDtos);
  }

  // Enable search
  @Get('search')
  @ApiSwagger({
    operation: 'Search Products',
    summary: 'Search products by query',
    ok: { type: Product, isArray: true },
  })
  async searchProducts(
    @Query('q') query: string,
  ): Promise<Product[]> {
    return super.search(query);
  }
}
```

#### 5. Controller with Authentication & Authorization

```typescript
@ApiTags('Products')
@Controller('products')
export class ProductController extends BaseController<
  Product,
  CreateProductDto,
  UpdateProductDto
> {
  constructor(private readonly productService: ProductService) {
    super(productService);
  }

  // Public route - anyone can view products
  @Get()
  @Public()
  @ApiSwagger({
    operation: 'Get All Products',
    summary: 'Get all products (public)',
    ok: { type: Product, isArray: true },
  })
  async findAll(
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<Product>> {
    return super.findAll(paginationDto);
  }

  @Get(':id')
  @Public()
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return super.findOne(id);
  }

  // Admin-only routes
  @Post()
  @Roles(String(RolesEnum.ADMIN))
  @ApiSwagger({
    operation: 'Create Product',
    summary: 'Create product (admin only)',
    created: { type: Product },
  })
  async create(
    @Body() createDto: CreateProductDto,
    @CurrentUser() user: User,
  ): Promise<CreatedResponseDto<Product>> {
    const product = await this.productService.create({
      ...createDto,
      createdBy: user.id,
    });

    return {
      success: true,
      statusCode: 201,
      message: 'Product created successfully',
      data: product,
    };
  }

  @Patch(':id')
  @Roles(String(RolesEnum.ADMIN))
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateProductDto,
  ) {
    return super.update(id, updateDto);
  }

  @Delete(':id')
  @Roles(String(RolesEnum.ADMIN))
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return super.remove(id);
  }
}
```

### Method Reference

| Method | HTTP | Route | Access | Description | Response |
|--------|------|-------|--------|-------------|----------|
| `create()` | POST | `/` | Public* | Create new entity | CreatedResponseDto<T> |
| `findAll()` | GET | `/` | Public* | Get all (paginated) | PaginatedResponseDto<T> |
| `findOne()` | GET | `/:id` | Public* | Get by ID | SuccessResponseDto<T> |
| `update()` | PATCH | `/:id` | Public* | Update entity | UpdatedResponseDto<T> |
| `remove()` | DELETE | `/:id` | Public* | Soft delete | DeletedResponseDto |
| `count()` | GET | `/count` | Protected | Count entities | `{ count: number }` |
| `restore()` | PATCH | `/:id/restore` | Protected | Restore soft-deleted | `{ message, id }` |
| `permanentDelete()` | DELETE | `/:id/permanent` | Protected | Hard delete | `{ message, id }` |
| `bulkCreate()` | POST | `/bulk` | Protected | Create multiple | `T[]` |
| `bulkDelete()` | DELETE | `/bulk` | Protected | Delete multiple | `{ message, count }` |
| `search()` | GET | `/search?q=` | Protected | Search entities | `T[]` |
| `export()` | GET | `/export?format=` | Protected | Export data | `any` |

*Public by default but respects global JWT guard. Use `@Public()` to bypass authentication.

---

## 🎯 Complete Real-World Example: Features Module

See the **Features** module in `src/modules/features/` for a comprehensive demonstration of all patterns:

- **Entity** (`feature.entity.ts`): 12+ fields demonstrating various TypeORM column types
- **Repository** (`feature.repository.ts`): 7 custom query methods
- **Service** (`feature.service.ts`): Business logic with i18n support
- **Controller** (`feature.controller.ts`): Overridden routes + 6 custom endpoints

**Key Highlights:**
- ✅ BaseController inheritance with proper generics
- ✅ Public routes with `@Public()` decorator
- ✅ Admin routes with `@Roles(RolesEnum.ADMIN)`
- ✅ Custom endpoints (featured, search, top-rated, by-category)
- ✅ Interceptor usage (`LoggingInterceptor`)
- ✅ Repository injection alongside service
- ✅ i18n integration in service layer
- ✅ Complete CRUD + advanced features

---

## 🎓 Use Cases & Best Practices

### Use Case 1: Simple CRUD Resource

**Scenario**: Basic product catalog with no special requirements

```typescript
@ApiTags('Products')
@Controller('products')
export class ProductController extends BaseController<
  Product,
  CreateProductDto,
  UpdateProductDto
> {
  constructor(private readonly productService: ProductService) {
    super(productService);
  }
  // Done! All CRUD routes work automatically
}
```

**Result**: 5 routes (POST, GET, GET/:id, PATCH/:id, DELETE/:id) with full Swagger docs

---

### Use Case 2: Public Read, Admin Write

**Scenario**: Blog posts - anyone can read, only admins can manage

```typescript
@ApiTags('Posts')
@Controller('posts')
export class PostController extends BaseController<
  Post,
  CreatePostDto,
  UpdatePostDto
> {
  constructor(private readonly postService: PostService) {
    super(postService);
  }

  @Get()
  @Public()
  async findAll(@Query() paginationDto: PaginationDto) {
    return super.findAll(paginationDto);
  }

  @Get(':id')
  @Public()
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return super.findOne(id);
  }

  @Post()
  @Roles(String(RolesEnum.ADMIN))
  async create(@Body() createDto: CreatePostDto) {
    return super.create(createDto);
  }

  @Patch(':id')
  @Roles(String(RolesEnum.ADMIN))
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdatePostDto,
  ) {
    return super.update(id, updateDto);
  }

  @Delete(':id')
  @Roles(String(RolesEnum.ADMIN))
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return super.remove(id);
  }
}
```

---

### Use Case 3: User-Owned Resources

**Scenario**: Users can only manage their own items

```typescript
@ApiTags('Orders')
@Controller('orders')
export class OrderController extends BaseController<
  Order,
  CreateOrderDto,
  UpdateOrderDto
> {
  constructor(
    private readonly orderService: OrderService,
    private readonly orderRepository: OrderRepository,
  ) {
    super(orderService);
  }

  @Post()
  async create(
    @Body() createDto: CreateOrderDto,
    @CurrentUser() user: User,
  ): Promise<CreatedResponseDto<Order>> {
    const order = await this.orderService.create({
      ...createDto,
      userId: user.id,
    });

    return {
      success: true,
      statusCode: 201,
      message: 'Order created successfully',
      data: order,
    };
  }

  @Get()
  async findAll(
    @Query() paginationDto: PaginationDto,
    @CurrentUser() user: User,
  ): Promise<PaginatedResponseDto<Order>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.orderRepository.findAll({
        where: { userId: user.id },
        skip,
        take: limit,
      }),
      this.orderRepository.count({ where: { userId: user.id } }),
    ]);

    return {
      success: true,
      statusCode: 200,
      message: 'Orders retrieved successfully',
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
```

---

### Use Case 4: Background Jobs (Service Only)

**Scenario**: Scheduled tasks that don't need HTTP endpoints

```typescript
@Injectable()
export class ReportService extends BaseService<Report> {
  constructor(
    private readonly reportRepository: ReportRepository,
    private readonly i18nHelper: I18nHelper,
  ) {
    super(reportRepository, 'Report');
  }

  async generateDailyReport(): Promise<Report> {
    const data = await this.calculateDailyMetrics();

    return this.create({
      type: 'daily',
      date: new Date(),
      data: JSON.stringify(data),
    });
  }

  private async calculateDailyMetrics(): Promise<any> {
    // Complex calculation logic
    return {};
  }
}

// Use in scheduled task
@Injectable()
export class TasksService {
  constructor(private readonly reportService: ReportService) {}

  @Cron('0 0 * * *')  // Daily at midnight
  async handleDailyReport() {
    await this.reportService.generateDailyReport();
  }
}
```

---

### Use Case 5: Complex Queries (Custom Repository)

**Scenario**: Advanced filtering and search

```typescript
@Injectable()
export class ProductRepository extends BaseRepository<Product> {
  constructor(
    @InjectRepository(Product)
    repository: Repository<Product>,
  ) {
    super(repository);
  }

  async findWithFilters(filters: ProductFilters): Promise<Product[]> {
    const query = this.repository
      .createQueryBuilder('product')
      .where('product.isActive = :isActive', { isActive: true });

    if (filters.category) {
      query.andWhere('product.category = :category', {
        category: filters.category,
      });
    }

    if (filters.minPrice) {
      query.andWhere('product.price >= :minPrice', {
        minPrice: filters.minPrice,
      });
    }

    if (filters.maxPrice) {
      query.andWhere('product.price <= :maxPrice', {
        maxPrice: filters.maxPrice,
      });
    }

    if (filters.tags && filters.tags.length > 0) {
      filters.tags.forEach((tag, index) => {
        query.andWhere(`product.tags LIKE :tag${index}`, {
          [`tag${index}`]: `%${tag}%`,
        });
      });
    }

    if (filters.search) {
      query.andWhere(
        '(product.name LIKE :search OR product.description LIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    query.orderBy(
      `product.${filters.sortBy || 'createdAt'}`,
      filters.sortOrder || 'DESC'
    );

    if (filters.limit) {
      query.take(filters.limit);
    }

    return query.getMany();
  }
}
```

---

## ⚠️ Important Notes

### 1. Route Order Matters

```typescript
// ❌ WRONG - specific routes after :id
@Get(':id')
async findOne() {}

@Get('featured')  // Will never be reached!
async getFeatured() {}

// ✅ CORRECT - specific routes before :id
@Get('featured')
async getFeatured() {}

@Get('search')
async search() {}

@Get(':id')
async findOne() {}
```

### 2. Return Type Consistency

Always return the entity type (T), not response DTOs:

```typescript
// ❌ WRONG
async create(@Body() dto: CreateDto): Promise<CreatedResponseDto<T>> {
  return { success: true, statusCode: 201, message: '...', data: entity };
}

// ✅ CORRECT - Let BaseController handle response wrapping
async create(@Body() dto: CreateDto): Promise<CreatedResponseDto<T>> {
  return super.create(dto);
}

// ✅ ALSO CORRECT - For custom logic
async create(@Body() dto: CreateDto): Promise<CreatedResponseDto<T>> {
  const entity = await this.service.create(dto);
  return {
    success: true,
    statusCode: 201,
    message: this.i18nHelper.t('product.created'),
    data: entity,  // Return entity, not DTO
  };
}
```

### 3. Generic Types

Always provide all three generic types:

```typescript
// ✅ CORRECT
export class ProductController extends BaseController<
  Product,              // Entity type
  CreateProductDto,     // Create DTO type
  UpdateProductDto      // Update DTO type
> {}

// ❌ WRONG - missing generics
export class ProductController extends BaseController {}
```

### 4. Soft Delete vs Hard Delete

```typescript
// Soft delete (default) - Sets deletedAt timestamp
await this.service.remove(id);

// Hard delete (permanent) - Removes from database
await this.service.delete(id);

// Restore soft-deleted entity
await this.service.restore(id);
```

### 5. Pagination

```typescript
// Automatic pagination in findAll
@Get()
async findAll(@Query() paginationDto: PaginationDto) {
  return super.findAll(paginationDto);
}

// Query params
GET /products?page=1&limit=10&sortBy=createdAt&sortOrder=DESC

// Response includes pagination
{
  "success": true,
  "statusCode": 200,
  "message": "Retrieved successfully",
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

---

## 🔗 Related Documentation

- [Response System Guide](./RESPONSE-SYSTEM-SUMMARY.md)
- [Error Handling Guide](./ERROR-HANDLING-GUIDE.md)
- [Authentication Guide](./AUTHENTICATION-GUIDE.md)
- [i18n Migration Guide](./I18N-MIGRATION-GUIDE.md)
- [API Swagger Decorator Guide](./ONE-DECORATOR-GUIDE.md)
- [Features Demo Guide](./FEATURES-DEMO-GUIDE.md)

---

## 📝 Summary

### When to extend which base class:

| Need | Extend | Purpose |
|------|--------|---------|
| Database table | BaseEntity | Common fields (id, timestamps, soft delete) |
| Database access | BaseRepository | CRUD operations, custom queries |
| Business logic | BaseService | Validation, error handling, workflows |
| HTTP endpoints | BaseController | REST API, authentication, responses |

### Benefits:
- ✅ **80% less boilerplate** - Inherit common functionality
- ✅ **Consistent patterns** - Same structure across all modules
- ✅ **Type safety** - Full TypeScript support with generics
- ✅ **Standardized responses** - Automatic DTO wrapping
- ✅ **Built-in features** - Pagination, soft delete, UUID validation
- ✅ **Easy customization** - Override or extend as needed
- ✅ **Swagger docs** - Auto-generated API documentation

### Quick Start Checklist:
1. ✅ Create entity extending BaseEntity
2. ✅ Create repository extending BaseRepository
3. ✅ Create service extending BaseService  
4. ✅ Create controller extending BaseController
5. ✅ Register in module
6. ✅ Customize as needed!

---

*Last updated: January 2025*
*Project: NestJS Starter Kit*
