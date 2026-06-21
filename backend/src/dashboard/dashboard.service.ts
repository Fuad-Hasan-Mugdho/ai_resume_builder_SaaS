import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async get(userId: string) {
    const [resumeCount, recentResumes, aiUsageCount, coverLetters, avgAts, user] = await Promise.all([
      this.prisma.resume.count({ where: { userId } }),
      this.prisma.resume.findMany({ where: { userId }, take: 5, orderBy: { updatedAt: 'desc' } }),
      this.prisma.aIUsage.count({ where: { userId } }),
      this.prisma.coverLetter.count({ where: { userId } }),
      this.prisma.resume.aggregate({ where: { userId }, _avg: { atsScore: true } }),
      this.prisma.user.findUnique({ where: { id: userId } }),
    ]);

    return {
      totalResumes: resumeCount,
      atsScoreAverage: avgAts._avg.atsScore || 0,
      subscriptionStatus: user?.subscriptionPlan || 'FREE',
      userName: user?.name || 'User',
      cvPass: {
        active: Boolean(user?.cvPassExpiresAt && user.cvPassExpiresAt > new Date() && user.cvPassExportsRemaining > 0),
        expiresAt: user?.cvPassExpiresAt,
        exportsRemaining: user?.cvPassExportsRemaining || 0,
      },
      recentResumes,
      coverLetters,
      aiCreditsUsage: aiUsageCount,
    };
  }
}
