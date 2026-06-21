import { Module } from '@nestjs/common';
import { ManualPaymentsAdminController, PaymentsController, SubscriptionController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({ controllers: [PaymentsController, SubscriptionController, ManualPaymentsAdminController], providers: [PaymentsService] })
export class PaymentsModule {}
