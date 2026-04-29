import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MaintenanceRequest } from '../entities/MaintenanceRequest.entity';
import { MailingService } from '../library/mailing/mailing.service';

@Injectable()
export class MaintenanceService {
  constructor(
    @InjectRepository(MaintenanceRequest)
    private maintenanceRepository: Repository<MaintenanceRequest>,
    private mailingService: MailingService,
  ) {}

  async findAll(status?: string) {
    const qb = this.maintenanceRepository.createQueryBuilder('mr')
      .leftJoinAndSelect('mr.requester', 'u1')
      .leftJoinAndSelect('mr.assigned_staff', 'u2')
      .orderBy('mr.created_at', 'DESC');

    if (status) {
      qb.where('LOWER(mr.status) = LOWER(:status)', { status });
    }

    const rows = await qb.getMany();
    return rows.map(mr => ({
      ...mr,
      requester_name: mr.requester ? `${mr.requester.first_name} ${mr.requester.last_name}` : null,
      assigned_staff_name: mr.assigned_staff ? `${mr.assigned_staff.first_name} ${mr.assigned_staff.last_name}` : null,
    }));
  }

  async schedule(id: string, updateData: any, schedulerId: string) {
    await this.maintenanceRepository.update(id, {
      ...updateData,
      status: 'scheduled',
      updated_at: new Date(),
    });

    const saved = await this.maintenanceRepository.findOne({
      where: { id },
      relations: ['requester', 'assigned_staff'],
    });

    if (!saved) throw new NotFoundException('Maintenance request not found');

    // Send Email
    if (saved.requester?.email) {
      const dateStr = saved.scheduled_date ? new Date(saved.scheduled_date).toLocaleDateString() : 'TBD';
      const timeStr = saved.scheduled_time || 'TBD';
      await this.mailingService.sendEmail(
        saved.requester.email,
        'Maintenance Request Scheduled',
        `<h1>Maintenance Scheduled</h1>
         <p>Hello ${saved.requester.first_name},</p>
         <p>Your maintenance request for <strong>${saved.deceased_name || 'the plot'}</strong> has been scheduled.</p>
         <p><strong>Date:</strong> ${dateStr}</p>
         <p><strong>Time:</strong> ${timeStr}</p>
         <p>Thank you.</p>`,
      );
    }

    return saved;
  }

  async complete(id: string, notes: string) {
    await this.maintenanceRepository.update(id, {
      status: 'completed',
      completion_notes: notes || '',
      updated_at: new Date(),
    });

    const saved = await this.maintenanceRepository.findOne({
      where: { id },
      relations: ['requester', 'assigned_staff'],
    });

    if (!saved) throw new NotFoundException('Maintenance request not found');

    // Send Email
    if (saved.requester?.email) {
      await this.mailingService.sendEmail(
        saved.requester.email,
        'Maintenance Request Completed',
        `<h1>Maintenance Completed</h1>
         <p>Hello ${saved.requester.first_name},</p>
         <p>Your maintenance request for <strong>${saved.deceased_name || 'the plot'}</strong> has been marked as completed.</p>
         ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
         <p>Thank you.</p>`,
      );
    }

    return saved;
  }

  async reject(id: string) {
    await this.maintenanceRepository.update(id, {
      status: 'rejected',
      updated_at: new Date(),
    });

    const saved = await this.maintenanceRepository.findOne({
      where: { id },
      relations: ['requester'],
    });

    if (!saved) throw new NotFoundException('Maintenance request not found');

    // Send Email
    if (saved.requester?.email) {
      await this.mailingService.sendEmail(
        saved.requester.email,
        'Maintenance Request Rejected',
        `<h1>Maintenance Request Update</h1>
         <p>Hello ${saved.requester.first_name},</p>
         <p>We regret to inform you that your maintenance request for <strong>${saved.deceased_name || 'the plot'}</strong> has been disapproved/rejected.</p>
         <p>Please contact the office for more information.</p>
         <p>Thank you.</p>`,
      );
    }

    return saved;
  }
}
