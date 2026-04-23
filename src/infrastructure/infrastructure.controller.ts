import { Controller, Get } from '@nestjs/common';
import { InfrastructureService } from './infrastructure.service';

@Controller('infrastructure')
export class InfrastructureController {
  constructor(private readonly service: InfrastructureService) {}

  @Get('roads')
  async getRoads() {
    return this.service.getRoads();
  }

  @Get('buildings')
  async getBuildings() {
    return this.service.getBuildings();
  }
}
