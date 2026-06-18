import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginUserDto } from './dto/login-user.dto';
import { MailService } from '../mail/mail.srvice';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class AuthService {
  constructor(@InjectRepository(User) 
    private userRepository: Repository<User>, 
    private jwtService: JwtService,
    private mailService: MailService) {
  }

  async create(createUserDto: CreateUserDto) {
    const salt = 10;
    const{ email, password } = createUserDto
    const emailExist = await this.userRepository.findOneBy({email})
    const usernameExist = await this.userRepository.findOneBy({username: createUserDto.username})
    if (emailExist || usernameExist){
      const error = {
        'statusCode': 409,
        'error': 'conflict',
        'message': ["El email/usuario ya está registrado"]
      }
      throw new ConflictException("El email/usuario ya está registrado")
    }

    const hashPassword = await bcrypt.hash(password, salt)

    createUserDto.password = hashPassword

    const user = await this.userRepository.save(createUserDto)
    return {
      success:true,
      message:"Usuario registrado Correctamente"
    }
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
      role: emailExist.role
    }

    const token = await this.jwtService.signAsync(payload)
    return{token};
  }

  //Esto sera exclusivamente para cuando se olvida la contraseña, no para cambiarla, para eso se necesita la contraseña actual
  async forgotPassword(email: string) {
    const user = await this.userRepository.findOneBy({ email });

    if (!user) {
      return {
        success: true,
        message: "Si el correo existe, se enviará un codigo"
      };
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetCode = code;
    user.resetCodeExpire = new Date(Date.now() + 10 * 60 * 1000);

    await this.userRepository.save(user);
    
    await this.mailService.sendPasswordReset(email, code);

    return {
      success: true,
      message: "Si el correo existe, se enviará un codigo"
    };
  }

  async resetPassword(email: string, code: string, newPassword: string) {
    const user = await this.userRepository.findOneBy({ email });
   
    if (!user) {
      throw new NotFoundException("Datos inválidos");
    }

    if (!user.resetCode) {
      throw new BadRequestException("No hay solicitud de recuperación");
    }

    if (user.resetCode !== code) {
      throw new ForbiddenException("Código incorrecto");
    }

    const expire = user.resetCodeExpire;

    if (!expire) {
      throw new BadRequestException("Código inválido");
    }

    if (new Date() > expire) {
      throw new ForbiddenException("Código expirado");
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;

    user.resetCode = undefined;
    user.resetCodeExpire = undefined;

    await this.userRepository.save(user);

    return {
      success: true,
      message: "Contraseña actualizada correctamente"
    };
  }

  //Metodo exclusivo para cambiar la contraseña, se necesita la contraseña actual para verificar que el usuario es el dueño de la cuenta
  async changePassword(id: number, currentPassword: string, newPassword: string) {
    const user = await this.userRepository.findOneBy({ id });

    if (!user) {
      throw new NotFoundException("Usuario no encontrado");
    }

    const matchPassword = await bcrypt.compare(currentPassword, user.password);
    if (!matchPassword) {
      throw new ForbiddenException("Contraseña actual incorrecta");
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;

    await this.userRepository.save(user);

    return {
      success: true,
      message: "Contraseña actualizada correctamente"
    };
  }

  async findAll() : Promise<User[]> {
    return this.userRepository.find();
  }

  async findOne(id: number) : Promise<User | null>{
    const user = await this.userRepository.findOneBy({id})
    if(!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto) : Promise<User | null> {
    await this.userRepository.update(id, updateUserDto)
    return this.findOne(id);
  }

  async remove(id: number) : Promise<void>{
    await this.findOne(id)
    await this.userRepository.delete(id);
  }
}
