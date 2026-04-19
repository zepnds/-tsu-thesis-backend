import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MaintenanceRequest } from '../entities/MaintenanceRequest.entity';

@Injectable()
export class MaintenanceService {
  constructor(
    @InjectRepository(MaintenanceRequest)
    private maintenanceRepository: Repository<MaintenanceRequest>,
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
    return saved;
  }
}
