import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import * as crypto from 'crypto';
import { Grave } from '../entities/Grave.entity';
import { Plot } from '../entities/Plot.entity';

@Injectable()
export class GravesService {
  constructor(
    @InjectRepository(Grave)
    private graveRepository: Repository<Grave>,
    @InjectRepository(Plot)
    private plotRepository: Repository<Plot>,
  ) {}

  async findAll(options: { search?: string } = {}) {
    const qb = this.graveRepository.createQueryBuilder('g')
      .leftJoinAndSelect('g.plot', 'p')
      .orderBy('g.deceased_name', 'ASC');

    if (options.search) {
      qb.where('g.deceased_name ILIKE :search', { search: `%${options.search}%` });
    }

    return qb.getMany();
  }

  async findById(id: string) {
    const grave = await this.graveRepository.findOne({ where: { id }, relations: ['plot'] });
    if (!grave) throw new NotFoundException('Burial record not found');
    return grave;
  }

  async create(graveData: any) {
    const uid = crypto.randomBytes(2).toString('hex').toUpperCase();
    const grave = this.graveRepository.create({ ...graveData, uid });
    return this.graveRepository.save(grave);
  }

  async update(id: string, graveData: any) {
    await this.graveRepository.update(id, graveData);
    return this.findById(id);
  }

  async delete(id: string) {
    const result = await this.graveRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException('Burial record not found');
    return { success: true };
  }
}
