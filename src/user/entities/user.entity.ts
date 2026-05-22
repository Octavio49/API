import { Role } from "src/enum/role";
import { Task } from "src/tasks/entities/task.entity";
import { Column, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('users')
export class User{

    @OneToMany(() => Task, (task) => task.user)
    tasks!: Task[];
    @ManyToMany(() => Task)
    joinedTasks!: Task[];

    @PrimaryGeneratedColumn()
    id!:number;

    @Column()
    name!:string;

    @Column({unique:true , length:20})
    username!:string;

    @Column({unique:true})
    email!:string;

    @Column()
    password!:string;

    @Column()
    r_question!:string;
    
    @Column()
    r_answer!:string

    @Column({type:'enum', enum:Role, default:Role.USER})
    role!:Role
}

