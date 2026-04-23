import { Controller, Get, Patch, Param, Body, Query } from '@nestjs/common';
import { StaffService } from './staff.service';

@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Get('tickets')
  async getAllTickets(@Query('type') type: string) {
    return this.staffService.getAllTickets(type);
  }

  @Patch('update-ticket-status/:type/:id')
  async updateTicketStatus(
    @Param('type') type: 'burial' | 'maintenance',
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.staffService.updateTicketStatus(type, id, status);
  }

  @Get('burial-schedules')
  async getBurialSchedules() {
    return this.staffService.getBurialSchedules();
  }

  @Get('maintenance-schedules')
  async getMaintenanceSchedules() {
    return this.staffService.getMaintenanceSchedules();
  }
}
