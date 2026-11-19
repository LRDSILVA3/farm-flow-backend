import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import Product from './Product';
import Order from '@modules/orders/typeorm/entities/Order';

export type StockMovementType = 'ENTRADA' | 'SAIDA_ORDEM' | 'SAIDA_AVULSA' | 'AJUSTE';

@Entity('stock_movements')
class StockMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  product_id: string;

  @ManyToOne(() => Product, { eager: true })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ nullable: true })
  order_id?: string;

  @ManyToOne(() => Order, { nullable: true })
  @JoinColumn({ name: 'order_id' })
  order?: Order;

  @Column()
  type: StockMovementType;

  @Column('decimal', { precision: 12, scale: 2 })
  quantity: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  previous_stock: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  new_stock: number;

  @Column('decimal', { precision: 12, scale: 2, nullable: true })
  unit_price?: number;

  @Column({ nullable: true })
  document_number?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ nullable: true })
  user_id?: string;

  @CreateDateColumn()
  created_at: Date;
}

export default StockMovement;
