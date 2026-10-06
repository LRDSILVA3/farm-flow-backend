import {
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Column
} from 'typeorm';

@Entity('tb_person')
class Person {
  @PrimaryGeneratedColumn('increment') 
  id: number;

  @Column({ type: 'varchar', length: 11, unique: true, nullable: false })
  cpf: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string;

  @Column({ type: 'date', nullable: true }) 
  birth_date: Date; 

  @Column({ type: 'varchar', length: 20, nullable: true })
  telephone: string;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  email: string;

  @Column({ type: 'boolean', default: true, nullable: false })
  status: boolean;

  @CreateDateColumn({ type: 'timestamp with time zone' }) // Usamos timestamp with time zone
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' }) // Usamos timestamp with time zone
  updated_at: Date;

}

export default Person;