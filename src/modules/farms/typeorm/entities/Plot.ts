import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import Farm from './Farm';

@Entity('plots')
class Plot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  farm_id: string;

  @ManyToOne(() => Farm, farm => farm.plots, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'farm_id' })
  farm: Farm;

  @Column()
  name: string;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  area: number;

  @Column({ default: 'Ativo' })
  status: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  registration: string;

  @Column({ nullable: true })
  lot: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

export default Plot;
