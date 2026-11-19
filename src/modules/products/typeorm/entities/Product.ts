import {
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Column,
} from 'typeorm';

@Entity('products')
class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  code: string;

  @Column({ default: 'Outro' })
  category: string;

  @Column({ default: 'un' })
  unit: string;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  cost_price: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  price: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  quantity: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  min_stock: number;

  @Column({ default: false })
  controls_stock: boolean;

  @Column({ nullable: true })
  supplier: string;

  @Column({ default: 'Ativo' })
  status: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

export default Product;
