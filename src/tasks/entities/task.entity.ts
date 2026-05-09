import { TaskType } from "src/enum/task-type";
import { User } from "src/user/entities/user.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('tasks')
export class Task {

    @ManyToOne(() => User, (user) => user.tasks)
    @JoinColumn({name:'user_id'})
    user!: User;

    @PrimaryGeneratedColumn()
    task_id!:number

    @Column({length:20})
    title!:string

    @Column({length:150})
    description!:string

    @Column({type:'enum', enum:TaskType})
    tType!:TaskType

    @Column()
    stressLevel!:number

    @CreateDateColumn({type:Date})
    postDate!:Date

    @Column({type:Date})
    startDate!:Date

    @Column({type:Date})
    finishDate!:Date

    @Column({type:Boolean, default:false})
    completed!:Boolean

    @Column({type:Boolean, default:false})
    updated!:Boolean

}
