import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Plot } from './Plot.entity';
import { User } from './User.entity';

@Entity('maintenance_schedules')
export class MaintenanceSchedule {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'bigint', nullable: true })
  plot_id: string;

  @Column({ type: 'date', nullable: true })
  maintenance_date: Date;

  @Column({ type: 'text', nullable: true })
  status: string;

  @Column({ type: 'bigint', nullable: true })
  approved_by: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @ManyToOne(() => Plot, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'plot_id' })
  plot: Plot;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'approved_by' })
  user: User;
}
