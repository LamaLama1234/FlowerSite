import { Global, Module } from '@nestjs/common'
import { PrismaService } from './prisma.service'

// Global, чтобы PrismaService был единственным синглтоном (одно
// подключение/пул к БД) на всё приложение, а не создавался заново
// в каждом модуле, который его импортирует.
@Global()
@Module({
	providers: [PrismaService],
	exports: [PrismaService]
})
export class PrismaModule {}
