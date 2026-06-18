import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './entities/task.entity';
import { MemberStress } from '../member-stress/entities/member-stress.entity';

@Module({
  imports:[TypeOrmModule.forFeature([Task, MemberStress])],
  controllers: [TaskController],
  providers: [TaskService],
})
export class TaskModule {}
