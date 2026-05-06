import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginUserDto } from 'src/user/dto/login-user.dto';

@Injectable()
export class AuthService {
  constructor(@InjectRepository(User) private userRepository: Repository<User>, private jwtService: JwtService) {
  }

  async create(createUserDto: CreateUserDto) {
    const salt = 10;
    const{ email, password, r_answer  } = createUserDto
    const emailExist = await this.userRepository.findOneBy({email})
    if (emailExist){
      const error = {
        'statusCode': 409,
        'error': 'conflict',
        'message': ["El email ya está registrado"]
      }
      throw new ConflictException("Usuario duplicado")
    }

    const hashPassword = await bcrypt.hash(password, salt)
    const hashAnswer = await bcrypt.hash(r_answer, salt)
    createUserDto.password = hashPassword
    createUserDto.r_answer = hashAnswer
    return this.userRepository.save(createUserDto)
  }

  async login(loginUserDto : LoginUserDto){
    const {email, password} = loginUserDto;
    const emailExist = await this.userRepository.findOneBy({email})
    if(!emailExist){
        const error = {
        'statusCode': 404,
        'error': 'conflict',
        'message': ["El usuario no existe"]
      }
      throw new NotFoundException(error)
    }

    const matchPassword = await bcrypt.compare(password, emailExist.password)
    if(!matchPassword){
      const error = {
        'statusCode': 401,
        'error': 'conflict',
        'message': ["La contraseña no coincide"]
      }
      throw new UnauthorizedException(error)
    }

    const payload = {
      id : emailExist.id,
      name : emailExist.name,
      username : emailExist.username,
      email : emailExist.email,
      role : emailExist.role
    }

    const token = await this.jwtService.signAsync(payload)
    return{token};
  }
}
