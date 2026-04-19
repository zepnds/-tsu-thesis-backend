import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GravesController } from './graves.controller';
import { GravesService } from './graves.service';
import { Grave } from '../entities/Grave.entity';
import { Plot } from '../entities/Plot.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Grave, Plot])],
  controllers: [GravesController],
  providers: [GravesService],
  exports: [GravesService],
})
export class GravesModule {}
