import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';
import { PlotReservation } from '../entities/PlotReservation.entity';
import { Plot } from '../entities/Plot.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PlotReservation, Plot])],
  controllers: [ReservationsController],
  providers: [ReservationsService],
  exports: [ReservationsService],
})
export class ReservationsModule {}
