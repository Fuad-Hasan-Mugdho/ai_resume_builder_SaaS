import { Body, Controller, Delete, ForbiddenException, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AdminService } from './admin.service';
import { CreateTemplateDto, UpdateTemplateDto } from './dto.template';
import { UpdateUserDto } from './dto.user';

@UseGuards(JwtAuthGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('analytics')
  analytics(@CurrentUser() user: { role: 'ADMIN' | 'USER' }) {
    if (user.role !== 'ADMIN') throw new ForbiddenException('Admin access required');
    return this.admin.analytics();
  }

  @Get('users')
  users(@CurrentUser() user: { role: 'ADMIN' | 'USER' }) {
    if (user.role !== 'ADMIN') throw new ForbiddenException('Admin access required');
    return this.admin.users();
  }

  @Put('users/:id')
  updateUser(
    @CurrentUser() user: { role: 'ADMIN' | 'USER' },
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    if (user.role !== 'ADMIN') throw new ForbiddenException('Admin access required');
    return this.admin.updateUser(id, dto);
  }

  @Delete('users/:id')
  deleteUser(
    @CurrentUser() user: { id: string; role: 'ADMIN' | 'USER' },
    @Param('id') id: string,
  ) {
    if (user.role !== 'ADMIN') throw new ForbiddenException('Admin access required');
    if (user.id === id) throw new ForbiddenException('You cannot delete your own admin account');
    return this.admin.deleteUser(id);
  }

  @Get('templates')
  templates(@CurrentUser() user: { role: 'ADMIN' | 'USER' }) {
    if (user.role !== 'ADMIN') throw new ForbiddenException('Admin access required');
    return this.admin.templates();
  }

  @Post('templates')
  createTemplate(@CurrentUser() user: { role: 'ADMIN' | 'USER' }, @Body() dto: CreateTemplateDto) {
    if (user.role !== 'ADMIN') throw new ForbiddenException('Admin access required');
    return this.admin.createTemplate(dto);
  }

  @Put('templates/:id')
  updateTemplate(
    @CurrentUser() user: { role: 'ADMIN' | 'USER' },
    @Param('id') id: string,
    @Body() dto: UpdateTemplateDto,
  ) {
    if (user.role !== 'ADMIN') throw new ForbiddenException('Admin access required');
    return this.admin.updateTemplate(id, dto);
  }

  @Delete('templates/:id')
  deleteTemplate(@CurrentUser() user: { role: 'ADMIN' | 'USER' }, @Param('id') id: string) {
    if (user.role !== 'ADMIN') throw new ForbiddenException('Admin access required');
    return this.admin.deleteTemplate(id);
  }
}
