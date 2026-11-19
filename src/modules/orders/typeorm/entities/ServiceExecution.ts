import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('service_executions')
class ServiceExecution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  order_id: string;

  @Column()
  operator_name: string;

  @Column({ nullable: true })
  equipment_name: string;

  @Column('numeric', { precision: 10, scale: 2 })
  area_ha: number;

  @Column({ nullable: true })
  product_name: string;

  @Column('numeric', { precision: 10, scale: 2, nullable: true })
  quantity?: number;

  @Column({ nullable: true })
  unit: string;

  @Column({ nullable: true })
  plot_name: string;

  @Column('integer', { default: 0, nullable: true })
  samples_executed: number;

  @Column('jsonb', { nullable: true, default: () => "'[]'" })
  splits: any;

  @Column({ nullable: true })
  execution_date: string;

  @Column('text', { nullable: true })
  notes: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

export default ServiceExecution;
