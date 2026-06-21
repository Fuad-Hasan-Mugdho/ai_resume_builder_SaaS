import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateResumeDto } from './dto/create-resume.dto';

@Injectable()
export class ResumesService {
  constructor(private prisma: PrismaService) {}

  async list(userId: string) {
    return this.prisma.resume.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' } });
  }

  async create(userId: string, dto: CreateResumeDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const count = await this.prisma.resume.count({ where: { userId } });
    if (user?.subscriptionPlan === 'FREE' && count >= 2) {
      throw new ForbiddenException('Free plan allows max 2 resumes');
    }
    return this.prisma.resume.create({ data: { ...dto, userId } });
  }

  async update(userId: string, id: string, dto: Partial<CreateResumeDto>) {
    const resume = await this.prisma.resume.findFirst({ where: { id, userId } });
    if (!resume) throw new NotFoundException('Resume not found');
    return this.prisma.resume.update({ where: { id }, data: dto });
  }

  async remove(userId: string, id: string) {
    const resume = await this.prisma.resume.findFirst({ where: { id, userId } });
    if (!resume) throw new NotFoundException('Resume not found');
    await this.prisma.resume.delete({ where: { id } });
    return { message: 'Deleted' };
  }

  async authorizeExport(userId: string, id: string) {
    const resume = await this.prisma.resume.findFirst({ where: { id, userId } });
    if (!resume) throw new NotFoundException('Resume not found');
    const payment = await this.prisma.manualPaymentRequest.findFirst({
      where: {
        userId,
        resumeId: id,
        status: 'APPROVED',
        accessExpiresAt: { gt: new Date() },
      },
      orderBy: { reviewedAt: 'desc' },
    });
    if (!payment) throw new ForbiddenException('Buy and approve a ৳20 payment for this resume before downloading');
    return { authorized: true, mode: 'RESUME_PAYMENT', paymentId: payment.id, accessExpiresAt: payment.accessExpiresAt };
  }
}
