import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BurialRequest } from '../entities/BurialRequest.entity';

@Injectable()
export class BurialRequestsService {
  constructor(
    @InjectRepository(BurialRequest)
    private burialRequestRepository: Repository<BurialRequest>,
  ) {}

  async getByContact(familyContact: string) {
    return this.burialRequestRepository.find({
      where: { family_contact: familyContact },
      relations: ['plot'],
    });
  }
}
