import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User } from '../entities/User.entity';
import { Plot } from '../entities/Plot.entity';
import { Grave } from '../entities/Grave.entity';
import { BurialRequest } from '../entities/BurialRequest.entity';
import { MaintenanceRequest } from '../entities/MaintenanceRequest.entity';
import { BuildingPlot } from '../entities/BuildingPlot.entity';
import { RoadPlot } from '../entities/RoadPlot.entity';
import { PlotReservation } from '../entities/PlotReservation.entity';
import { BurialSchedule } from 'src/entities/BurialSchedule.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Plot,
      Grave,
      BurialRequest,
      MaintenanceRequest,
      BuildingPlot,
      RoadPlot,
      PlotReservation,
      BurialSchedule
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule { }
