import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StaffController } from './staff.controller';
import { StaffService } from './staff.service';
import { BurialRequest } from '../entities/BurialRequest.entity';
import { MaintenanceRequest } from '../entities/MaintenanceRequest.entity';
import { BurialSchedule } from '../entities/BurialSchedule.entity';
import { MaintenanceSchedule } from '../entities/MaintenanceSchedule.entity';
import { User } from '../entities/User.entity';
import { MailingModule } from '../library/mailing/mailing.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BurialRequest,
      MaintenanceRequest,
      BurialSchedule,
      MaintenanceSchedule,
      User,
    ]),
    MailingModule,
  ],
  controllers: [StaffController],
  providers: [StaffService],
})
export class StaffModule {}
