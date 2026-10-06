import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import Client from '@modules/clients/typeorm/entities/Client';
import Farm from '@modules/farms/typeorm/entities/Farm';

@Entity('orders')
class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  user_id: string;

  @Column({ nullable: true })
  client_id: string;

  @ManyToOne(() => Client, { eager: true, nullable: true })
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @Column({ nullable: true })
  farm_id: string;

  @ManyToOne(() => Farm, { eager: true, nullable: true })
  @JoinColumn({ name: 'farm_id' })
  farm: Farm;

  @Column()
  type: string;

  @Column({ nullable: true })
  service_name: string;

  @Column('jsonb', { nullable: true })
  products_data: any;

  @Column({ nullable: true })
  service_group: string;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  area: number;

  @Column('decimal', { precision: 12, scale: 2, nullable: true })
  value: number;

  @Column({ default: 'Pendente' })
  status: string;

  @Column({ default: 'Aguardando' })
  payment: string;

  @Column('jsonb', { nullable: true, default: () => "'[]'" })
  executions: any;

  @Column('jsonb', { nullable: true, default: () => "'[]'" })
  schedules: any;

  @Column('jsonb', { nullable: true, default: () => "'[]'" })
  payments: any;

  @Column('jsonb', { nullable: true, default: () => "'[]'" })
  logs: any;

  @Column('decimal', { precision: 10, scale: 2, default: 0, nullable: true })
  executed_area: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0, nullable: true })
  paid_amount: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

export default Order;
