import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BurialRequest } from '../entities/BurialRequest.entity';
import { MaintenanceRequest } from '../entities/MaintenanceRequest.entity';
import { BurialSchedule } from '../entities/BurialSchedule.entity';
import { MaintenanceSchedule } from '../entities/MaintenanceSchedule.entity';
import { MailingService } from '../library/mailing/mailing.service';

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
    private mailingService: MailingService,
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

      // Send Email
      const request = await this.burialRequestRepository.findOne({ where: { id }, relations: ['requester'] });
      if (request?.requester?.email) {
        const subject = `Burial Request ${status.charAt(0).toUpperCase() + status.slice(1)}`;
        await this.mailingService.sendEmail(
          request.requester.email,
          subject,
          `<h1>Burial Request Update</h1>
           <p>Hello ${request.requester.first_name},</p>
           <p>Your burial request for <strong>${request.deceased_name}</strong> has been <strong>${status}</strong>.</p>
           <p>Thank you.</p>`,
        );
      }

      return { success: true };
    } else {
      const result = await this.maintenanceRequestRepository.update(id, {
        status,
        updated_at: new Date(),
      });
      if (result.affected === 0) throw new NotFoundException('Maintenance request not found');

      // Send Email
      const request = await this.maintenanceRequestRepository.findOne({ where: { id }, relations: ['requester'] });
      if (request?.requester?.email) {
        const subject = `Maintenance Request ${status.charAt(0).toUpperCase() + status.slice(1)}`;
        await this.mailingService.sendEmail(
          request.requester.email,
          subject,
          `<h1>Maintenance Request Update</h1>
           <p>Hello ${request.requester.first_name},</p>
           <p>Your maintenance request for <strong>${request.deceased_name || 'the plot'}</strong> has been <strong>${status}</strong>.</p>
           <p>Thank you.</p>`,
        );
      }

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
