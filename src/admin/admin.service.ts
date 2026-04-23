import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Plot } from '../entities/Plot.entity';
import { Grave } from '../entities/Grave.entity';
import { User } from '../entities/User.entity';
import { BurialRequest } from '../entities/BurialRequest.entity';
import { MaintenanceRequest } from '../entities/MaintenanceRequest.entity';
import { PlotReservation } from '../entities/PlotReservation.entity';
import { BurialSchedule } from '../entities/BurialSchedule.entity';

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
    @InjectRepository(BurialSchedule)
    private burialScheduleRepository: Repository<BurialSchedule>,
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

  async getBurialSchedule() {
    return this.burialScheduleRepository.find({
      relations: ['plot', 'requester'],
      order: { scheduled_date: 'ASC' },
    });
  }

  async getAllGrave() {
    return this.graveRepository.find({
      where: { is_delete: false },
      relations: ['plot'],
    });
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
      if (!graveData.uid) {
        graveData.uid = Math.random().toString(36).substring(2, 7).toUpperCase();
      }

      const grave = queryRunner.manager.create(Grave, graveData);
      const savedGrave = await queryRunner.manager.save(grave);

      // Update plot status
      if (graveData.plot_id) {
        await queryRunner.manager.update(Plot, graveData.plot_id, {
          status: 'occupied',
          updated_at: new Date(),
        });
      }

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

  async updateVisitor(id: string, visitorData: any) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Visitor not found');
    }

    // Sanitize or filter fields if necessary, but here we can update directly
    await this.userRepository.update(id, visitorData);
    return this.userRepository.findOne({ where: { id } });
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
    return await this.dataSource.transaction(async (manager) => {
      try {
        const request = await manager.findOne(BurialRequest, { where: { id } });
        if (!request) {
          throw new NotFoundException('Burial request not found');
        }

        // 1. Update plot status to occupied if plot_id exists
        if (request.plot_id) {
          await manager.update(Plot, request.plot_id, {
            status: 'occupied',
            updated_at: new Date(),
          });

          // 2. Clear any reservations for this plot
          await manager.delete(PlotReservation, { plot_id: request.plot_id });
        }

        // 3. Create Burial Schedule
        console.log('Attempting to save burial schedule for request:', request.id);

        const uid = Math.random().toString(36).substring(2, 7).toUpperCase();
        const burialSched = manager.create(BurialSchedule, {
          uid: uid,
          plot_id: request.plot_id || null,
          requester_id: request.requester_id || request.family_contact || null,
          deceased_name: request.deceased_name,
          scheduled_date: request.burial_date,
          birth_date: request.birth_date || null,
          death_date: request.death_date || null,
          status: 'pending',
        } as any);

        const savedSched = await manager.save(BurialSchedule, burialSched);
        console.log('Successfully saved burial schedule:', savedSched.id);

        // 4. Delete the burial request
        await manager.delete(BurialRequest, request.id);

        return { success: true, data: savedSched };
      } catch (error) {
        console.log('Error in confirmBurialRequestAsAdmin:', error);
        throw error; // Rethrow to trigger transaction rollback
      }
    }).catch(error => {
      console.error('Transaction failed:', error);
      return { success: false, data: error.message || error };
    });
  }

  async updateBurialScheduleStatus(id: string) {
    try {
      const schedule = await this.burialScheduleRepository.findOne({ where: { id } });
      if (!schedule) {
        throw new NotFoundException('Burial schedule not found');
      }

      if (schedule.plot_id) {
        await this.plotRepository.update(schedule.plot_id, {
          status: 'occupied',
          updated_at: new Date(),
        });
      }

      const uid = Math.random().toString(36).substring(2, 7).toUpperCase();
      const graveData = this.graveRepository.create({
        uid: uid,
        plot_id: schedule.plot_id,
        deceased_name: schedule.deceased_name,
        birth_date: schedule.birth_date,
        death_date: schedule.death_date,
        is_active: true,
        user_id: schedule.requester_id,
        burial_date: schedule.scheduled_date,
        created_at: new Date(),
        updated_at: new Date(),
      } as any);

      console.log('Saving grave data:', graveData);
      const savedGrave: any = await this.graveRepository.save(graveData);
      console.log('Saved grave:', savedGrave?.id);


      await this.burialScheduleRepository.delete(schedule.id);
      console.log('Deleted schedule:', schedule.id);

      return { success: true, data: savedGrave };
    } catch (error) {
      console.error('Error in updateBurialScheduleStatus:', error);
      return { success: false, error: error.message || error };
    }
  }
}
