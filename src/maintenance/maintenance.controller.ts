import { Controller, Get, Patch, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('admin/maintenance')
@UseGuards(JwtAuthGuard)
export class MaintenanceController {
  constructor(private readonly service: MaintenanceService) {}

  @Get('/requests')
  async getRequests(@Query('status') status: string) {
    const data = await this.service.findAll(status);
    return { ok: true, data };
  }

  @Patch('/:id/schedule')
  async schedule(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const schedulerId = req.user?.id || 'admin';
    const data = await this.service.schedule(id, body, String(schedulerId));
    return { ok: true, message: 'Scheduled', data };
  }

  @Patch('/:id/complete')
  async complete(@Param('id') id: string, @Body('completion_notes') notes: string) {
    const data = await this.service.complete(id, notes);
    return { ok: true, message: 'Completed', data };
  }

  @Patch('/:id/reject')
  async reject(@Param('id') id: string) {
    const data = await this.service.reject(id);
    return { ok: true, message: 'Rejected', data };
  }
}
