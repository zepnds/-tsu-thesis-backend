import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { GravesService } from './graves.service';

@Controller('api/graves')
export class GravesController {
  constructor(private readonly gravesService: GravesService) {}

  @Get('/')
  async findAll(@Query('search') search: string) {
    return this.gravesService.findAll({ search });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.gravesService.findById(id);
  }

  @Post('/')
  async create(@Body() body: any) {
    return this.gravesService.create(body);
  }

  @Put('/:id')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.gravesService.update(id, body);
  }

  @Delete('/:id')
  async delete(@Param('id') id: string) {
    return this.gravesService.delete(id);
  }
}
