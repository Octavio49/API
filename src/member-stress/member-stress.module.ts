import { Module } from '@nestjs/common';
import { MemberStressService } from './member-stress.service';
import { MemberStressController } from './member-stress.controller';
import { MemberStress } from './entities/member-stress.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  controllers: [MemberStressController],
  providers: [MemberStressService],
  imports: [TypeOrmModule.forFeature([MemberStress])]
})
export class MemberStressModule {}
