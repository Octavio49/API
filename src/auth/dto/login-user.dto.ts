import { IsEmail, IsNotEmpty, IsString, Length } from "class-validator";

export class LoginUserDto{
    @IsNotEmpty()
    @IsString()
    @IsEmail()
    email!:string;

    @IsNotEmpty()
    @IsString()
    @Length(8)
    password!:string;
}