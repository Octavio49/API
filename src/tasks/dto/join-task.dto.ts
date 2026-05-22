import { IsString, Length, MinLength } from "class-validator";

export class JoinTaskDto{
    @IsString()
    @Length(6, 6)
    code!:string
}