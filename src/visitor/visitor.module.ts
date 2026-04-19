import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VisitorController } from './visitor.controller';
import { VisitorService } from './visitor.service';
import { AuthModule } from '../auth/auth.module';
import { Plot } from '../entities/Plot.entity';
import { PlotReservation } from '../entities/PlotReservation.entity';
import { Grave } from '../entities/Grave.entity';
import { BurialRequest } from '../entities/BurialRequest.entity';
import { MaintenanceRequest } from '../entities/MaintenanceRequest.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Plot,
      PlotReservation,
      Grave,
      BurialRequest,
      MaintenanceRequest,
    ]),
    AuthModule,
  ],
  controllers: [VisitorController],
  providers: [VisitorService],
})
export class VisitorModule {}
