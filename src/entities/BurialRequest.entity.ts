import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Plot } from './Plot.entity';
import { Grave } from './Grave.entity';
import { PlotReservation } from './PlotReservation.entity';
import { User } from './User.entity';

@Entity('burial_requests')
export class BurialRequest {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'char', length: 5, nullable: false })
  uid: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  deceased_name: string;

  @Column({ type: 'date', nullable: false })
  birth_date: Date;

  @Column({ type: 'date', nullable: false })
  death_date: Date;

  @Column({ type: 'date', nullable: false })
  burial_date: Date;

  @Column({ type: 'bigint', nullable: true })
  family_contact: string;

  @Column({ type: 'varchar', length: 20, default: 'pending', nullable: true })
  status: string;

  @Column({ type: 'bigint', nullable: true })
  plot_id: string;

  @Column({ type: 'bigint', nullable: true })
  reservation_id: string;

  @Column({ type: 'bigint', nullable: true })
  grave_id: string;

  @Column({ type: 'timestamptz', nullable: true })
  confirmed_at: Date;

  @Column({ type: 'text', nullable: true })
  confirmed_by: string;

  @Column({ type: 'text', nullable: true })
  death_certificate_url: string;

  @Column({ type: 'bigint', nullable: true })
  requester_id: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @ManyToOne(() => Plot, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'plot_id' })
  plot: Plot;

  @ManyToOne(() => Grave, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'grave_id' })
  grave: Grave;

  @ManyToOne(() => PlotReservation, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'reservation_id' })
  reservation: PlotReservation;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'requester_id' })
  requester: User;
}
