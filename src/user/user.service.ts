import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class UserService {
  constructor(@InjectRepository(User) private repoUser:Repository<User>){}

  async findAll() : Promise<User[]> {
    return this.repoUser.find();
  }

  async findOne(id: number) : Promise<User | null>{
    const user = await this.repoUser.findOneBy({id})
    if(!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto) : Promise<User | null> {
    await this.repoUser.update(id, updateUserDto)
    return this.findOne(id);
  }

  async remove(id: number) : Promise<void>{
    await this.findOne(id)
    await this.repoUser.delete(id);
  }
}
