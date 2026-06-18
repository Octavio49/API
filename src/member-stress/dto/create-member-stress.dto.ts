import { IsNotEmpty, IsNumber } from "class-validator";

export class CreateMemberStressDto {
    @IsNotEmpty()
    @IsNumber()
    level!: number;
}
