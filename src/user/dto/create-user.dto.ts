import { IsEmail, IsString, MinLength } from "class-validator";

export class CreateUserDto{
    @IsString()
    name!:string;

    @IsString()
    username!:string;

    @IsString()
    @IsEmail()
    email!:string;

    @IsString()
    @MinLength(8)
    password!:string;

    @IsString()
    r_question!:string;

    @IsString()
    r_answer!:string
}
