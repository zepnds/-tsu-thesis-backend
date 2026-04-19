import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BurialRequestsService } from './burial-requests.service';
import { BurialRequestsController } from './burial-requests.controller';
import { BurialRequest } from '../entities/BurialRequest.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BurialRequest])],
  providers: [BurialRequestsService],
  controllers: [BurialRequestsController],
})
export class BurialRequestsModule {}
