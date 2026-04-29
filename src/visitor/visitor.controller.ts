import { Controller, Get, Post, Patch, Body, Query, Param, Req, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
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
  @UseInterceptors(
    FileInterceptor('death_certificate', {
      storage: diskStorage({
        destination: './uploads/death-certificates',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `death-cert-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async createBurialRequest(@Body() body: any, @Req() req: any, @UploadedFile() file: any) {
    const userId = req.user.id;
    const requestData = { ...body };
    if (file) {
      requestData.death_certificate_url = `/uploads/death-certificates/${file.filename}`;
      // Ensure directory exists
      if (!fs.existsSync('./uploads/death-certificates')) {
        fs.mkdirSync('./uploads/death-certificates', { recursive: true });
      }
    }
    return this.visitorService.createBurialRequest(userId, requestData);
  }

  @UseGuards(JwtAuthGuard)
  @Post('burial-request')
  @UseInterceptors(
    FileInterceptor('death_certificate', {
      storage: diskStorage({
        destination: './uploads/death-certificates',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `death-cert-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
          return cb(new BadRequestException('Only JPG, JPEG, and PNG files are allowed!'), false);
        }
        cb(null, true);
      },
    }),
  )
  async createBurialRequestAlias(@Body() body: any, @Req() req: any, @UploadedFile() file: any) {
    const userId = req.user.id;
    const requestData = { ...body };
    if (file) {
      requestData.death_certificate_url = `/uploads/death-certificates/${file.filename}`;
      // Ensure directory exists
      if (!fs.existsSync('./uploads/death-certificates')) {
        fs.mkdirSync('./uploads/death-certificates', { recursive: true });
      }
    }
    return this.visitorService.createBurialRequest(userId, requestData);
  }

  @UseGuards(JwtAuthGuard)
  @Post('burial-requests/:id/death-certificate')
  @UseInterceptors(
    FileInterceptor('death_certificate', {
      storage: diskStorage({
        destination: './uploads/death-certificates',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `death-cert-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
          return cb(new BadRequestException('Only JPG, JPEG, and PNG files are allowed!'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadDeathCertificate(
    @Param('id') id: string,
    @UploadedFile() file: any,
  ) {
    if (!file) {
      return { success: false, message: 'No file uploaded' };
    }

    // Ensure directory exists
    if (!fs.existsSync('./uploads/death-certificates')) {
      fs.mkdirSync('./uploads/death-certificates', { recursive: true });
    }

    const deathCertificateUrl = `/uploads/death-certificates/${file.filename}`;
    const updated = await this.visitorService.updateBurialRequestDeathCert(id, deathCertificateUrl);
    return { success: true, message: 'Death certificate uploaded successfully', data: updated };
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
  async getMyDeceasedFamilyPlot(@Query('userId') userId: string, @Query('q') q: string) {
    return this.visitorService.getMyDeceasedFamilyPlot(userId, q);
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
