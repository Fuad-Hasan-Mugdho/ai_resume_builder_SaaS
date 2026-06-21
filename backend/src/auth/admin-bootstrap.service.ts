import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminBootstrapService implements OnModuleInit {
  constructor(private prisma: PrismaService, private config: ConfigService) {}

  async onModuleInit() {
    const email = this.config.get<string>('ADMIN_EMAIL');
    const password = this.config.get<string>('ADMIN_PASSWORD');
    if (!email || !password) return;

    await this.prisma.user.upsert({
      where: { email },
      update: { role: 'ADMIN' },
      create: {
        email,
        name: 'ResumeAI Admin',
        password: await bcrypt.hash(password, 12),
        role: 'ADMIN',
      },
    });

    if (await this.prisma.template.count() === 0) {
      await this.prisma.template.createMany({ data: [
        { name: 'Minimal ATS', thumbnail: '/templates/minimal.png', htmlStructure: 'minimal', isPremium: false },
        { name: 'Modern Professional', thumbnail: '/templates/modern.png', htmlStructure: 'modern', isPremium: false },
        { name: 'Creative Accent', thumbnail: '/templates/creative.png', htmlStructure: 'creative', isPremium: true },
      ] });
    }
  }
}
