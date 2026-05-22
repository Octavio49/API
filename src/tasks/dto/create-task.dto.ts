import { Type } from "class-transformer"
import { IsBoolean, IsDate, IsEnum, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from "class-validator"
import { TaskType } from "src/enum/task-type"

export class CreateTaskDto {

    @IsString()
    @MaxLength(30)
    title!:string

    @IsString()
    @MaxLength(300)
    description!:string

    @IsEnum(TaskType)
    tType!:TaskType

    @IsNumber()
    @Min(0)
    @Max(10)
    stressLevel!:number

    @Type(() => Date)
    @IsDate()
    startDate!:Date

    @Type(() => Date)
    @IsDate()
    finishDate!:Date

    @IsBoolean()
    public!:Boolean

}
