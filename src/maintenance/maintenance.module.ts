import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaintenanceService } from './maintenance.service';
import { MaintenanceController } from './maintenance.controller';
import { MaintenanceRequest } from '../entities/MaintenanceRequest.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MaintenanceRequest])],
  providers: [MaintenanceService],
  controllers: [MaintenanceController],
})
export class MaintenanceModule {}
