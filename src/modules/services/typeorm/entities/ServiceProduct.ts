import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import Service from './Service';
import Product from '@modules/products/typeorm/entities/Product';

@Entity('service_products')
class ServiceProduct {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  service_id: string;

  @ManyToOne(() => Service, (service) => service.service_products, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'service_id' })
  service: Service;

  @Column()
  product_id: string;

  @ManyToOne(() => Product, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ default: false })
  is_default: boolean;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  default_dosage: number;

  @Column({ default: '' })
  dosage_unit: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

export default ServiceProduct;
