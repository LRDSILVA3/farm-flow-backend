import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import ServiceProduct from './ServiceProduct';

@Entity('services')
class Service {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  user_id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  value_per_alqueire: string;

  @Column({ default: 'Ativo' })
  status: string;

  @Column({ nullable: true })
  products: string;

  @Column({ default: false })
  is_fixed: boolean;

  @OneToMany(() => ServiceProduct, (sp) => sp.service)
  service_products: ServiceProduct[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

export default Service;
