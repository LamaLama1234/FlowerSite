import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf,
  ValidateNested,
  Min,
  MaxLength
} from 'class-validator'
import { Type } from 'class-transformer'
import { EnumOrderStatus } from '@prisma/client'
import { EnumDeliveryType } from '@prisma/client'

export class OrderDto {
  @IsOptional()
  @IsEnum(EnumOrderStatus, {
    message: 'Статус заказа должен быть одним из: ' + Object.values(EnumOrderStatus).join(', ')
  })
  status: EnumOrderStatus

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  customerName: string

  @IsString()
  @IsNotEmpty()
  phone: string

  @IsEnum(EnumDeliveryType, { message: 'Выберите корректный способ доставки (PICKUP или COURIER)' })
  @IsNotEmpty()
  deliveryType: EnumDeliveryType

  @IsString()
  @IsNotEmpty()
  deliveryAddress: string

  @IsDateString()
  deliveryDate: string // Преобразуем в Date в сервисе

  @IsOptional()
  @IsBoolean()
  isAsap?: boolean

  // Обязательно, если не выбрано "как можно быстрее"
  @ValidateIf(o => !o.isAsap)
  @IsString()
  @IsNotEmpty({ message: 'Укажите время доставки или выберите «как можно быстрее»' })
  @MaxLength(50)
  deliveryTimeSlot?: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string

  @IsOptional()
  @IsString()
  @MaxLength(50)
  promoCode?: string

  @IsArray({
    message: "В заказе нет ни одного товара"
  })
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[]
}

export class OrderItemDto {
  @IsNumber({}, { message: 'Количество должно быть числом' })
  @Min(1, { message: 'Количество не может быть меньше 1' })
  quantity: number

  @IsString({ message: 'ID продукта должен быть строкой' })
  @IsNotEmpty()
  productId: string
}