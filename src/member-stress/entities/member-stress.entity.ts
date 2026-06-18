import { Column, CreateDateColumn, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../../auth/entities/user.entity";
import { Task } from "../../task/entities/task.entity";

@Entity('member_stress')
export class MemberStress {

    @ManyToOne(() => User, (user) => user.stressLevels, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @ManyToOne(() => Task, (task) => task.stressLevels, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'task_id' })
    task!: Task;

    @PrimaryGeneratedColumn()
    id!: number

    @Column()
    level!: number
}
