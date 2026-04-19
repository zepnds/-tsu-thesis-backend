import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Plot } from './Plot.entity';
import { Grave } from './Grave.entity';
import { User } from './User.entity';
import { CemeteryInfrastructure } from './CemeteryInfrastructure.entity';

@Entity('maintenance_requests')
export class MaintenanceRequest {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'char', length: 5, nullable: false })
  uid: string;

  @Column({ type: 'bigint', nullable: true })
  plot_id: string;

  @Column({ type: 'bigint', nullable: true })
  grave_id: string;

  @Column({ type: 'bigint', nullable: true })
  infrastructure_id: string;

  @Column({ type: 'bigint', nullable: true })
  requester_id: string;

  @Column({ type: 'bigint', nullable: true })
  assigned_staff_id: string;

  @Column({ type: 'text', nullable: true })
  request_type: string;

  @Column({ type: 'text', nullable: true })
  category: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  priority: string;

  @Column({ type: 'text', nullable: true })
  status: string;

  @Column({ type: 'numeric', nullable: true })
  estimated_cost: number;

  @Column({ type: 'numeric', nullable: true })
  actual_cost: number;

  @Column({ type: 'jsonb', nullable: true })
  photos: any;

  @Column({ type: 'timestamp', nullable: true })
  completed_at: Date;

  @Column({ type: 'text', nullable: true })
  deceased_name: string;

  @Column({ type: 'text', nullable: true })
  family_contact: string;

  @Column({ type: 'date', nullable: true })
  preferred_date: Date;

  @Column({ type: 'text', nullable: true })
  preferred_time: string;

  @Column({ type: 'date', nullable: true })
  scheduled_date: Date;

  @Column({ type: 'text', nullable: true })
  scheduled_time: string;

  @Column({ type: 'text', nullable: true })
  scheduled_by: string;

  @Column({ type: 'text', nullable: true })
  completion_notes: string;

  @Column({ type: 'int', nullable: true })
  feedback_rating: number;

  @Column({ type: 'text', nullable: true })
  feedback_text: string;

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

  @ManyToOne(() => CemeteryInfrastructure, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'infrastructure_id' })
  infrastructure: CemeteryInfrastructure;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'requester_id' })
  requester: User;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assigned_staff_id' })
  assigned_staff: User;
}
