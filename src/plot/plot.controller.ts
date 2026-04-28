import { Controller, Get, Param } from '@nestjs/common';
import { ApiResponse } from '../common/dto/response.dto';
import { PlotService } from './plot.service';

@Controller('plot')
export class PlotController {
  constructor(private readonly plotService: PlotService) {}

  @Get()
  async getPlots() {
    return this.plotService.getPlotsGeoJson();
  }

  @Get('health')
  async health() {
    return ApiResponse.success('Service is healthy');
  }

  @Get('road-plots')
  async getRoadPlots() {
    return this.plotService.getRoadsGeoJson();
  }

  @Get('building-plots')
  async getBuildingPlots() {
    return this.plotService.getBuildingsGeoJson();
  }

  @Get(':id')
  async getPlotById(@Param('id') id: string) {
    return this.plotService.getPlotDetails(id);
  }
}
