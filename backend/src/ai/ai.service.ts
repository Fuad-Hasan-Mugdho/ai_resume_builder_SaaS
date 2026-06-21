import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAI } from 'openai';
import { PrismaService } from '../prisma/prisma.service';
import { ChatAssistantDto, CoverLetterDto, GenerateSummaryDto, OptimizeResumeDto } from './dto/ai.dto';

@Injectable()
export class AiService {
  private openai: OpenAI | null = null;

  constructor(private config: ConfigService, private prisma: PrismaService) {
    const key = this.config.get<string>('OPENAI_API_KEY');
    if (key) this.openai = new OpenAI({ apiKey: key });
  }

  async generateSummary(userId: string, dto: GenerateSummaryDto) {
    await this.ensureQuota(userId, 'generate-summary');
    if (!this.openai) {
      return {
        summary: `${dto.jobRole} with ${dto.years} years of experience, skilled in ${dto.skills}. Demonstrates a strong record of delivering reliable results, collaborating across teams, and continuously improving professional expertise.`,
        provider: 'local',
      };
    }
    const prompt = `Generate a professional resume summary for a ${dto.jobRole} with ${dto.years} years of experience using these skills: ${dto.skills}`;
    const output = await this.callModel(prompt, 'summary');
    return { summary: output, provider: 'openai' };
  }

  async optimizeResume(userId: string, dto: OptimizeResumeDto) {
    await this.ensureQuota(userId, 'optimize-resume');
    if (!this.openai) {
      const analysis = this.localAtsAnalysis(dto.resumeText, dto.jobDescription);
      return {
        analysis: {
          keywordMatch: analysis.breakdown.keywordMatch,
          missingSkills: analysis.missingKeywords,
          suggestions: analysis.suggestions,
          improvedBullets: [
            'Use an action verb, describe the task, and quantify the result.',
            'Example: Improved delivery speed by 25% by automating the release workflow.',
          ],
        },
        provider: 'local',
      };
    }
    const prompt = `Analyze this resume against the job description. Return JSON with keywordMatch, missingSkills, suggestions, improvedBullets. Resume: ${dto.resumeText}\nJob: ${dto.jobDescription}`;
    const output = await this.callModel(prompt, 'optimization');
    return { analysis: output };
  }

  async atsCheck(userId: string, dto: OptimizeResumeDto) {
    await this.ensureQuota(userId, 'ats-check');
    if (!this.openai) return { scoreReport: this.localAtsAnalysis(dto.resumeText, dto.jobDescription), provider: 'local' };
    const prompt = `Score this resume for ATS from 0-100 based on keyword match, formatting quality, readability, experience relevance, skill match, length, section completeness. Resume:${dto.resumeText}\nJob:${dto.jobDescription}`;
    const output = await this.callModel(prompt, 'ats');
    return { scoreReport: output };
  }

  async generateCoverLetter(userId: string, dto: CoverLetterDto) {
    await this.ensureQuota(userId, 'cover-letter');
    if (!this.openai) {
      const tone = dto.tone || 'Professional';
      const keywords = this.extractKeywords(dto.jobDescription).slice(0, 5).join(', ');
      const output = `Dear Hiring Manager,\n\nI am writing to express my interest in this opportunity. My background aligns well with your need for ${keywords || 'a motivated professional'}, and my resume demonstrates relevant hands-on experience and a commitment to measurable results.\n\nI would welcome the opportunity to discuss how my skills can contribute to your team. Thank you for your consideration.\n\nSincerely,\nCandidate\n\nTone: ${tone}`;
      await this.prisma.coverLetter.create({ data: { userId, content: output } });
      return { coverLetter: output, provider: 'local' };
    }
    const prompt = `Generate a ${dto.tone || 'Professional'} cover letter based on this resume and job description. Resume:${dto.resumeText}\nJob:${dto.jobDescription}`;
    const output = await this.callModel(prompt, 'cover-letter');
    await this.prisma.coverLetter.create({ data: { userId, content: output } });
    return { coverLetter: output };
  }

