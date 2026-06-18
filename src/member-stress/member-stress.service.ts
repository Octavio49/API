import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMemberStressDto } from './dto/create-member-stress.dto';
import { UpdateMemberStressDto } from './dto/update-member-stress.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { MemberStress } from './entities/member-stress.entity';
import { Repository } from 'typeorm';

@Injectable()
export class MemberStressService {

  constructor(@InjectRepository(MemberStress) private memberStressRepository: Repository<MemberStress>) { }

  async create(createMemberStressDto: CreateMemberStressDto, userId: number, taskId: number): Promise<MemberStress> {
    const memberStress = this.memberStressRepository.create({
      ...createMemberStressDto,
      user: { id: userId },
      task: { task_id: taskId }
    });
    return this.memberStressRepository.save(memberStress);
  }

  async findAll(): Promise<MemberStress[]> {
    return this.memberStressRepository.find();
  }

  async findOne(userId: number, taskId: number): Promise<MemberStress> {
    const memberStress = await this.memberStressRepository.findOne({
      where: { user: { id: userId }, task: { task_id: taskId } },
    });
    if (!memberStress) {
      throw new NotFoundException("Registro de estrés no encontrado");
    }
    return memberStress;
  }

  async update(userId: number, taskId: number, updateMemberStressDto: UpdateMemberStressDto): Promise<MemberStress> {
    const memberStress = await this.memberStressRepository.findOne({
      where: { user: { id: userId }, task: { task_id: taskId } },
    });

    if (!memberStress) {
      throw new NotFoundException("Registro de estrés no encontrado");
    }

    Object.assign(memberStress, updateMemberStressDto);

    return this.memberStressRepository.save(memberStress);
  }

  async remove(userId: number, taskId: number): Promise<void> {
    const memberStress = await this.memberStressRepository.findOne({
      where: { user: { id: userId }, task: { task_id: taskId } },
    });

    if (!memberStress) {
      throw new NotFoundException("Registro de estrés no encontrado");
    }

    await this.memberStressRepository.remove(memberStress);
  }
}
