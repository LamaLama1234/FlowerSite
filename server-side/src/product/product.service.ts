import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { EnumOrderStatus } from '@prisma/client'
import { PrismaService } from 'src/prisma.service'
import { ProductDto } from './dto/product.dto'
import { parsePagination } from 'src/common/pagination'

@Injectable()
export class ProductService {

    constructor(private prisma: PrismaService) {}

    async getAll(searchTerm?: string, userRole?: string, page?: string, limit?: string, categoryId?: string) {
        const whereClause: any = searchTerm ? {
            OR: [
                { title: { contains: searchTerm, mode: 'insensitive' } },
                { description: { contains: searchTerm, mode: 'insensitive' } }
            ]
        } : {};

        // Если это не админ, можно добавить логику: например, не показывать товары с price: 0 (черновики)
        if (userRole !== 'ADMIN') {
            whereClause.price = { gt: 0 };
        }

        if (categoryId) {
            whereClause.categoryId = categoryId;
        }

        const pagination = parsePagination(page, limit);

        const [items, total] = await Promise.all([
            this.prisma.product.findMany({
                where: whereClause,
                include: { category: true },
                orderBy: { createdAt: 'desc' },
                skip: pagination.skip,
                take: pagination.limit
            }),
            this.prisma.product.count({ where: whereClause })
        ]);

        return { items, total, page: pagination.page, limit: pagination.limit };
    }

	async getById(id: string) {
        const product = await this.prisma.product.findUnique({
            where: { id },
            include: { category: true }
        });
        if (!product) throw new NotFoundException('Товар не найден');
        return product;
        }
    

    async getByCategory(categoryId: string) {
		const products = await this.prisma.product.findMany({
			where: {
				category: {
                    id: categoryId
                }
			},
            include: {
                category: true
            }
		})
    

		if (products.length === 0) {
            throw new NotFoundException('Товары не найдены')
        }

		return products
	}

    async getMostPopular() {
        const mostPopularProducts = await this.prisma.orderItem.groupBy({
            by: ['productId'],
            where: {
                order: {
                    is:{
                        status: EnumOrderStatus.COMPLETED
                    }   
                }
            },

            _sum: {
                quantity: true
            },
            orderBy: {
                _sum: {
                    quantity: 'desc'
                }
            },
        })

        const productIds = mostPopularProducts.map(item => item.productId)

        const products = await this.prisma.product.findMany({
            where: {
                id: {
                    in: productIds
                }
            },
            include: {
                category: true
            }
        })

        return products


    }

    async create( dto: ProductDto, userRole: string) {
        if (userRole !== 'ADMIN') throw new ForbiddenException('Только админ может создавать товары');
	    return this.prisma.product.create({
		    data: {
                title: dto.title,
                description: dto.description,
                price: dto.price,
                images: dto.images,
                categoryId: dto.categoryId
		    }
	    })
	}

	async update(id: string, dto: ProductDto, userRole: string) {
        // Проверяем права на уровне сервиса, если не используем Guards
        if (userRole !== 'ADMIN') throw new ForbiddenException('Только админ может менять товары')
        
        await this.getById(id);
        return this.prisma.product.update({ where: { id }, data: dto });
    }

	async delete(id: string, userRole: string) {
        if (userRole !== 'ADMIN') throw new ForbiddenException('Только админ может удалять товары')
		await this.getById(id)

		return this.prisma.product.delete({
			where: {
				id
			}
		})
	}
}
