import { Controller, Get, Post, Body, Patch, Delete, UseGuards, Request } from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { Role } from 'src/enum/role';
import { AuthGuard } from 'src/auth/auth.guard';
import * as bcrypt from 'bcrypt';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.DEVELOPER)
  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @UseGuards(AuthGuard)
  @Get('profile')
  async findOne(@Request() req) {
    //La API automaticamente extrae el id del usuario desde el token, no hay necesidad de que el frontend mande el id
    const id = req.user.id
    return this.userService.findOne(+id);
  }

  @UseGuards(AuthGuard)
  @Patch('profile')
  async update(@Body() updateUserDto: UpdateUserDto, @Request() req) {
    //La API extrae automaticamente el id, como en findOne
    const id = req.user.id
    const password = updateUserDto.password

    //Si se quiere modificar la contraseña, se vuelve a hashear
    const salt = 10
    if(password){
      const hashPassword = await bcrypt.hash(password, salt)
      updateUserDto.password = hashPassword
    }

    return this.userService.update(+id, updateUserDto);
  }

  @UseGuards(AuthGuard)
  @Delete('profile')
  remove(@Request() req) {
    //Igualmente, la API extrae el id
    const id = req.user.id
    return this.userService.remove(+id);
  }
}
