import { Controller, Get, Post, Put, Delete, Body, Param, Patch, Query } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) { }

  @Get('metrics')
  async getMetrics() {
    return this.adminService.getDashboardMetrics();
  }


  @Get('plots')
  async getPlots() {
    return this.adminService.getPlots();
  }

  @Get('graves')
  async getAllGrave() {
    return this.adminService.getAllGrave();
  }


  @Get('burial-schedule')
  async getBurialSchedule() {
    return this.adminService.getBurialSchedule();
  }

  /* --- Plots --- */
  @Post('add-plot')
  async addPlot(@Body() body: any) {
    return this.adminService.addPlot(body);
  }

  @Put('edit-plot')
  async editPlot(@Body() body: any) {
    return this.adminService.editPlot(body.id, body);
  }

  @Delete('delete-plot/:id')
  async deletePlot(@Param('id') id: string) {
    return this.adminService.deletePlot(id);
  }

  @Get('plot/:id')
  async getPlotDetails(@Param('id') id: string) {
    return this.adminService.getPlotDetails(id);
  }

  /* --- Burial Records --- */
  @Get('burial-records')
  async getBurialRecords() {
    // This will be expanded later
    return [];
  }

  @Get('burial-requests')
  async getBurialRequests() {
    return this.adminService.getBurialRequests();
  }

  @Get('maintenance-requests')
  async getMaintenanceRequests() {
    return this.adminService.getMaintenanceRequests();
  }

  @Post('burial-records')
  async addBurialRecord(@Body() body: any) {
    return this.adminService.addBurialRecord(body);
  }

  /* --- Users --- */
  @Get('users/visitors')
  async getVisitorUsers() {
    return this.adminService.getVisitors();
  }

  @Get('visitors')
  async getVisitors() {
    return this.adminService.getVisitors();
  }

  @Put('visitors/:id')
  async updateVisitor(@Param('id') id: string, @Body() body: any) {
    return this.adminService.updateVisitor(id, body);
  }

  @Get('reservations')
  async getReservations() {
    return this.adminService.getReservations();
  }

  /* --- Reservations --- */
  @Patch('reservations/:id/approve-payment')
  async approveReservationPayment(@Param('id') id: string) {
    return this.adminService.approveReservationAsAdmin(id);
  }

  @Patch('reservations/:id/approve')
  async approveReservation(@Param('id') id: string) {
    return this.adminService.approveReservationAsAdmin(id);
  }

  /* --- Burial Requests --- */
  @Post('burial-requests/:id/confirm')
  async confirmBurialRequestPost(@Param('id') id: string) {
    return this.adminService.confirmBurialRequestAsAdmin(id);
  }

  @Post('burial-requests/confirm/:id')
  async confirmBurialRequestPostAlias(@Param('id') id: string) {
    return this.adminService.confirmBurialRequestAsAdmin(id);
  }

  @Put('burial-requests/confirm/:id')
  async confirmBurialRequestPutAlias(@Param('id') id: string) {
    return this.adminService.confirmBurialRequestAsAdmin(id);
  }

  @Put('burial-schedule/confirm')
  async updateBurialScheduleStatus(@Query('id') id: string) {
    return this.adminService.updateBurialScheduleStatus(id);
  }
}

