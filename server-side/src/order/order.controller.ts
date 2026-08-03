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
    UseGuards,
    Patch
} from '@nestjs/common'
import { OrderService } from './order.service'
import { Auth } from 'src/auth/decorators/auth.decorator'
import { CurrentUser } from 'src/user/decorators/user.decorator'
import { OrderDto } from './dto/order.dto' // Твой DTO
import { Roles } from '../auth/decorators/roles.decorator'
import { RolesGuard } from '../auth/guards/roles.guard'
import { AuthGuard } from '@nestjs/passport'
import { UpdateOrderDto } from './dto/update-order.dto'
import { UpdateStatusDto } from './dto/update-status.dto'
import { EnumOrderStatus } from '@prisma/client'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'


@ApiTags('Orders')
@Controller('orders')
export class OrderController {
    constructor(private readonly orderService: OrderService) {}

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles('ADMIN')
    @Get()
    async getAll(
        @CurrentUser() user: { id: string; role: string },
        @Query('searchTerm') searchTerm?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string
    ) {
        return this.orderService.getAll(user, searchTerm, page, limit);
    }

    // Урезанные данные для воркеров — как в Telegram-боте, без email/платежей/лога.
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles('ADMIN', 'WORKER')
    @Get('worker-view')
    async getForWorker() {
        return this.orderService.getForWorker();
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles('ADMIN')
    @Get('analytics')
    async getAnalytics(@Query('days') days?: string) {
        const parsedDays = Number(days)
        return this.orderService.getAnalytics(Number.isFinite(parsedDays) && parsedDays > 0 ? parsedDays : undefined);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('by-id/:id')
    async getById(@Param('id') id: string, @CurrentUser() user: { id: string; role: string }) {
        return this.orderService.getById(id, user);
    }

    @Get('by-user')
    @Auth()
    async getByUserId(@CurrentUser() user: { id: string; role: string }) {
        return this.orderService.getByUserId(user.id, user);
    }

    @UseGuards(AuthGuard('jwt'))
    @UsePipes(new ValidationPipe())
    @HttpCode(200)
    @Post()
    async create(@Body() dto: OrderDto, @CurrentUser('id') userId: string) {
        return this.orderService.create(dto, userId);
    }

    @UseGuards(AuthGuard('jwt'))
    @HttpCode(200)
    @Post('validate-promo')
    async validatePromo(
        @Body('promoCode') promoCode: string,
        @Body('phone') phone: string
    ) {
        return this.orderService.validatePromoCode(promoCode, phone);
    }

    @UseGuards(AuthGuard('jwt'))
    @Put(':id')
    async update(
        @Param('id') id: string, 
        @Body() dto: UpdateOrderDto,
        @CurrentUser() user: { id: string; role: string }
    ) {
        return this.orderService.updateOrder(id, user, dto);
    }


    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles('ADMIN', 'WORKER')
    @Patch(':id/set-payment-details')
    async setDetails(
        @Param('id') id: string,
        @Body('shippingPrice') shippingPrice: number 
    ) {
        return this.orderService.setPaymentDetails(id, shippingPrice);
    }

    @UseGuards(AuthGuard('jwt'))
    @HttpCode(200)
    @Auth()
    @Delete(':id')
    async delete(@Param('id') id: string, @CurrentUser() user: { id: string; role: string }) {
        return this.orderService.delete(id, user);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles('ADMIN', 'WORKER')
    @Patch(':id/status')
    async updateStatus(
        @Param('id') id: string,
        @Body('status') status: EnumOrderStatus,
        @CurrentUser() user: { id: string; role: string }
    ) {
        return this.orderService.updateStatus(id, status, undefined, user.id, user.role === 'ADMIN' ? 'admin' : 'worker');
    }


    @Post('webhook/yookassa')
    async yookassaWebhook(@Body() body: any) {
        return this.orderService.handleWebhook(body);
    }
}