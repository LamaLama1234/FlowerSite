import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common'; // Импортировали NotFoundException
import { PrismaService } from 'src/prisma.service';
import { hash } from 'argon2';
import { AuthDto } from 'src/auth/dto/auth.dto';
import { EnumUserRole } from '@prisma/client'
import { parsePagination } from 'src/common/pagination'

function excludePassword<T extends { password?: string | null }>(user: T) {
	const { password: _password, ...safeUser } = user
	return safeUser
}

@Injectable()
export class UserService {
	constructor(private readonly prisma: PrismaService) {}
		async getAll(user: { id: string, role: string }, searchTerm?: string, page?: string, limit?: string) {
    // 1. Поиск с учетом прав (важно, чтобы воркер не искал по админам)
    	if (searchTerm) return this.getSearchTermFilter(user, searchTerm, page, limit);

    // 2. АДМИН видит вообще всех (включая других админов и воркеров)
    // 3. ВОРКЕР видит всех пользователей (USER) + себя
    // 4. ЮЗЕР видит только себя
    	const filter: any = user.role === 'ADMIN'
    		? {}
    		: user.role === 'WORKER'
        		? { OR: [{ role: EnumUserRole.USER }, { id: user.id }] }
        		: { id: user.id }

    	const pagination = parsePagination(page, limit);

    	const [items, total] = await Promise.all([
        	this.prisma.user.findMany({
            	where: filter,
            	select: { id: true, email: true, name: true, role: true },
            	skip: pagination.skip,
            	take: pagination.limit
        	}),
        	this.prisma.user.count({ where: filter })
    	]);

    	return { items, total, page: pagination.page, limit: pagination.limit };
	}

	private async getSearchTermFilter(user: { id: string, role: string }, searchTerm: string, page?: string, limit?: string) {
    // Формируем базовый фильтр прав доступа
    	const accessFilter: any = user.role === 'ADMIN'
    		? {}
    		: user.role === 'WORKER'
        		? { OR: [{ role: EnumUserRole.USER }, { id: user.id }] }
        		: { id: user.id }

    	const whereClause = {
        	AND: [
            	accessFilter, // Сначала ограничиваем область видимости
            	{
                	OR: [
                    	{ name: { contains: searchTerm, mode: 'insensitive' } },
                    	{ email: { contains: searchTerm, mode: 'insensitive' } }
                	]
            	}
        	]
    	};

    	const pagination = parsePagination(page, limit);

    	const [users, total] = await Promise.all([
        	this.prisma.user.findMany({
            	where: whereClause,
            	include: { orders: true },
            	skip: pagination.skip,
            	take: pagination.limit
        	}),
        	this.prisma.user.count({ where: whereClause })
    	]);

    	return { items: users.map(excludePassword), total, page: pagination.page, limit: pagination.limit };
	}
	async getById(requestedId: string, currentUser?: { id: string, role: string }) {
        // Логика доступа:
        // Админ или Воркер могут смотреть любого
        // Юзер может смотреть только свой ID
        if (currentUser && currentUser.role! === 'USER' && currentUser.id !== requestedId) {
            throw new ForbiddenException('Вы можете просматривать только свой профиль');
        }

        const user = await this.prisma.user.findUnique({
            where: { id: requestedId },
            include: { orders: true } // Осторожно с этим (см. ниже)
        });

        if (!user) throw new NotFoundException('Пользователь не найден')
        return excludePassword(user)
    }

	async getByEmail(email: string) {
    // Возвращаем null, а не бросаем исключение: вызывающая сторона
    // (регистрация, OAuth-логин) сама решает, ошибка это или нет —
    // для них "пользователь не найден" вполне ожидаемый результат.
    	return this.prisma.user.findUnique({
        	where: { email },
        // Убираем include, так как заказы здесь — лишняя нагрузка и риск утечки
    	})
	}

	async create(dto: AuthDto) {
		return this.prisma.user.create({
			data: {
				name: dto.name,
				email: dto.email,
				password: await hash(dto.password),
				role: EnumUserRole.USER

			}
		})
	}
}
