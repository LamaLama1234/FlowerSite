import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  UsePipes,
  ValidationPipe,
  UseGuards
} from '@nestjs/common'
import { ProductService } from './product.service'
import { ProductDto } from './dto/product.dto'
import { Roles } from '../auth/decorators/roles.decorator'
import { RolesGuard } from '../auth/guards/roles.guard'
import { AuthGuard } from '@nestjs/passport'
import { CurrentUser } from 'src/user/decorators/user.decorator'

@Controller('products')
export class ProductController {
	constructor(private readonly productService: ProductService) {}

	@Get()
	async getAll(
		@Query('searchTerm') searchTerm?: string,
		@Query('page') page?: string,
		@Query('limit') limit?: string,
		@Query('categoryId') categoryId?: string,
		@Query('minPrice') minPrice?: string,
		@Query('maxPrice') maxPrice?: string,
		@Query('sortBy') sortBy?: string,
		@Query('discounted') discounted?: string
	) {
		return this.productService.getAll(searchTerm, undefined, page, limit, categoryId, minPrice, maxPrice, sortBy, discounted)
	}
	@Get('by-id/:id')
	async getById(@Param('id') id: string) {
		return this.productService.getById(id)
	}
	
	@Get('by-category/:categoryId')
	async getByCategory(@Param('categoryId') categoryId: string) {
		return this.productService.getByCategory(categoryId)
	}

	@Get('most-popular')
	async getMostPopular() {
		return this.productService.getMostPopular()
	}

	@Get('discounted')
	async getDiscounted() {
		return this.productService.getDiscounted()
	}

	@Get('category-champions')
	async getCategoryChampions() {
		return this.productService.getCategoryChampions()
	}

	@Get('related/:id')
	async getRelated(@Param('id') id: string) {
		return this.productService.getRelated(id)
	}

	@UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles('ADMIN')
	@UsePipes(new ValidationPipe())
	@HttpCode(200)
	@Post()
	async create(
        @Body() dto: ProductDto,
        @CurrentUser('role') userRole: string // Извлекаем роль из токена
    ) {
        return this.productService.create(dto, userRole); // Передаем её в сервис
    }

	@UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles('ADMIN')
	@UsePipes(new ValidationPipe())
	@HttpCode(200)
	@Put(':id')
	async update(
        @Param('id') id: string, 
        @Body() dto: ProductDto,
        @CurrentUser('role') userRole: string // Извлекаем роль
    ) {
        return this.productService.update(id, dto, userRole); // Передаем
    }

	// Тег "популярное" пересчитывается автоматически при смене статуса
	// заказа (см. order.service.ts) — этот эндпоинт нужен только чтобы
	// админ мог форсировать пересчёт вручную, не дожидаясь следующего заказа.
	@UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles('ADMIN')
	@HttpCode(200)
	@Post('recalculate-popular')
	async recalculatePopularTags() {
		return this.productService.recalculatePopularTags()
	}

	@UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles('ADMIN')
	@HttpCode(200)
	@Delete(':id')
	async delete(
        @Param('id') id: string,
        @CurrentUser('role') userRole: string // Извлекаем роль
    ) {
        return this.productService.delete(id, userRole); // Передаем
    }
}
