import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

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

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

export default Service;
