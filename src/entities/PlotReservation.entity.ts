import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Plot } from './Plot.entity';
import { User } from './User.entity';

@Entity('plot_reservations')
export class PlotReservation {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'char', length: 5, nullable: false })
  uid: string;

  @Column({ type: 'bigint', nullable: true })
  plot_id: string;

  @Column({ type: 'bigint', nullable: true })
  user_id: string;

  @Column({ type: 'text', nullable: true })
  status: string;

  @Column({ type: 'date', nullable: true })
  reservation_date: Date;

  @Column({ type: 'date', nullable: true })
  expiry_date: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true })
  payment_receipt_url: string;

  @Column({ type: 'text', nullable: true })
  payment_status: string;

  @Column({ type: 'timestamp', nullable: true })
  payment_uploaded_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  payment_validated_at: Date;

  @Column({ type: 'text', nullable: true })
  payment_validated_by: string;

  @Column({ type: 'timestamp', nullable: true })
  payment_approved_at: Date;

  @Column({ type: 'text', nullable: true })
  payment_approved_by: string;

  @Column({ type: 'text', nullable: true })
  applicant_name: string;

  @Column({ type: 'text', nullable: true })
  applicant_contact: string;

  @Column({ type: 'text', nullable: true })
  applicant_address: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @ManyToOne(() => Plot, (plot) => plot.reservations, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'plot_id' })
  plot: Plot;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
