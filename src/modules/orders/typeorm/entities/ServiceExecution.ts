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
  execution_date: string;

  @Column('text', { nullable: true })
  notes: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

export default ServiceExecution;
