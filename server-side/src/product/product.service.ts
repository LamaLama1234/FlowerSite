import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { EnumOrderStatus, Prisma } from '@prisma/client'
import { PrismaService } from 'src/prisma.service'
import { ProductDto } from './dto/product.dto'
import { parsePagination } from 'src/common/pagination'

@Injectable()
export class ProductService {

    constructor(private prisma: PrismaService) {}

    async getAll(
        searchTerm?: string,
        userRole?: string,
        page?: string,
        limit?: string,
        categoryId?: string,
        minPrice?: string,
        maxPrice?: string,
        sortBy?: string
    ) {
        const whereClause: any = searchTerm ? {
            OR: [
                { title: { contains: searchTerm, mode: 'insensitive' } },
                { description: { contains: searchTerm, mode: 'insensitive' } }
            ]
        } : {};

        // Если это не админ, можно добавить логику: например, не показывать товары с price: 0 (черновики)
        const priceFilter: { gt?: number; gte?: number; lte?: number } = {}
        if (userRole !== 'ADMIN') {
            priceFilter.gt = 0
        }
        const parsedMinPrice = Number(minPrice)
        if (minPrice && Number.isFinite(parsedMinPrice)) {
            priceFilter.gte = parsedMinPrice
        }
        const parsedMaxPrice = Number(maxPrice)
        if (maxPrice && Number.isFinite(parsedMaxPrice)) {
            priceFilter.lte = parsedMaxPrice
        }
        if (Object.keys(priceFilter).length > 0) {
            whereClause.price = priceFilter
        }

        if (categoryId) {
            whereClause.categoryId = categoryId;
        }

        const orderBy =
            sortBy === 'price_asc' ? { price: 'asc' as const } :
            sortBy === 'price_desc' ? { price: 'desc' as const } :
            { createdAt: 'desc' as const }

        const pagination = parsePagination(page, limit);

        const [items, total] = await Promise.all([
            this.prisma.product.findMany({
                where: whereClause,
                include: { category: true },
                orderBy,
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

    async getDiscounted(limit = 12) {
        const products = await this.prisma.product.findMany({
            where: {
                price: { gt: 0 },
                oldPrice: { not: null }
            },
            include: { category: true },
            orderBy: { updatedAt: 'desc' }
        });

        return products
            .filter(product => (product.oldPrice ?? 0) > product.price)
            .sort((a, b) => {
                const discountA = 1 - a.price / (a.oldPrice as number);
                const discountB = 1 - b.price / (b.oldPrice as number);
                return discountB - discountA;
            })
            .slice(0, limit);
    }

    /**
     * Похожие товары: сначала по совпадению категории и тегов (чем больше
     * общих тегов — тем выше), категория даёт больше веса, чем один тег.
     * При отсутствии и категории, и тегов сравнивать не с чем — пустой список.
     */
    async getRelated(id: string, limit = 8) {
        const product = await this.prisma.product.findUnique({ where: { id } });
        if (!product) throw new NotFoundException('Товар не найден');

        const orConditions: Prisma.ProductWhereInput[] = [];
        if (product.categoryId) orConditions.push({ categoryId: product.categoryId });
        if (product.tags.length > 0) orConditions.push({ tags: { hasSome: product.tags } });

        if (orConditions.length === 0) return [];

        const candidates = await this.prisma.product.findMany({
            where: {
                id: { not: id },
                price: { gt: 0 },
                OR: orConditions
            },
            include: { category: true },
            take: limit * 3
        });

        return candidates
            .map(candidate => ({
                product: candidate,
                score:
                    (candidate.categoryId && candidate.categoryId === product.categoryId ? 2 : 0) +
                    candidate.tags.filter(tag => product.tags.includes(tag)).length
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .map(entry => entry.product);
    }

    async create( dto: ProductDto, userRole: string) {
        if (userRole !== 'ADMIN') throw new ForbiddenException('Только админ может создавать товары');
	    return this.prisma.product.create({
		    data: {
                title: dto.title,
                description: dto.description,
                price: dto.price,
                oldPrice: dto.oldPrice ?? null,
                images: dto.images,
                tags: dto.tags ?? [],
                categoryId: dto.categoryId
		    }
	    })
	}

	async update(id: string, dto: ProductDto, userRole: string) {
        // Проверяем права на уровне сервиса, если не используем Guards
        if (userRole !== 'ADMIN') throw new ForbiddenException('Только админ может менять товары')

        await this.getById(id);
        return this.prisma.product.update({
            where: { id },
            data: {
                title: dto.title,
                description: dto.description,
                price: dto.price,
                oldPrice: dto.oldPrice ?? null,
                images: dto.images,
                tags: dto.tags ?? [],
                categoryId: dto.categoryId
            }
        });
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
