import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CemeteryInfoController } from './cemetery-info.controller';
import { CemeteryInfoService } from './cemetery-info.service';
import { CemeteryInfo } from '../entities/CemeteryInfo.entity';

import { SuperAdminController } from './superadmin.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CemeteryInfo])],
  controllers: [CemeteryInfoController, SuperAdminController],
  providers: [CemeteryInfoService],
})
export class CemeteryInfoModule {}
