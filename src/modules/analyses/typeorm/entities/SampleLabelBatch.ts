import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('sample_label_batches')
class SampleLabelBatch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  farm_id: string;

  @Column({ nullable: true })
  plot_id: string;

  @Column({ nullable: true })
  order_id: string;

  @Column({ nullable: true })
  user_id: string;

  @Column({ nullable: true })
  user_name: string;

  @Column({ nullable: true })
  client_name: string;

  @Column({ nullable: true })
  farm_name: string;

  @Column({ nullable: true })
  plot_name: string;

  @Column({ nullable: true })
  responsible_name: string;

  @Column({ nullable: true })
  responsible_cpf: string;

  @Column({ nullable: true })
  sender: string;

  @Column({ nullable: true })
  hectares: string;

  @Column({ nullable: true })
  lot: string;

  @Column({ nullable: true })
  registration: string;

  @Column({ nullable: true })
  city_state: string;

  @Column({ default: 0 })
  total_samples_count: number;

  @Column({ default: 0 })
  emitted_count: number;

  @Column({ default: 0 })
  pending_count: number;

  @Column('jsonb', { default: () => "'[]'" })
  samples: any[];

  @Column('jsonb', { default: () => "'[]'" })
  pending_samples: any[];

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

export default SampleLabelBatch;
