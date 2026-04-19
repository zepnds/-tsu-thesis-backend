import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlotController } from './plot.controller';
import { PlotService } from './plot.service';
import { Plot } from '../entities/Plot.entity';
import { BuildingPlot } from '../entities/BuildingPlot.entity';
import { RoadPlot } from '../entities/RoadPlot.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Plot, BuildingPlot, RoadPlot])],
  controllers: [PlotController],
  providers: [PlotService],
})
export class PlotModule {}
