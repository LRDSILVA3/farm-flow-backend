import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('financial_transactions')
class FinancialTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  user_id: string;

  @Column({ nullable: true })
  order_id: string;

  @Column({ nullable: true })
  client_id: string;

  @Column()
  description: string;

  @Column()
  type: string; // 'income' | 'expense'

  @Column()
  category: string;

  @Column('numeric', { precision: 12, scale: 2 })
  amount: number;

  @Column({ nullable: true })
  due_date: string;

  @Column({ nullable: true })
  payment_date: string;

  @Column({ default: 'pending' })
  status: string; // 'paid' | 'pending' | 'cancelled'

  @Column({ nullable: true })
  payment_method: string;

  @Column('text', { nullable: true })
  notes: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

export default FinancialTransaction;
