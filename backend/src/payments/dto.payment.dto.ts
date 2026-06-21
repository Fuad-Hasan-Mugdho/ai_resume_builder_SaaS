import { IsIn, IsOptional, IsString, Length } from 'class-validator';

export class CreateCheckoutDto {
  @IsOptional()
  @IsIn(['STRIPE', 'PAYPAL', 'SSLCOMMERZ'])
  provider?: 'STRIPE' | 'PAYPAL' | 'SSLCOMMERZ';
}

export class ManualPaymentDto {
  @IsString()
  resumeId!: string;

  @IsIn(['BKASH', 'NAGAD'])
  provider!: 'BKASH' | 'NAGAD';

  @IsString()
  @Length(10, 20)
  senderNumber!: string;

  @IsString()
  @Length(5, 100)
  transactionId!: string;
}

export class ReviewManualPaymentDto {
  @IsIn(['APPROVED', 'REJECTED'])
  status!: 'APPROVED' | 'REJECTED';

  @IsOptional()
  @IsString()
  rejectionNote?: string;
}
