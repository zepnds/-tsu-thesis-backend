import { Controller, Get, Patch, Body, Param } from '@nestjs/common';
import { CemeteryInfoService } from './cemetery-info.service';

@Controller('api/cemetery-info')
export class CemeteryInfoController {
  constructor(private readonly infoService: CemeteryInfoService) { }

  @Get()
  async getCemeteryInfo() {
    const info = await this.infoService.getLatest();
    return { success: true, data: info };
  }

  @Patch('/:id')
  async updateCemeteryInfo(@Param('id') id: string, @Body() body: any) {
    // We ignore the ID from param for now and just update the latest, 
    // or we could use the ID if we wanted to be more specific.
    // For consistency with saveOrUpdate:
    return { success: true, data: await this.infoService.saveOrUpdate(body) };
  }
}
