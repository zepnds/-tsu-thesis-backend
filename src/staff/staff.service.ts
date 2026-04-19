import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BurialRequest } from '../entities/BurialRequest.entity';
import { MaintenanceRequest } from '../entities/MaintenanceRequest.entity';
import { BurialSchedule } from '../entities/BurialSchedule.entity';
import { MaintenanceSchedule } from '../entities/MaintenanceSchedule.entity';

@Injectable()
export class StaffService {
  constructor(
    @InjectRepository(BurialRequest)
    private burialRequestRepository: Repository<BurialRequest>,
    @InjectRepository(MaintenanceRequest)
    private maintenanceRequestRepository: Repository<MaintenanceRequest>,
    @InjectRepository(BurialSchedule)
    private burialScheduleRepository: Repository<BurialSchedule>,
    @InjectRepository(MaintenanceSchedule)
    private maintenanceScheduleRepository: Repository<MaintenanceSchedule>,
  ) {}

  async getAllTickets(type: string = 'all') {
    const burialTickets =
      type === 'all' || type === 'burial'
        ? await this.burialRequestRepository.find()
        : [];

    const maintenanceTickets =
      type === 'all' || type === 'maintenance'
        ? await this.maintenanceRequestRepository.find({ relations: ['requester'] })
        : [];

    return { burialTickets, maintenanceTickets };
  }

  async updateTicketStatus(type: 'burial' | 'maintenance', id: string, status: string) {
    if (type === 'burial') {
      const result = await this.burialRequestRepository.update(id, {
        status,
        updated_at: new Date(),
      });
      if (result.affected === 0) throw new NotFoundException('Burial request not found');
      return { success: true };
    } else {
      const result = await this.maintenanceRequestRepository.update(id, {
        status,
        updated_at: new Date(),
      });
      if (result.affected === 0) throw new NotFoundException('Maintenance request not found');
      return { success: true };
    }
  }

  async getBurialSchedules() {
    return this.burialScheduleRepository.find({ relations: ['plot', 'requester'] });
  }

  async getMaintenanceSchedules() {
    return this.maintenanceScheduleRepository.find({ relations: ['plot', 'user'] });
  }
}
