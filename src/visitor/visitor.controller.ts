import { Controller, Get, Post, Patch, Body, Query, Param, Req } from '@nestjs/common';
import { VisitorService } from './visitor.service';

@Controller('api/visitor')
export class VisitorController {
  constructor(private readonly visitorService: VisitorService) {}

  /* =========================================================================
     PUBLIC ROUTES
  ======================================================================== */
  @Get('burial-records')
  async getBurialRecords(@Query('search') search: string) {
    return this.visitorService.getBurialRecords({ search });
  }

  @Get('dashboard-stats')
  async getDashboardStats() {
    return { success: true, data: { burial: 0, maintenance: 0, reservations: 0 } };
  }

  /* =========================================================================
     PROTECTED ROUTES
  ======================================================================== */
  @Post('reserve-plot')
  async reservePlot(@Body() body: any, @Req() req: any) {
    const userId = req.user?.id || body.user_id || '15';
    return this.visitorService.reservePlot(userId, body.plot_id, body);
  }

  @Get('my-reservations')
  async getMyReservations(@Query('userId') userId: string) {
    return this.visitorService.getMyReservations(userId);
  }

  @Get('plot-request/list/:userId')
  async getPlotRequests(@Param('userId') userId: string) {
    return this.visitorService.getMyReservations(userId);
  }

  /* --- Burial Request --- */
  @Post('request-burial')
  async createBurialRequest(@Body() body: any, @Req() req: any) {
    const userId = req.user?.id || body.user_id || '15';
    return this.visitorService.createBurialRequest(userId, body);
  }

  @Post('burial-request')
  async createBurialRequestAlias(@Body() body: any, @Req() req: any) {
    const userId = req.user?.id || body.user_id || '15';
    return this.visitorService.createBurialRequest(userId, body);
  }

  @Get('my-burial-requests/:userId')
  async getMyBurialRequests(@Param('userId') userId: string) {
    return this.visitorService.getMyBurialRequests(userId);
  }

  /* --- Maintenance Request --- */
  @Post('request-maintenance')
  async createMaintenanceRequest(@Body() body: any, @Req() req: any) {
    const userId = req.user?.id || body.user_id || '15';
    return this.visitorService.createMaintenanceRequest(userId, body);
  }

  @Get('my-maintenance-schedule/:userId')
  async getMyMaintenanceRequests(@Param('userId') userId: string) {
    return this.visitorService.getMyMaintenanceRequests(userId);
  }
}
