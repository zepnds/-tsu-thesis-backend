import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoadPlot } from '../entities/RoadPlot.entity';
import { BuildingPlot } from '../entities/BuildingPlot.entity';

@Injectable()
export class InfrastructureService {
  constructor(
    @InjectRepository(RoadPlot)
    private roadRepository: Repository<RoadPlot>,
    @InjectRepository(BuildingPlot)
    private buildingRepository: Repository<BuildingPlot>,
  ) {}

  async getRoads() {
    return this.roadRepository.find();
  }

  async getBuildings() {
    return this.buildingRepository.find();
  }
}
