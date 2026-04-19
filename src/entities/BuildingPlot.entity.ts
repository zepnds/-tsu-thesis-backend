import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('building_plots')
export class BuildingPlot {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'char', length: 5, nullable: false })
  uid: string;

  @Column({ type: 'varchar', length: 80, nullable: false })
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

  @Column({ type: 'varchar', length: 30, default: 'available', nullable: false })
  status: string;

  @Column({
    type: 'geometry',
    spatialFeatureType: 'Geometry',
    srid: 4326,
    nullable: false,
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

  @Column({ type: 'text', nullable: true })
  plot_name: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
