import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

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

  @Column({ type: 'text', nullable: true })
  plot_id: string;

  @Column({ type: 'text', nullable: true })
  reservation_id: string;

  @Column({ type: 'text', nullable: true })
  grave_id: string;

  @Column({ type: 'timestamptz', nullable: true })
  confirmed_at: Date;

  @Column({ type: 'text', nullable: true })
  confirmed_by: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