  async chatAssistant(userId: string, dto: ChatAssistantDto) {
    await this.ensureQuota(userId, 'chat-assistant');
    if (!this.openai) {
      return {
        reply: `Focus your resume on the target role, mirror relevant job-description keywords, lead bullets with action verbs, and quantify outcomes. For “${dto.message}”, start with one concrete achievement and connect it to the employer's needs.`,
        provider: 'local',
      };
    }
    const prompt = `You are a resume and career coach. User message: ${dto.message}\nContext: ${dto.context || 'N/A'}\nReturn concise and actionable guidance.`;
    const output = await this.callModel(prompt, 'chat-assistant');
    return { reply: output };
  }

  private async ensureQuota(userId: string, featureUsed: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    if (user.subscriptionPlan === 'FREE') {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const usage = await this.prisma.aIUsage.count({ where: { userId, createdAt: { gte: startOfDay } } });
      if (usage >= 5) {
        throw new ForbiddenException('Daily AI limit reached for free plan');
      }
    }

    await this.prisma.aIUsage.create({ data: { userId, featureUsed, tokensUsed: 100 } });
  }

  private async callModel(prompt: string, fallbackType: string) {
    if (!this.openai) {
      return `Mocked ${fallbackType} result. Configure OPENAI_API_KEY for live AI output.`;
    }

    const result = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    });

    return result.choices[0]?.message?.content || '';
  }

  private localAtsAnalysis(resumeText: string, jobDescription: string) {
    const resume = resumeText.toLowerCase();
    const keywords = this.extractKeywords(jobDescription);
    const matchedKeywords = keywords.filter((keyword) => resume.includes(keyword));
    const missingKeywords = keywords.filter((keyword) => !resume.includes(keyword)).slice(0, 15);
    const keywordMatch = keywords.length ? Math.round((matchedKeywords.length / keywords.length) * 100) : 0;
    const sectionSignals = ['experience', 'education', 'skills', 'summary', 'project'];
    const sectionCompleteness = Math.round((sectionSignals.filter((section) => resume.includes(section)).length / sectionSignals.length) * 100);
    const wordCount = resumeText.trim().split(/\s+/).filter(Boolean).length;
    const lengthScore = wordCount >= 250 && wordCount <= 900 ? 100 : wordCount >= 120 && wordCount <= 1200 ? 70 : 40;
    const readability = Math.min(100, resumeText.split(/\n/).filter((line) => line.trim()).length * 8 + 35);
    const skillMatch = keywordMatch;
    const experienceRelevance = Math.round(keywordMatch * 0.7 + sectionCompleteness * 0.3);
    const formattingQuality = resumeText.length > 0 ? 80 : 0;
    const overallScore = Math.round(keywordMatch * 0.35 + sectionCompleteness * 0.15 + lengthScore * 0.1 + readability * 0.1 + skillMatch * 0.15 + experienceRelevance * 0.1 + formattingQuality * 0.05);

    return {
      overallScore,
      breakdown: { keywordMatch, formattingQuality, readability, experienceRelevance, skillMatch, resumeLength: lengthScore, sectionCompleteness },
      matchedKeywords: matchedKeywords.slice(0, 20),
      missingKeywords,
      suggestions: [
        missingKeywords.length ? `Add relevant missing keywords naturally: ${missingKeywords.slice(0, 6).join(', ')}.` : 'Keyword coverage is strong.',
        sectionCompleteness < 100 ? 'Add clearly labelled summary, experience, education, skills, and projects sections.' : 'Core sections are complete.',
        lengthScore < 100 ? 'Keep the resume between roughly 250 and 900 words.' : 'Resume length is ATS-friendly.',
        'Use measurable achievements instead of responsibility-only bullet points.',
      ],
    };
  }

  private extractKeywords(text: string) {
    const stopWords = new Set(['and', 'the', 'with', 'for', 'that', 'this', 'from', 'your', 'you', 'our', 'are', 'will', 'have', 'has', 'but', 'not', 'all', 'job', 'role', 'work', 'years']);
    return [...new Set(text.toLowerCase().match(/[a-z][a-z+#.\-]{2,}/g) || [])]
      .filter((word) => !stopWords.has(word))
      .slice(0, 60);
  }
}
