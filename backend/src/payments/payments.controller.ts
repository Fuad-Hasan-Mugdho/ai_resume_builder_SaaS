import { Body, Controller, ForbiddenException, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { IsString } from 'class-validator';
import { CreateCheckoutDto, ManualPaymentDto, ReviewManualPaymentDto } from './dto.payment.dto';

class WebhookDto {
  @IsString()
  eventType!: string;

  @IsString()
  userId!: string;
}

@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post('create-checkout')
  createCheckout(@CurrentUser() user: { id: string }, @Body() dto: CreateCheckoutDto) {
    return this.payments.createCheckout(user.id, dto.provider || 'STRIPE');
  }

  @Post('webhook')
  webhook(@Body() dto: WebhookDto) {
    return this.payments.webhook(dto.eventType, dto.userId);
  }

  @Post('manual')
  manualPayment(@CurrentUser() user: { id: string }, @Body() dto: ManualPaymentDto) {
    return this.payments.submitManualPayment(user.id, dto);
  }

  @Get('manual/status')
  manualPaymentStatus(@CurrentUser() user: { id: string }) {
    return this.payments.manualPaymentStatus(user.id);
  }

}

@UseGuards(JwtAuthGuard)
@Controller('admin/manual-payments')
export class ManualPaymentsAdminController {
  constructor(private readonly payments: PaymentsService) {}

  @Get()
  list(@CurrentUser() user: { role: 'ADMIN' | 'USER' }) {
    if (user.role !== 'ADMIN') throw new ForbiddenException('Admin access required');
    return this.payments.listManualPayments();
  }

  @Patch(':id')
  review(@CurrentUser() user: { role: 'ADMIN' | 'USER' }, @Param('id') id: string, @Body() dto: ReviewManualPaymentDto) {
    if (user.role !== 'ADMIN') throw new ForbiddenException('Admin access required');
    return this.payments.reviewManualPayment(id, dto);
  }
}

@UseGuards(JwtAuthGuard)
@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly payments: PaymentsService) {}

  @Get('status')
  status(@CurrentUser() user: { id: string }) {
    return this.payments.status(user.id);
  }
}
