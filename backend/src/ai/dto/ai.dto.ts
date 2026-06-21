import { IsIn, IsOptional, IsString } from 'class-validator';

export class GenerateSummaryDto {
  @IsString()
  jobRole!: string;

  @IsString()
  years!: string;

  @IsString()
  skills!: string;
}

export class OptimizeResumeDto {
  @IsString()
  resumeText!: string;

  @IsString()
  jobDescription!: string;
}

export class CoverLetterDto {
  @IsString()
  resumeText!: string;

  @IsString()
  jobDescription!: string;

  @IsOptional()
  @IsIn(['Professional', 'Friendly', 'Formal', 'Creative'])
  tone?: 'Professional' | 'Friendly' | 'Formal' | 'Creative';
}

export class ChatAssistantDto {
  @IsString()
  message!: string;

  @IsOptional()
  @IsString()
  context?: string;
}
