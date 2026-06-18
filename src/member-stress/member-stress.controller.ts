import {Body,Controller,Delete,Get,Param,Patch,Post,Request,UseGuards} from '@nestjs/common';
import { MemberStressService } from './member-stress.service';
import { CreateMemberStressDto } from './dto/create-member-stress.dto';
import { UpdateMemberStressDto } from './dto/update-member-stress.dto';
import { AuthGuard } from '../auth/auth.guard';

@Controller('member-stress')
@UseGuards(AuthGuard)
export class MemberStressController {
  constructor(private readonly memberStressService: MemberStressService) {}

  //Crear un nuevo registro de estrés para un miembro en una tarea específica, userId se obtiene del token JWT y taskId se pasa como parámetro en la URL
  @Post('task/:taskId')
  create(@Request() req, @Param('taskId') taskId: string, @Body() createMemberStressDto: CreateMemberStressDto) {
    const userId = req.user.id;

    return this.memberStressService.create(
      createMemberStressDto,
      userId,
      +taskId
    );
  }

  //Obtener todos los registros de estrés 
  @Get()
  findAll() {
    return this.memberStressService.findAll();
  }

  //Obtener el registro de estrés de un miembro para una tarea específica, userId se obtiene del token JWT y taskId se pasa como parámetro en la URL
  @Get('task/:taskId')
  findOne(@Request() req, @Param('taskId') taskId: string) {
    const userId = req.user.id;

    return this.memberStressService.findOne(
      userId,
      +taskId
    );
  }

  //Actualizar el nivel de estrés de un miembro para una tarea específica, userId se obtiene del token JWT y taskId se pasa como parámetro en la URL
  @Patch('task/:taskId')
  update(@Request() req, @Param('taskId') taskId: string, @Body() updateMemberStressDto: UpdateMemberStressDto
  ) {
    const userId = req.user.id;

    return this.memberStressService.update(
      userId,
      +taskId,
      updateMemberStressDto
    );
  }

  //Eliminar el registro de estrés de un miembro para una tarea específica, userId se obtiene del token JWT y taskId se pasa como parámetro en la URL
  @Delete('task/:taskId')
  remove(
    @Request() req,
    @Param('taskId') taskId: string
  ) {
    const userId = req.user.id;

    return this.memberStressService.remove(
      userId,
      +taskId
    );
  }
}
