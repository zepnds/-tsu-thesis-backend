import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CemeteryInfo } from '../entities/CemeteryInfo.entity';

@Injectable()
export class CemeteryInfoService {
  constructor(
    @InjectRepository(CemeteryInfo)
    private infoRepository: Repository<CemeteryInfo>,
  ) {}

  async getLatest() {
    return this.infoRepository.findOne({
      where: {},
      order: { id: 'DESC' },
    });
  }

  async saveOrUpdate(updateData: any) {
    const latest = await this.getLatest();
    if (latest) {
      await this.infoRepository.update(latest.id, updateData);
      return this.infoRepository.findOne({ where: { id: latest.id } });
    } else {
      const newInfo = this.infoRepository.create(updateData);
      return this.infoRepository.save(newInfo);
    }
  }
}
