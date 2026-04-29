import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'char', length: 5, nullable: false })
  uid: string;

  @Column({ type: 'varchar', length: 80, unique: true, nullable: false })
  username: string;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: false })
  email: string;

  @Column({ type: 'text', nullable: true, select: false })
  password_hash: string;

  @Column({ type: 'text', nullable: true, select: false })
  password_str: string;

  @Column({ type: 'varchar', length: 20, default: 'visitor', nullable: false })
  role: string;

  @Column({ type: 'varchar', length: 120, nullable: false })
  first_name: string;

  @Column({ type: 'varchar', length: 120, nullable: false })
  last_name: string;

  @Column({ type: 'varchar', length: 60, nullable: true })
  phone: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ type: 'boolean', default: true, nullable: false })
  is_active: boolean;

  @Column({ type: 'boolean', default: false, nullable: false })
  is_delete: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
