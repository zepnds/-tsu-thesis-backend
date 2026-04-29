import { Injectable, InternalServerErrorException, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Plot } from '../entities/Plot.entity';
import { Grave } from '../entities/Grave.entity';
import { User } from '../entities/User.entity';
import { BurialRequest } from '../entities/BurialRequest.entity';
import { MaintenanceRequest } from '../entities/MaintenanceRequest.entity';
import { PlotReservation } from '../entities/PlotReservation.entity';
import { BurialSchedule } from '../entities/BurialSchedule.entity';
import { MailingService } from '../library/mailing/mailing.service';

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
    private mailingService: MailingService,
  ) { }

  async onModuleInit() {
    try {
      console.log('--- Running manual migration: ALTER TABLE burial_requests ADD COLUMN IF NOT EXISTS burial_time text ---');
      await this.dataSource.query(`ALTER TABLE burial_requests ADD COLUMN IF NOT EXISTS burial_time text;`);

      console.log('--- Running manual migration: ALTER TABLE burial_schedules ADD COLUMN IF NOT EXISTS scheduled_time text ---');
      await this.dataSource.query(`ALTER TABLE burial_schedules ADD COLUMN IF NOT EXISTS scheduled_time text;`);

      console.log('--- Running manual migration: ALTER TABLE graves ADD COLUMN IF NOT EXISTS burial_time text ---');
      await this.dataSource.query(`ALTER TABLE graves ADD COLUMN IF NOT EXISTS burial_time text;`);

      console.log('--- Running manual migration: ALTER TABLE users ADD COLUMN IF NOT EXISTS is_delete boolean DEFAULT false ---');
      await this.dataSource.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_delete boolean DEFAULT false;`);

      console.log('--- Migration successful ---');
    } catch (error) {
      console.warn('--- Migration skipped or failed:', error.message, '---');
    }
  }

  async getDashboardMetrics() {
    // --- counts ---
    const [totalDeceased, totalVisitors, pendingBurials, activeMaintenance, totalPlots, availablePlots] =
      await Promise.all([
        this.graveRepository.count({ where: { is_delete: false } }),
        this.userRepository.count({ where: { role: 'visitor', is_delete: false } }),
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
    return this.burialScheduleRepository.find();
  }

  async getAllGrave() {
    return this.graveRepository.find({
      where: { is_delete: false },
      relations: ['plot'],
    });
  }

  async getAllBurialRecords() {
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
    if (plotData.burial_date !== undefined) graveFieldsToUpdate.burial_date = plotData.burial_date;
    if (plotData.burial_time !== undefined) graveFieldsToUpdate.burial_time = plotData.burial_time;
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
    return this.userRepository.find({ where: { role: 'visitor', is_delete: false } });
  }

  async deleteVisitor(id: string) {
    const user = await this.userRepository.findOne({ where: { id, role: 'visitor' } });
    if (!user) {
      throw new NotFoundException('Visitor not found');
    }
    await this.userRepository.update(id, { is_delete: true, is_active: false });
    return { success: true, message: 'Visitor soft-deleted successfully' };
  }

  async updateVisitor(id: string, visitorData: any) {
    const user = await this.userRepository.findOne({ where: { id, is_delete: false } });
    if (!user) {
      throw new NotFoundException('Visitor not found');
    }

    // Sanitize or filter fields if necessary, but here we can update directly
    await this.userRepository.update(id, visitorData);
    return this.userRepository.findOne({ where: { id, is_delete: false } });
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
      relations: ['plot', 'requester', 'assigned_staff'],
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
    const reservation = await this.plotReservationRepository.findOne({
      where: { id },
      relations: ['user', 'plot']
    });
    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    reservation.status = 'approved';
    reservation.updated_at = new Date();

    await this.plotReservationRepository.save(reservation);

    if (reservation && reservation.user && reservation.user.email) {
      const subject = 'Plot Reservation Approved';
      const plotInfo = reservation.plot_id ? ` for Plot ${reservation.plot_id}` : '';
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #2d3748;">Reservation Approved</h2>
          <p>Hello <strong>${reservation.user.username}</strong>,</p>
          <p>We are pleased to inform you that your plot reservation request${plotInfo} has been <strong>approved</strong>.</p>
          <p><strong>Reservation Details:</strong></p>
          <ul>
            <li><strong>UID:</strong> ${reservation.uid}</li>
            <li><strong>Status:</strong> Approved</li>
            <li><strong>Date:</strong> ${new Date().toLocaleDateString()}</li>
          </ul>
          <p>Thank you for using our service.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #718096;">This is an automated message, please do not reply.</p>
        </div>
      `;
      try {
        await this.mailingService.sendEmail(reservation.user.email, subject, htmlContent);
      } catch (error) {
        console.error('Failed to send reservation approval email:', error);
      }
    }

    return { success: true, data: reservation };
  }

  async confirmBurialRequestAsAdmin(id: string) {
    return await this.dataSource.transaction(async (manager) => {
      try {
        const request = await manager.findOne(BurialRequest, {
          where: { id },
          relations: ['requester', 'plot']
        });
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
          requester_id: request.requester_id,
          deceased_name: request.deceased_name,
          plot_id: request.plot_id || null,
          scheduled_date: request.burial_date,
          scheduled_time: request.burial_time || null,
          birth_date: request.birth_date || null,
          death_date: request.death_date || null,
          status: 'pending',
        } as any);

        const savedSched = await manager.save(BurialSchedule, burialSched);
        console.log('Successfully saved burial schedule:', savedSched.id);

        // 4. Delete the burial request
        const requesterInfo = request.requester;
        const plotInfo = request.plot_id;
        await manager.delete(BurialRequest, request.id);

        console.log("plotInfo", plotInfo)

        // 5. Send email notification (After deletion is fine as we have the info)
        if (requesterInfo && requesterInfo.email) {
          const subject = 'Burial Request Confirmed';
          const plotText = plotInfo ? ` for Plot ${plotInfo}` : '';
          const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #2d3748;">Burial Request Confirmed</h2>
              <p>Hello <strong>${requesterInfo.username}</strong>,</p>
              <p>Your burial request for <strong>${request.deceased_name}</strong>${plotText} has been <strong>confirmed</strong> and scheduled.</p>
              <p><strong>Request Details:</strong></p>
              <ul>
                <li><strong>Deceased:</strong> ${request.deceased_name}</li>
                <li><strong>Scheduled Date:</strong> ${new Date(request.burial_date).toLocaleDateString()}</li>
                <li><strong>Scheduled Time:</strong> ${request.burial_time || 'TBD'}</li>
                <li><strong>Status:</strong> Confirmed (Scheduled)</li>
              </ul>
              <p>A burial schedule has been created. You can view the details in your dashboard.</p>
              <p style="background-color: #fffaf0; padding: 10px; border-left: 4px solid #ed8936;">
                <strong>Note:</strong> Please also apply for your plot reservation to finalize the process.
              </p>
              <p>Thank you for using our service.</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
              <p style="font-size: 12px; color: #718096;">This is an automated message, please do not reply.</p>
            </div>
          `;
          try {
            await this.mailingService.sendEmail(requesterInfo.email, subject, htmlContent);
          } catch (err) {
            console.error('Failed to send burial confirmation email:', err);
          }
        }

        return { success: true, data: savedSched };
      } catch (error) {
        console.log('Error in confirmBurialRequestAsAdmin:', error);
        throw error; // Rethrow to trigger transaction rollback
      }
    }).then(async (result) => {
      return result;
    }).catch(error => {
      console.error('Transaction failed:', error);
      return { success: false, data: error.message || error };
    });
  }

  async updateBurialScheduleStatus(id: string) {
    return await this.dataSource.transaction(async (manager) => {
      try {
        const schedule = await manager.findOne(BurialSchedule, {
          where: { id },
          relations: ['requester', 'plot']
        });
        if (!schedule) {
          throw new NotFoundException('Burial schedule not found');
        }

        if (schedule.plot_id) {
          await manager.update(Plot, schedule.plot_id, {
            status: 'occupied',
            updated_at: new Date(),
          });
        }

        const uid = Math.random().toString(36).substring(2, 7).toUpperCase();
        const grave = manager.create(Grave, {
          uid: uid,
          plot_id: schedule.plot_id,
          deceased_name: schedule.deceased_name,
          birth_date: schedule.birth_date,
          death_date: schedule.death_date,
          burial_date: schedule.scheduled_date,
          burial_time: schedule.scheduled_time,
          is_active: true,
          userId: schedule.requester_id, // Match Grave entity property 'userId'
          created_at: new Date(),
          updated_at: new Date(),
        });

        console.log('Saving grave data:', grave);
        const savedGrave = await manager.save(Grave, grave);
        console.log('Saved grave ID:', savedGrave.id);

        await manager.delete(BurialSchedule, id);
        console.log('Deleted schedule ID:', id);

        // Send email notification
        if (schedule.requester && schedule.requester.email) {
          const subject = 'Burial Service Completed';
          const plotText = schedule.plot ? ` for Plot ${schedule.plot.plot_code}` : '';
          const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #2d3748;">Burial Service Completed</h2>
              <p>Hello <strong>${schedule.requester.username}</strong>,</p>
              <p>The burial service for <strong>${schedule.deceased_name}</strong>${plotText} has been successfully <strong>completed</strong> and recorded in our system.</p>
              <p><strong>Service Details:</strong></p>
              <ul>
                <li><strong>Deceased:</strong> ${schedule.deceased_name}</li>
                <li><strong>Date:</strong> ${new Date(schedule.scheduled_date).toLocaleDateString()}</li>
                <li><strong>Time:</strong> ${schedule.scheduled_time || 'N/A'}</li>
                <li><strong>Status:</strong> Completed</li>
              </ul>
              <p>You can now view the burial record and access the digital memorial in your dashboard.</p>
              <p>Thank you for using our service.</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
              <p style="font-size: 12px; color: #718096;">This is an automated message, please do not reply.</p>
            </div>
          `;
          try {
            await this.mailingService.sendEmail(schedule.requester.email, subject, htmlContent);
          } catch (err) {
            console.error('Failed to send burial completion email:', err);
          }
        }

        return { success: true, data: savedGrave };
      } catch (error) {
        console.error('Error in updateBurialScheduleStatus transaction:', error);
        throw error; // Rethrow to rollback
      }
    }).catch(error => {
      console.error('Transaction failed:', error);
      return { success: false, error: error.message || error };
    });
  }

  async rejectReservationAsAdmin(id: string) {
    const reservation = await this.plotReservationRepository.findOne({
      where: { id },
      relations: ['user', 'plot']
    });
    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    reservation.status = 'rejected';
    reservation.updated_at = new Date();

    await this.plotReservationRepository.save(reservation);

    if (reservation.user?.email) {
      const subject = 'Plot Reservation Update';
      const plotInfo = reservation.plot_id ? ` for Plot ${reservation.plot_id}` : '';
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #2d3748;">Reservation Request Disapproved</h2>
          <p>Hello <strong>${reservation.user.username}</strong>,</p>
          <p>We regret to inform you that your plot reservation request${plotInfo} has been <strong>rejected/disapproved</strong>.</p>
          <p>Please contact the cemetery office for more details.</p>
          <p>Thank you.</p>
        </div>
      `;
      try {
        await this.mailingService.sendEmail(reservation.user.email, subject, htmlContent);
      } catch (error) {
        console.error('Failed to send reservation rejection email:', error);
      }
    }

    return { success: true, data: reservation };
  }

  async rejectBurialRequestAsAdmin(id: string) {
    const request = await this.burialRequestRepository.findOne({
      where: { id },
      relations: ['requester', 'plot']
    });
    if (!request) {
      throw new NotFoundException('Burial request not found');
    }

    request.status = 'rejected';
    request.updated_at = new Date();

    await this.burialRequestRepository.save(request);

    if (request.requester?.email) {
      const subject = 'Burial Request Update';
      const plotText = request.plot_id ? ` for Plot ${request.plot_id}` : '';
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #2d3748;">Burial Request Disapproved</h2>
          <p>Hello <strong>${request.requester.username}</strong>,</p>
          <p>We regret to inform you that your burial request for <strong>${request.deceased_name}</strong>${plotText} has been <strong>rejected/disapproved</strong>.</p>
          <p>Please contact the cemetery office for further assistance.</p>
          <p>Thank you.</p>
        </div>
      `;
      try {
        await this.mailingService.sendEmail(request.requester.email, subject, htmlContent);
      } catch (err) {
        console.error('Failed to send burial rejection email:', err);
      }
    }

    return { success: true, data: request };
  }
}
