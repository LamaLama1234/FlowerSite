import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { EnumOrderStatus, Prisma } from '@prisma/client'
import { PrismaService } from 'src/prisma.service'
import { ProductDto } from './dto/product.dto'
import { parsePagination } from 'src/common/pagination'

// Тег присваивается автоматически по продажам — не редактируется руками
// в админке (хотя формально ничто не мешает: это просто строка в tags).
export const POPULAR_TAG = 'популярное'
// Топ 20% товаров по суммарному количеству проданных штук (среди тех, у
// кого вообще есть завершённые продажи) считаются "популярными". Доля
// глобальная — по всей выборке товаров и категорий разом, не по категориям.
const POPULAR_TOP_SHARE = 0.2

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
        sortBy?: string,
        discounted?: string
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

        const isDiscountedOnly = discounted === 'true'
        if (isDiscountedOnly) {
            // oldPrice > price — сравнение двух колонок, Prisma такое не
            // умеет в where напрямую, поэтому здесь только необходимое
            // условие (oldPrice задан), а точная проверка — ниже в JS.
            whereClause.oldPrice = { not: null }
        }

        const pagination = parsePagination(page, limit);

        // Популярность — не колонка в БД, а посчитанное количество продаж, и
        // "со скидкой" требует сравнения oldPrice > price построчно — ни то,
        // ни другое Prisma не выразит в orderBy/where напрямую. В обоих
        // случаях тянем подходящую по остальным фильтрам выборку целиком,
        // досортировываем/дофильтровываем и пагинируем в памяти сами. Для
        // масштаба каталога этого проекта — не проблема.
        if (sortBy === 'popularity' || isDiscountedOnly) {
            const [allMatching, quantityByProduct] = await Promise.all([
                this.prisma.product.findMany({ where: whereClause, include: { category: true } }),
                sortBy === 'popularity' ? this.getSoldQuantityByProduct() : Promise.resolve(null)
            ])

            const filtered = isDiscountedOnly
                ? allMatching.filter(product => (product.oldPrice ?? 0) > product.price)
                : allMatching

            let sorted = filtered
            if (quantityByProduct) {
                // Три яруса: сначала товары с тегом "популярное", затем
                // остальные со скидкой, затем все прочие — и только внутри
                // каждого яруса общая градация по продажам.
                const tierOf = (product: (typeof filtered)[number]) => {
                    if (product.tags.includes(POPULAR_TAG)) return 0
                    if ((product.oldPrice ?? 0) > product.price) return 1
                    return 2
                }
                sorted = [...filtered].sort((a, b) => {
                    const tierDiff = tierOf(a) - tierOf(b)
                    if (tierDiff !== 0) return tierDiff
                    const diff = (quantityByProduct.get(b.id) ?? 0) - (quantityByProduct.get(a.id) ?? 0)
                    return diff !== 0 ? diff : b.createdAt.getTime() - a.createdAt.getTime()
                })
            } else if (sortBy === 'price_asc') {
                sorted = [...filtered].sort((a, b) => a.price - b.price)
            } else if (sortBy === 'price_desc') {
                sorted = [...filtered].sort((a, b) => b.price - a.price)
            } else {
                sorted = [...filtered].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            }

            return {
                items: sorted.slice(pagination.skip, pagination.skip + pagination.limit),
                total: sorted.length,
                page: pagination.page,
                limit: pagination.limit
            }
        }

        const orderBy =
            sortBy === 'price_asc' ? { price: 'asc' as const } :
            sortBy === 'price_desc' ? { price: 'desc' as const } :
            { createdAt: 'desc' as const }

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

    /**
     * Раньше отдавал вообще всех, у кого есть хоть одна завершённая продажа
     * — из-за этого в блоке "Популярные товары" мог висеть товар, который
     * уже не входит в топ-20% и лишился тега POPULAR_TAG. Теперь один
     * источник правды с тегом: показываем только реально помеченные товары.
     */
    async getMostPopular() {
        const [products, quantityByProduct] = await Promise.all([
            this.prisma.product.findMany({
                where: { tags: { has: POPULAR_TAG } },
                include: { category: true }
            }),
            this.getSoldQuantityByProduct()
        ])

        return [...products].sort(
            (a, b) => (quantityByProduct.get(b.id) ?? 0) - (quantityByProduct.get(a.id) ?? 0)
        )
    }

    /**
     * Суммарное количество проданных штук на товар — только по завершённым
     * заказам (тот же критерий "популярности", что уже использовался в
     * getMostPopular). Общая точка для recalculatePopularTags и
     * getCategoryChampions, чтобы обе смотрели на одинаковые цифры.
     */
    private async getSoldQuantityByProduct() {
        const sales = await this.prisma.orderItem.groupBy({
            by: ['productId'],
            where: { order: { is: { status: EnumOrderStatus.COMPLETED } } },
            _sum: { quantity: true }
        })

        return new Map(sales.map(sale => [sale.productId, sale._sum.quantity ?? 0]))
    }

    /**
     * Пересчитывает тег "популярное" по всей базе товаров: в топ-20% по
     * продажам среди всех категорий разом — тег добавляется, у остальных
     * (если был) — снимается. Вызывается при смене статуса заказа
     * (order.service.ts), чтобы тег не протухал со временем.
     */
    async recalculatePopularTags() {
        const quantityByProduct = await this.getSoldQuantityByProduct()

        const sold = [...quantityByProduct.entries()]
            .filter(([, quantity]) => quantity > 0)
            .sort((a, b) => b[1] - a[1])

        const popularCount = Math.max(1, Math.ceil(sold.length * POPULAR_TOP_SHARE))
        const popularIds = new Set(sold.slice(0, popularCount).map(([productId]) => productId))

        const allProducts = await this.prisma.product.findMany({
            select: { id: true, tags: true }
        })

        const updates = allProducts.flatMap(product => {
            const shouldBePopular = popularIds.has(product.id)
            const withoutTag = product.tags.filter(tag => tag !== POPULAR_TAG)
            // POPULAR_TAG всегда первым в массиве — не просто "есть/нет", ещё
            // и переупорядочивает товары, у которых тег затесался не с начала
            // (например, попал в конец при более старой версии этой функции).
            const nextTags = shouldBePopular ? [POPULAR_TAG, ...withoutTag] : withoutTag

            const isUnchanged =
                nextTags.length === product.tags.length &&
                nextTags.every((tag, i) => tag === product.tags[i])
            if (isUnchanged) return []

            return [{ id: product.id, tags: nextTags }]
        })

        if (updates.length > 0) {
            await Promise.all(
                updates.map(update =>
                    this.prisma.product.update({ where: { id: update.id }, data: { tags: update.tags } })
                )
            )
        }

        return { popularCount: popularIds.size, updated: updates.length }
    }

    /**
     * "Чемпион" каждой категории — для слайдера на главной. Внутри
     * категории берём самый продаваемый товар среди тех, что уже помечены
     * POPULAR_TAG; если в категории нет ни одного популярного товара,
     * откатываемся на просто самый покупаемый товар этой категории (даже
     * без тега) — так у категории без явных хитов слайдер всё равно
     * получает осмысленную обложку, а не пустое место.
     */
    async getCategoryChampions() {
        const [quantityByProduct, categories] = await Promise.all([
            this.getSoldQuantityByProduct(),
            this.prisma.category.findMany({
                include: {
                    products: {
                        where: { price: { gt: 0 } },
                        include: { category: true }
                    }
                }
            })
        ])

        const byQuantityDesc = (a: { id: string }, b: { id: string }) =>
            (quantityByProduct.get(b.id) ?? 0) - (quantityByProduct.get(a.id) ?? 0)

        return categories.flatMap(category => {
            if (category.products.length === 0) return []

            const popularInCategory = category.products.filter(product => product.tags.includes(POPULAR_TAG))
            const pool = popularInCategory.length > 0 ? popularInCategory : category.products
            const champion = [...pool].sort(byQuantityDesc)[0]

            return [{
                category: { id: category.id, title: category.title },
                product: champion
            }]
        })
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
                    candidate.tags.filter(tag => product.tags.includes(tag)).length +
                    // Небольшой бонус за популярность — не перебивает совпадение по
                    // категории/тегам, но при прочих равных подтягивает хиты выше.
                    (candidate.tags.includes(POPULAR_TAG) ? 1 : 0)
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
