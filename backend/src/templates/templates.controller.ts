import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('templates')
export class TemplatesController {
  constructor(private prisma: PrismaService) {}

  @Get()
  list() {
    return this.prisma.template.findMany({
      select: { id: true, name: true, thumbnail: true, isPremium: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
  }
}
