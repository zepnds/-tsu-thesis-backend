import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlotReservation } from '../entities/PlotReservation.entity';
import { Plot } from '../entities/Plot.entity';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectRepository(PlotReservation)
    private reservationRepository: Repository<PlotReservation>,
    @InjectRepository(Plot)
    private plotRepository: Repository<Plot>,
  ) {}

  async findAll() {
    return this.reservationRepository.find({
      relations: ['plot', 'user'],
      order: { created_at: 'DESC' },
    });
  }

  async findByUserId(userId: string) {
    return this.reservationRepository.find({
      where: { user_id: userId },
      relations: ['plot'],
    });
  }

  async updateStatus(id: string, status: string) {
    const result = await this.reservationRepository.update(id, {
      status,
      updated_at: new Date(),
    });
    if (result.affected === 0) throw new NotFoundException('Reservation not found');
    return this.reservationRepository.findOne({ where: { id }, relations: ['plot'] });
  }

  async delete(id: string) {
    const result = await this.reservationRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException('Reservation not found');
    return { success: true };
  }
}
