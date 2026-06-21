import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTemplateDto, UpdateTemplateDto } from './dto.template';
import { UpdateUserDto } from './dto.user';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  analytics() {
    return Promise.all([
      this.prisma.user.count(),
      this.prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      this.prisma.aIUsage.count(),
      this.prisma.subscription.findMany({ where: { status: 'ACTIVE' } }),
    ]).then(([users, activeSubs, aiRequests, subscriptions]) => ({
      users,
      activeSubs,
      aiRequests,
      monthlyRevenueEstimate: subscriptions.filter((s) => s.plan === 'PREMIUM').length * 15,
    }));
  }

  users() {
    return this.prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, subscriptionPlan: true, createdAt: true, _count: { select: { resumes: true, aiUsage: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  updateUser(id: string, dto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: { id: true, name: true, email: true, role: true, subscriptionPlan: true },
    });
  }

  deleteUser(id: string) {
    return this.prisma.user.delete({ where: { id }, select: { id: true, email: true } });
  }

  templates() {
    return this.prisma.template.findMany({ orderBy: { createdAt: 'desc' } });
  }

  createTemplate(dto: CreateTemplateDto) {
    return this.prisma.template.create({ data: dto });
  }

  updateTemplate(id: string, dto: UpdateTemplateDto) {
    return this.prisma.template.update({ where: { id }, data: dto });
  }

  deleteTemplate(id: string) {
    return this.prisma.template.delete({ where: { id } });
  }
}
