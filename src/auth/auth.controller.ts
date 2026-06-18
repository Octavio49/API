import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';;
import { CreateUserDto } from './dto/create-user.dto';
import { AuthGuard } from './auth.guard';
import { LoginUserDto } from './dto/login-user.dto';
import { RolesGuard } from './roles.guard';
import { Roles } from './role.decorator';
import { Role } from '../enum/role';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/register')
  create(@Body() createUserDto: CreateUserDto) {
    return this.authService.create(createUserDto);
  }

  @Post('login')
  login(@Body() loginUserDto:LoginUserDto) {
    return this.authService.login(loginUserDto);
  }

  //Verificacion de funcionamiento correcto de token
  @UseGuards(AuthGuard)
  @Get('/profile')
  profile (@Request() req){
    return this.authService.findOne(req.user.id);
  }

  //Funcion para solicitar restablecimiento de contraseña mediante pregunta de recuperacion
  @Post('forgot-password')
  forgot_Password(@Body('email') email: string) {
    return this.authService.forgotPassword(email);
  }

  //Funcion para restablecer la contraseña mediante el codigo de recuperacion enviado al correo
  @Post('reset-password')
  reset(@Body() body: { email: string, code:string, newPassword: string }) {
    return this.authService.resetPassword(body.email, body.code, body.newPassword);
  }

  //Funcion para cambiar la contraseña del usuario autenticado
  @UseGuards(AuthGuard)
  @Post('change-password')
  change_Password(@Request() req, @Body() body: { currentPassword: string, newPassword: string }) {
    const id = req.user.id;
    return this.authService.changePassword(id, body.currentPassword, body.newPassword);
  }

  @UseGuards(AuthGuard)
  @Patch('change-password')
  changePassword(@Request() req, @Body() body: { currentPassword: string, newPassword: string }) {
    const id = req.user.id;
    return this.authService.changePassword(id, body.currentPassword, body.newPassword);
  }

  @UseGuards(AuthGuard,RolesGuard)
  @Roles(Role.ADMIN,Role.DEVELOPER)
  @Get(':id')
  findAll(@Param('id') id: string) {
    return this.authService.findOne(+id);
  }

  @UseGuards(AuthGuard)
  @Patch('profile')
  async update(@Body() updateUserDto: UpdateUserDto, @Request() req) {
    const id= req.user.id
    const password = updateUserDto.password

    const salt= 10

    if (password) {
      const hashePassword = await bcrypt.hash(password, salt)
      updateUserDto.password = hashePassword
    }
    return this.authService.update(+id, updateUserDto);
   }

  @UseGuards(AuthGuard)
  @Delete('profile')
  remove(@Request() req) {
    const id = req.user.id
    return this.authService.remove(+id)
    } 
}
