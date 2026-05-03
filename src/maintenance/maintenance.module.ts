import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaintenanceService } from './maintenance.service';
import { MaintenanceController } from './maintenance.controller';
import { MaintenanceRequest } from '../entities/MaintenanceRequest.entity';
import { MailingModule } from '../library/mailing/mailing.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([MaintenanceRequest]), MailingModule, AuthModule],
  providers: [MaintenanceService],
  controllers: [MaintenanceController],
})
export class MaintenanceModule { }
