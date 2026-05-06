import { Role } from "src/enum/role";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('users')
export class User{
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

