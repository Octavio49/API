import { PartialType } from '@nestjs/mapped-types';
import { CreateMemberStressDto } from './create-member-stress.dto';

export class UpdateMemberStressDto extends PartialType(CreateMemberStressDto) {}
