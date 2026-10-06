import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('equipment')
class Equipment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  user_id: string;

  @Column()
  name: string;

  @Column()
  type: string;

  @Column({ default: 'Ativo' })
  status: string;

  @Column({ nullable: true })
  model: string;

  @Column({ nullable: true })
  plate: string;

  @Column({ nullable: true })
  serial_number: string;

  @Column({ nullable: true })
  hourmeter: string;

  @Column({ nullable: true })
  year: string;

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

export default Equipment;
