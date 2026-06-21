import { IsIn, IsOptional } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsIn(['USER', 'ADMIN'])
  role?: 'USER' | 'ADMIN';

  @IsOptional()
  @IsIn(['FREE', 'PREMIUM'])
  subscriptionPlan?: 'FREE' | 'PREMIUM';
}
