import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InfrastructureService } from './infrastructure.service';
import { InfrastructureController } from './infrastructure.controller';
import { RoadPlot } from '../entities/RoadPlot.entity';
import { BuildingPlot } from '../entities/BuildingPlot.entity';

import { CemeteryInfrastructure } from '../entities/CemeteryInfrastructure.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RoadPlot, BuildingPlot, CemeteryInfrastructure])],
  providers: [InfrastructureService],
  controllers: [InfrastructureController],
})
export class InfrastructureModule {}
