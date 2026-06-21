import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateTemplateDto {
  @IsString()
  name!: string;

  @IsString()
  thumbnail!: string;

  @IsString()
  htmlStructure!: string;

  @IsBoolean()
  isPremium!: boolean;
}

export class UpdateTemplateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  thumbnail?: string;

  @IsOptional()
  @IsString()
  htmlStructure?: string;

  @IsOptional()
  @IsBoolean()
  isPremium?: boolean;
}
