import { Controller, Get, Post, Patch, Body, Query, Param, Req, UseGuards } from '@nestjs/common';
import { VisitorService } from './visitor.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('visitor')
export class VisitorController {
  constructor(private readonly visitorService: VisitorService) { }

  /* =========================================================================
     PUBLIC ROUTES
  ======================================================================== */
  @Get('burial-records')
  async getBurialRecords(
    @Query('search') search?: string,
    @Query('q') q?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const searchTerm = q || search;
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    const offsetNum = offset ? parseInt(offset, 10) : undefined;

    return this.visitorService.getBurialRecords({
      search: searchTerm,
      limit: limitNum,
      offset: offsetNum,
    });
  }

  @Get('dashboard-stats')
  async getDashboardStats() {
    return { success: true, data: { burial: 0, maintenance: 0, reservations: 0 } };
  }

  /* =========================================================================
     PROTECTED ROUTES
  ======================================================================== */
  @UseGuards(JwtAuthGuard)
  @Post('reserve-plot')
  async reservePlot(@Body() body: any, @Req() req: any) {
    const userId = req.user.id;
    return this.visitorService.reservePlot(userId, body.plot_id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-reservations')
  async getMyReservations(@Req() req: any) {
    const userId = req.user.id;
    return this.visitorService.getMyReservations(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('plot-request/list/:userId')
  async getPlotRequests(@Param('userId') userId: string) {
    return this.visitorService.getMyReservations(userId);
  }

  /* --- Burial Request --- */
  @UseGuards(JwtAuthGuard)
  @Post('request-burial')
  async createBurialRequest(@Body() body: any, @Req() req: any) {
    const userId = req.user.id;
    return this.visitorService.createBurialRequest(userId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('burial-request')
  async createBurialRequestAlias(@Body() body: any, @Req() req: any) {
    const userId = req.user.id;
    return this.visitorService.createBurialRequest(userId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-burial-requests/:userId')
  async getMyBurialRequests(@Param('userId') userId: string) {
    return this.visitorService.getMyBurialRequests(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-deceased-family/:userId')
  async getMyDeceasedFamily(@Param('userId') userId: string) {
    return this.visitorService.getMyDeceasedFamily(userId);
  }


  @UseGuards(JwtAuthGuard)
  @Get('my-deceased-family-grave')
  async getMyDeceasedFamilyPlot(@Query('userId') userId: string, @Query('plotId') plotId: string) {
    return this.visitorService.getMyDeceasedFamilyPlot(userId, plotId);
  }


  @Get('graves')
  async getAllGravesFamily(
    @Query('q') q?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const searchTerm = q || search;
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    const offsetNum = offset ? parseInt(offset, 10) : undefined;

    return this.visitorService.getAllGraves({
      search: searchTerm,
      limit: limitNum,
      offset: offsetNum,
    });
  }

  /* --- Maintenance Request --- */
  @UseGuards(JwtAuthGuard)
  @Post('request-maintenance')
  async createMaintenanceRequest(@Body() body: any, @Req() req: any) {
    const userId = req.user.id;
    return this.visitorService.createMaintenanceRequest(userId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-maintenance-schedule/:userId')
  async getMyMaintenanceRequests(@Param('userId') userId: string) {
    return this.visitorService.getMyMaintenanceRequests(userId);
  }
}
