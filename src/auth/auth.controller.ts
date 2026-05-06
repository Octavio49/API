import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';;
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { AuthGuard } from './auth.guard';
import { LoginUserDto } from 'src/user/dto/login-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  create(@Body() createUserDto: CreateUserDto) {
    return this.authService.create(createUserDto);
  }

  @Post('login')
  login(@Body() loginUserDto:LoginUserDto) {
    return this.authService.login(loginUserDto);
  }

  //Verificacion de funcionamiento correcto de token
  @UseGuards(AuthGuard)
  @Get('profile')
  profile (@Request() req){
    return "Estas viendo un perfil protegido pro un Token valido del usuario" + req.user
  }
}
