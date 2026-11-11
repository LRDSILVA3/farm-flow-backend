import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export interface AuditFieldChange {
  field: string;
  label: string;
  before: any;
  after: any;
}

@Entity('audit_logs')
class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  user_id?: string;

  @Column({ nullable: true })
  user_name?: string;

  @Column({ nullable: true })
  user_email?: string;

  @Column({ nullable: true })
  user_role?: string;

  @Column()
  module: string;

  @Column()
  action: string;

  @Column({ nullable: true })
  entity_id?: string;

  @Column({ nullable: true })
  entity_label?: string;

  @Column('text')
  summary: string;

  @Column('jsonb', { nullable: true })
  changes?: AuditFieldChange[] | null;

  @Column('jsonb', { nullable: true })
  before_data?: Record<string, any> | null;

  @Column('jsonb', { nullable: true })
  after_data?: Record<string, any> | null;

  @Column({ nullable: true })
  ip_address?: string;

  @Column({ nullable: true })
  user_agent?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}

export default AuditLog;

