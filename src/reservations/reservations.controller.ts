import { Controller, Get, Patch, Param, Body } from '@nestjs/common';
import { ReservationsService } from './reservations.service';

@Controller('api/admin')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Get('reservations')
  async getAllReservations() {
    return this.reservationsService.findAll();
  }

  @Patch('reservations/:id/reject')
  async rejectReservation(@Param('id') id: string) {
    return this.reservationsService.updateStatus(id, 'rejected');
  }

  @Patch('reservations/:id/approve')
  async approveReservation(@Param('id') id: string) {
    return this.reservationsService.updateStatus(id, 'approved');
  }

  @Patch('reservations/:id/approve-payment')
  async approvePayment(@Param('id') id: string) {
    return this.reservationsService.updateStatus(id, 'paid');
  }
}
