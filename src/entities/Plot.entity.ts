import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { PlotReservation } from './PlotReservation.entity';

@Entity('plots')
export class Plot {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'char', length: 5, nullable: false })
  uid: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  plot_code: string;

  @Column({ type: 'bigint', nullable: true })
  section_id: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  section_name: string;

  @Column({ type: 'int', nullable: true })
  row_num: number;

  @Column({ type: 'int', nullable: true })
  col_num: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  plot_type: string;

  @Column({ type: 'numeric', nullable: true })
  size_sqm: number;

  @Column({ type: 'varchar', length: 30, default: 'available', nullable: true })
  status: string;

  @Column({
    type: 'geometry',
    spatialFeatureType: 'Polygon',
    srid: 4326,
    nullable: true,
  })
  coordinates: any;

  @Column({
    type: 'geometry',
    spatialFeatureType: 'Polygon',
    srid: 4326,
    nullable: true,
  })
  plot_boundary: any;

  @Column({ type: 'numeric', nullable: true })
  price: number;

  @Column({ type: 'varchar', length: 120, nullable: true })
  plot_name: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  kind: string;

  @Column({
    type: 'geometry',
    spatialFeatureType: 'Polygon',
    srid: 4326,
    nullable: true,
  })
  geom: any;

  @Column({ type: 'text', nullable: true })
  next_of_kin_name: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true })
  person_full_name: string;

  @Column({ type: 'timestamp', nullable: true })
  date_of_birth: Date;

  @Column({ type: 'timestamp', nullable: true })
  date_of_death: Date;

  @Column({ type: 'text', nullable: true })
  contact_phone: string;

  @Column({ type: 'text', nullable: true })
  contact_email: string;

  @Column({ type: 'text', nullable: true })
  photo_url: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @OneToMany(() => PlotReservation, (reservation) => reservation.plot)
  reservations: PlotReservation[];
}
