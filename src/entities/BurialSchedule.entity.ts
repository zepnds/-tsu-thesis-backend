import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Plot } from './Plot.entity';
import { User } from './User.entity';

@Entity('burial_schedules')
export class BurialSchedule {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'char', length: 5, nullable: false })
  uid: string;

  @Column({ type: 'bigint', nullable: true })
  plot_id: string;

  @Column({ type: 'bigint', nullable: true })
  requester_id: string;

  @Column({ type: 'text', nullable: true })
  deceased_name: string;

  @Column({ type: 'date', nullable: true })
  scheduled_date: Date;

  @Column({ type: 'text', nullable: true })
  scheduled_time: string;

  @Column({ type: 'text', nullable: true })
  status: string;

  @Column({ type: 'text', nullable: true })
  burial_type: string;

  @Column({ type: 'text', nullable: true })
  special_requirements: string;

  @Column({ type: 'text', nullable: true })
  approved_by: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @ManyToOne(() => Plot, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'plot_id' })
  plot: Plot;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'requester_id' })
  requester: User;
}
