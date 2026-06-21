import { Prisma } from '@prisma/client';
import { IsObject, IsOptional, IsString } from 'class-validator';

export class CreateResumeDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  templateId?: string;

  @IsObject()
  resumeDataJson!: Prisma.InputJsonValue;
}
