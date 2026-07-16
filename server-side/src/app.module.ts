import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { ConfigModule } from '@nestjs/config'
import { PrismaModule } from './prisma.module'
import { AuthModule } from './auth/auth.module'
import { UserModule } from './user/user.module'
import { CategoryModule } from './category/category.module'
import { FileModule } from './file/file.module'
import { OrderModule } from './order/order.module'
import { ProductModule } from './product/product.module'
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler'

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true
        }),
        // Настройка защиты от брутфорса
        ThrottlerModule.forRoot([{
            ttl: 60000, // 60 секунд
            limit: 50,  // 50 запросов в минуту на один IP
        }]),
        PrismaModule,
        AuthModule,
        UserModule,
        CategoryModule,
        FileModule,
        OrderModule,
        ProductModule
    ],
    providers: [
        // Без этого провайдера ThrottlerModule выше ничего не ограничивает
        { provide: APP_GUARD, useClass: ThrottlerGuard }
    ]
})
export class AppModule {}
