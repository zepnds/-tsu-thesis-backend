import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import * as crypto from 'crypto';
import { Plot } from '../entities/Plot.entity';
import { PlotReservation } from '../entities/PlotReservation.entity';
import { Grave } from '../entities/Grave.entity';
import { BurialRequest } from '../entities/BurialRequest.entity';
import { MaintenanceRequest } from '../entities/MaintenanceRequest.entity';

@Injectable()
export class VisitorService {
  constructor(
    @InjectRepository(Plot)
    private plotRepository: Repository<Plot>,
    @InjectRepository(PlotReservation)
    private reservationRepository: Repository<PlotReservation>,
    @InjectRepository(Grave)
    private graveRepository: Repository<Grave>,
    @InjectRepository(BurialRequest)
    private burialRequestRepository: Repository<BurialRequest>,
    @InjectRepository(MaintenanceRequest)
    private maintenanceRequestRepository: Repository<MaintenanceRequest>,
  ) { }

  async getBurialRecords(options: { search?: string; limit?: number; offset?: number } = {}) {
    const findOptions: any = {
      relations: ['plot'],
      order: { deceased_name: 'ASC' },
    };

    if (options.search) {
      findOptions.where = {
        deceased_name: ILike(`%${options.search}%`),
      };
    }

    if (options.limit !== undefined && !isNaN(options.limit)) {
      findOptions.take = options.limit;
    }

    if (options.offset !== undefined && !isNaN(options.offset)) {
      findOptions.skip = options.offset;
    }

    return this.graveRepository.find(findOptions);
  }

  async reservePlot(userId: string, plotId: string, reservationData: any) {
    const plot = await this.plotRepository.findOne({ where: { id: plotId } });

    if (!plot) {
      throw new NotFoundException('Plot not found');
    }

    if (plot.status !== 'available') {
      throw new ConflictException(`Plot is already ${plot.status}`);
    }

    // Generate 4-character UID (matches our 5-char limit fix)
    const uid = crypto.randomBytes(2).toString('hex').toUpperCase();

    const newReservation = this.reservationRepository.create({
      ...reservationData,
      uid,
      user_id: userId,
      plot_id: plotId,
      status: 'pending',
    });

    // Update plot status
    plot.status = 'reserved';
    await this.plotRepository.save(plot);

    return this.reservationRepository.save(newReservation);
  }

  async getMyReservations(userId: string) {
    return this.reservationRepository.find({
      where: { user_id: userId },
      relations: ['plot'],
    });
  }

  async createBurialRequest(userId: string, requestData: any) {
    const uid = crypto.randomBytes(2).toString('hex').toUpperCase();
    const newRequest = this.burialRequestRepository.create({
      ...requestData,
      uid,
      family_contact: userId,
      status: 'pending',
    });
    return this.burialRequestRepository.save(newRequest);
  }

  async getMyBurialRequests(userId: string) {
    return this.burialRequestRepository.find({
      where: { family_contact: userId },
      order: { created_at: 'DESC' },
    });
  }

  async getMyDeceasedFamily(userId: string) {
    return this.graveRepository.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });
  }

  async getMyDeceasedFamilyPlot(userId: string, plotId: string) {
    return this.graveRepository.find({
      where: { user_id: userId, plot_id: plotId },
      order: { created_at: 'DESC' },
    });
  }

  async createMaintenanceRequest(userId: string, requestData: any) {
    const uid = crypto.randomBytes(2).toString('hex').toUpperCase();

    // Fallback: extract plot_id from description if missing in payload
    if (!requestData.plot_id && requestData.description) {
      const match = requestData.description.match(/Linked plot ID: (\d+)/i);
      if (match && match[1]) {
        requestData.plot_id = match[1];
      }
    }

    // Ensure empty strings are treated as null for IDs
    if (requestData.plot_id === '') requestData.plot_id = null;
    if (requestData.grave_id === '') requestData.grave_id = null;

    const newRequest = this.maintenanceRequestRepository.create({
      ...requestData,
      uid,
      requester_id: userId,
      request_type: requestData.request_type || 'Maintenance',
      status: 'pending',
    });

    return this.maintenanceRequestRepository.save(newRequest);
  }

  async getMyMaintenanceRequests(userId: string) {
    return this.maintenanceRequestRepository.find({
      where: { requester_id: userId },
      relations: ['plot', 'grave', 'infrastructure'],
      order: { created_at: 'DESC' },
    });
  }
}
