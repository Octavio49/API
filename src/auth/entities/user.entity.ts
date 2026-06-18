import { Column, Entity, ManyToMany, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Role } from "../../enum/role";
import { Task } from "../../task/entities/task.entity";
import { MemberStress } from "../../member-stress/entities/member-stress.entity";

@Entity('users')
export class User {

    @ManyToMany(() => Task, (task) => task.user)
    tasks!: Task[];

    @OneToMany(() => MemberStress, (stressLevel) => stressLevel.user)
    stressLevels!: MemberStress[];

    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @Column({ unique: true, length: 20 })
    username!: string;

    @Column({ unique: true })
    email!: string;

    @Column()
    password!: string;

    @Column({ nullable: true })
    resetCode?: string;

    @Column({ type: 'timestamp', nullable: true })
    resetCodeExpire?: Date;

    @Column({ type: 'enum', enum: Role, default: Role.USER })
    role!: Role;
}
