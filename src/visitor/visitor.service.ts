import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { ApiResponse } from '../common/dto/response.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, Brackets } from 'typeorm';
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
    const plot = await this.plotRepository.createQueryBuilder('plot')
      .where('plot.id = :plotId::bigint', { plotId })
      .getOne();

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

    const savedReservation = await this.reservationRepository.save(newReservation);
    return ApiResponse.success('Plot reserved successfully', savedReservation);
  }

  async getMyReservations(userId: string) {
    return this.reservationRepository.createQueryBuilder('reservation')
      .leftJoinAndSelect('reservation.plot', 'plot')
      .where('reservation.user_id = :userId::bigint', { userId })
      .getMany();
  }

  async getAllGraves(options: { search?: string; limit?: number; offset?: number } = {}) {
    const { search, limit, offset } = options;
    const findOptions: any = {
      relations: ['plot'],
      order: { deceased_name: 'ASC' },
      take: limit,
      skip: offset,
    };

    if (search) {
      findOptions.where = {
        deceased_name: ILike(`%${search}%`),
      };
    }

    return this.graveRepository.find(findOptions);
  }

  async createBurialRequest(userId: string, requestData: any) {
    const uid = crypto.randomBytes(2).toString('hex').toUpperCase();

    // Ensure empty strings are treated as null for IDs
    if (requestData.plot_id === '') requestData.plot_id = null;
    if (requestData.grave_id === '') requestData.grave_id = null;
    if (requestData.reservation_id === '') requestData.reservation_id = null;

    if (requestData.plot_id) {
      const brequest = await this.burialRequestRepository.createQueryBuilder('burial')
        .where('burial.plot_id = :plotId::bigint', { plotId: requestData.plot_id })
        .getOne();
      const plotRequest = await this.reservationRepository.createQueryBuilder('reservation')
        .where('reservation.plot_id = :plotId::bigint', { plotId: requestData.plot_id })
        .andWhere('reservation.user_id = :userId::bigint', { userId })
        .getOne();
      if (!plotRequest) {
        return ApiResponse.error('You have no reservation for the selected plot id', 409);
      }
      if (brequest) {
        return ApiResponse.error('You have pending burial requests for the selected plot id', 409);
      }
    }

    const newRequest = this.burialRequestRepository.create({
      ...requestData,
      uid,
      family_contact: userId,
      requester_id: userId,
      status: 'pending',
    });
    const savedRequest = await this.burialRequestRepository.save(newRequest);
    return ApiResponse.success('Burial request created successfully', savedRequest);


  }

  async getMyBurialRequests(userId: string) {
    return this.burialRequestRepository.createQueryBuilder('burial')
      .leftJoinAndSelect('burial.plot', 'plot')
      .where('burial.family_contact = :userId::bigint', { userId })
      .orderBy('burial.created_at', 'DESC')
      .getMany();
  }

  async updateBurialRequestDeathCert(id: string, url: string) {
    const request = await this.burialRequestRepository.findOne({ where: { id: id as any } });
    if (!request) {
      throw new NotFoundException('Burial request not found');
    }
    request.death_certificate_url = url;
    return this.burialRequestRepository.save(request);
  }

  async getMyDeceasedFamily(userId: string) {
    try {
      const results = await this.graveRepository.createQueryBuilder('grave')
        .leftJoinAndSelect('grave.plot', 'plot')
        .where('grave.user_id = :userId::bigint', { userId })
        .getMany();

      return results;
    } catch (error) {
      console.error('--- Error in getMyDeceasedFamily:', error, '---');
      throw error;
    }
  }

  async getMyDeceasedFamilyPlot(userId: string, search: string) {
    const qb = this.graveRepository.createQueryBuilder('grave')
      .leftJoinAndSelect('grave.plot', 'plot')
      .orderBy('grave.deceased_name', 'ASC');

    if (search) {
      const isNumeric = /^\d+$/.test(search);
      qb.andWhere(new Brackets(innerQb => {
        innerQb.where('grave.deceased_name ILIKE :search', { search: `%${search}%` })
          .orWhere('plot.plot_code ILIKE :search', { search: `%${search}%` })
          .orWhere('plot.plot_name ILIKE :search', { search: `%${search}%` });
        
        if (isNumeric) {
          innerQb.orWhere('grave.plot_id = :plotId::bigint', { plotId: search });
        }
      }));
    } else {
      qb.andWhere('grave.user_id = :userId::bigint', { userId });
    }

    return qb.getMany();
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

    const plots = await this.plotRepository.findOne({
      where: { id: requestData.plot_id }
    });

    if (plots?.status === "available") {
      return ApiResponse.error('Invalid maintenance request: Plot is not yet occupied', 403);
    }

    const graveExist = await this.graveRepository.findOne({
      where: { plot_id: requestData.plot_id, userId: userId }
    });

    const graveRequestExist = await this.maintenanceRequestRepository.findOne({
      where: { plot_id: requestData.plot_id, requester_id: userId, status: "pending" }
    })

    if (graveRequestExist) {
      return ApiResponse.error(`Invalid maintenance request: You have pending maintenance requests for the selected plot id: ${requestData.plot_id}`, 403);
    }

    if (!graveExist) {
      return ApiResponse.error('Invalid maintenance request: Grave does not belong to you', 403);
    } else {
      const newRequest = this.maintenanceRequestRepository.create({
        ...requestData,
        uid,
        requester_id: userId,
        request_type: requestData.request_type || 'Maintenance',
        status: 'pending',
      });

      const savedRequest = await this.maintenanceRequestRepository.save(newRequest);
      return ApiResponse.success('Maintenance request created successfully', savedRequest);
    }


  }

  async getMyMaintenanceRequests(userId: string) {
    return this.maintenanceRequestRepository.createQueryBuilder('maintenance')
      .leftJoinAndSelect('maintenance.plot', 'plot')
      .leftJoinAndSelect('maintenance.grave', 'grave')
      .leftJoinAndSelect('maintenance.infrastructure', 'infrastructure')
      .where('maintenance.requester_id = :userId::bigint', { userId })
      .orderBy('maintenance.created_at', 'DESC')
      .getMany();
  }
}
