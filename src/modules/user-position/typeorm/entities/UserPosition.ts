import {
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    Column
} from 'typeorm';

@Entity('tb_user_position')
class UserPosition {
    @PrimaryGeneratedColumn('increment')
    id: number;

    @Column({ type: 'varchar', length: 255, nullable: false })
    name: string;

    @Column({ type: 'boolean', default: true, nullable: false })
    status: boolean;

    @CreateDateColumn({ type: 'timestamp with time zone' }) // Usamos timestamp with time zone
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamp with time zone' }) // Usamos timestamp with time zone
    updated_at: Date;
}
export default UserPosition;