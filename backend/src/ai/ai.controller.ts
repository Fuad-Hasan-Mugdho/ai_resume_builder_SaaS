import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ChatAssistantDto, CoverLetterDto, GenerateSummaryDto, OptimizeResumeDto } from './dto/ai.dto';

@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Post('generate-summary')
  generateSummary(@CurrentUser() user: { id: string }, @Body() dto: GenerateSummaryDto) {
    return this.ai.generateSummary(user.id, dto);
  }

  @Post('optimize-resume')
  optimizeResume(@CurrentUser() user: { id: string }, @Body() dto: OptimizeResumeDto) {
    return this.ai.optimizeResume(user.id, dto);
  }

  @Post('generate-cover-letter')
  generateCoverLetter(@CurrentUser() user: { id: string }, @Body() dto: CoverLetterDto) {
    return this.ai.generateCoverLetter(user.id, dto);
  }

  @Post('ats-check')
  atsCheck(@CurrentUser() user: { id: string }, @Body() dto: OptimizeResumeDto) {
    return this.ai.atsCheck(user.id, dto);
  }

  @Post('chat-assistant')
  chatAssistant(@CurrentUser() user: { id: string }, @Body() dto: ChatAssistantDto) {
    return this.ai.chatAssistant(user.id, dto);
  }
}
