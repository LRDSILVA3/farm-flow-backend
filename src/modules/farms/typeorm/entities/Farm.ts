import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import Plot from './Plot';
import Client from '@modules/clients/typeorm/entities/Client';

@Entity('farms')
class Farm {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  user_id: string;

  @Column({ nullable: true })
  client_id: string;

  @ManyToOne(() => Client, { eager: true, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @Column()
  name: string;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  area: number;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  contact: string;

  @Column({ default: 'Ativo' })
  status: string;

  @Column({ nullable: true })
  registration: string;

  @Column({ nullable: true })
  lot: string;

  @OneToMany(() => Plot, plot => plot.farm, { eager: true, cascade: true })
  plots: Plot[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

export default Farm;
