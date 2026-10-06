import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('analyses')
class Analysis {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  user_id: string;

  @Column({ nullable: true })
  order_id: string;

  @Column({ nullable: true })
  farm_id: string;

  @Column({ nullable: true })
  plot_id: string;

  @Column()
  type: string;

  @Column({ default: 'Pendente' })
  status: string;

  @Column('jsonb', { nullable: true })
  results: any;

  @Column({ nullable: true })
  date: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

export default Analysis;
