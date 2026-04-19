import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Plot } from './Plot.entity';

@Entity('graves')
export class Grave {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'char', length: 5, nullable: false })
  uid: string;

  @Column({ type: 'bigint', nullable: true })
  plot_id: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  deceased_name: string;

  @Column({ type: 'date', nullable: true })
  birth_date: Date;

  @Column({ type: 'date', nullable: true })
  death_date: Date;

  @Column({ type: 'date', nullable: true })
  burial_date: Date;

  @Column({ type: 'text', nullable: true })
  qr_token: string;

  @Column({ type: 'text', nullable: true })
  epitaph: string;

  @Column({ type: 'text', nullable: true })
  family_contact: string;

  @Column({ type: 'text', nullable: true })
  headstone_type: string;

  @Column({ type: 'text', nullable: true })
  memorial_text: string;

  @Column({ type: 'boolean', default: true, nullable: false })
  is_active: boolean;

  @Column({ type: 'text', nullable: true })
  photo_url: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @ManyToOne(() => Plot, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'plot_id' })
  plot: Plot;
}
