import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Plot } from '../entities/Plot.entity';
import { Grave } from '../entities/Grave.entity';
import { User } from '../entities/User.entity';
import { BurialRequest } from '../entities/BurialRequest.entity';
import { MaintenanceRequest } from '../entities/MaintenanceRequest.entity';
import { PlotReservation } from '../entities/PlotReservation.entity';

@Injectable()
export class AdminService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(Plot)
    private plotRepository: Repository<Plot>,
    @InjectRepository(Grave)
    private graveRepository: Repository<Grave>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(BurialRequest)
    private burialRequestRepository: Repository<BurialRequest>,
    @InjectRepository(MaintenanceRequest)
    private maintenanceRequestRepository: Repository<MaintenanceRequest>,
    @InjectRepository(PlotReservation)
    private plotReservationRepository: Repository<PlotReservation>,
  ) { }

  async getDashboardMetrics() {
    // --- counts ---
    const [totalDeceased, totalVisitors, pendingBurials, activeMaintenance, totalPlots, availablePlots] =
      await Promise.all([
        this.graveRepository.count(),
        this.userRepository.count({ where: { role: 'visitor' } }),
        this.burialRequestRepository.count({ where: { status: 'pending' } }),
        this.maintenanceRequestRepository.count({ where: { status: 'pending' } }),
        this.plotRepository.count(),
        this.plotRepository.count({ where: { status: 'available' } }),
      ]);

    // --- plot_stats: [ { status, count } ] ---
    const plotStatsRaw: { status: string; count: string }[] = await this.dataSource.query(
      `SELECT status, COUNT(*)::int AS count FROM plots GROUP BY status ORDER BY status`,
    );
    const plot_stats = plotStatsRaw.map((r) => ({ status: r.status, count: Number(r.count) }));

    // --- upcoming burial requests joined with plot_code ---
    const burialRows: any[] = await this.dataSource.query(`
      SELECT br.id, br.deceased_name, br.burial_date AS scheduled_date, NULL AS scheduled_time,
             p.plot_code, br.status
      FROM burial_requests br
      LEFT JOIN plots p ON p.id = br.plot_id::bigint
      ORDER BY br.burial_date ASC
    `);

    const upcoming_approved = burialRows
      .filter((r) => ['approved', 'confirmed'].includes(String(r.status || '').toLowerCase()));
    const upcoming_pending = burialRows
      .filter((r) => String(r.status || '').toLowerCase() === 'pending');

    // --- recent_maintenance with requester_name ---
    const recent_maintenance: any[] = await this.dataSource.query(`
      SELECT mr.id, mr.request_type, mr.category, mr.priority, mr.status, mr.created_at,
             u.username AS requester_name
      FROM maintenance_requests mr
      LEFT JOIN users u ON u.id = mr.requester_id::bigint
      ORDER BY mr.created_at DESC
      LIMIT 10
    `);

    return {
      counts: {
        total_deceased: totalDeceased,
        total_visitors: totalVisitors,
        pending_burials: pendingBurials,
        active_maintenance: activeMaintenance,
        total_plots: totalPlots,
        available_plots: availablePlots,
      },
      plot_stats,
      upcoming_approved,
      upcoming_pending,
      recent_maintenance,
    };
  }

  async getAllGrave() {
    return this.graveRepository.find({ where: { is_delete: false } });
  }

  async addPlot(plotData: any) {
    const plot = this.plotRepository.create(plotData);
    return this.plotRepository.save(plot);
  }

  async getPlotDetails(id: string) {
    const plot = await this.plotRepository.findOne({ where: { id } });
    if (!plot) {
      throw new NotFoundException('Plot not found');
    }
    const grave = await this.graveRepository.findOne({ where: { plot_id: id, is_delete: false } });
    return { plot, grave };
  }

  async editPlot(id: string, plotData: any) {
    const allowedPlotFields = [
      'uid', 'plot_code', 'section_id', 'section_name', 'row_num', 'col_num',
      'plot_type', 'size_sqm', 'status', 'coordinates', 'plot_boundary',
      'price', 'plot_name', 'kind', 'geom', 'next_of_kin_name', 'notes'
    ];

    const sanitizedPlotData: any = {};
    for (const key of allowedPlotFields) {
      if (plotData[key] !== undefined) {
        sanitizedPlotData[key] = plotData[key];
      }
    }

    if (Object.keys(sanitizedPlotData).length > 0) {
      await this.plotRepository.update(id, sanitizedPlotData);
    }

    // Also update grave if fields like person_full_name are provided
    const graveFieldsToUpdate: any = {};
    if (plotData.person_full_name !== undefined) graveFieldsToUpdate.deceased_name = plotData.person_full_name;
    if (plotData.date_of_birth !== undefined) graveFieldsToUpdate.birth_date = plotData.date_of_birth;
    if (plotData.date_of_death !== undefined) graveFieldsToUpdate.death_date = plotData.date_of_death;
    if (plotData.qr_token !== undefined) graveFieldsToUpdate.qr_token = plotData.qr_token;

    if (Object.keys(graveFieldsToUpdate).length > 0) {
      await this.graveRepository.update({ plot_id: id }, graveFieldsToUpdate);
    }

    return this.getPlotDetails(id);
  }

  async deletePlot(id: string) {
    const plot = await this.plotRepository.findOne({ where: { id } });
    if (!plot) {
      throw new NotFoundException('Plot not found');
    }
    const grave = await this.graveRepository.findOne({ where: { plot_id: id, is_delete: false } });
    if (grave) {
      await this.graveRepository.update(grave.id, { is_delete: true });
    }
    return await this.plotRepository.update(id, { status: 'available', updated_at: new Date() });
  }

  async addBurialRecord(graveData: any) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const grave = queryRunner.manager.create(Grave, graveData);
      const savedGrave = await queryRunner.manager.save(grave);

      // Update plot status
      await queryRunner.manager.update(Plot, graveData.plot_id, {
        status: 'occupied',
        updated_at: new Date(),
      });

      await queryRunner.commitTransaction();
      return savedGrave;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(err.message);
    } finally {
      await queryRunner.release();
    }
  }

  async getVisitors() {
    return this.userRepository.find({ where: { role: 'visitor' } });
  }

  async getPlots() {
    return this.plotRepository.find();
  }

  async getBurialRequests() {
    return this.burialRequestRepository.find({
      order: { created_at: 'DESC' },
    });
  }

  async getMaintenanceRequests() {
    return this.maintenanceRequestRepository.find({
      order: { created_at: 'DESC' },
    });
  }

  async getReservations() {
    return this.plotReservationRepository.find({
      relations: ['plot', 'user'],
      order: { created_at: 'DESC' },
    });
  }

  async approveReservationAsAdmin(id: string) {
    const reservation = await this.plotReservationRepository.findOne({ where: { id } });
    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    reservation.status = 'approved';
    reservation.updated_at = new Date();

    await this.plotReservationRepository.save(reservation);

    return { success: true, data: reservation };
  }

  async confirmBurialRequestAsAdmin(id: string) {
    try {
      const request = await this.burialRequestRepository.findOne({ where: { id } });
      if (!request) {
        throw new NotFoundException('Burial request not found');
      }

      request.status = 'approved';
      request.updated_at = new Date();

      await this.plotRepository.update(request.plot_id, {
        status: 'occupied',
        updated_at: new Date(),
      });

      await this.plotReservationRepository.delete({ plot_id: request.plot_id });

      await this.burialRequestRepository.delete(request.id);

      const uid = Math.random().toString(36).substring(2, 7).toUpperCase();
      const graveToSave = this.graveRepository.create({
        uid: uid,
        plot_id: request.plot_id,
        deceased_name: request.deceased_name,
        birth_date: request.birth_date,
        death_date: request.death_date,
        burial_date: request.burial_date,
        family_contact: request.family_contact ? request.family_contact.toString() : undefined,
      });
      const grave = await this.graveRepository.save(graveToSave);

      return { success: true, data: grave };
    } catch (error) {
      console.log(error);
      return { success: false, data: error };
    }
  }
}
