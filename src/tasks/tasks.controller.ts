import { Controller, Get, Post, Body, Patch, Param, Delete, Request, UseGuards } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  //Crear una tarea nueva
  @UseGuards(AuthGuard)
  @Post()
  create(@Body() createTaskDto: CreateTaskDto, @Request() req) {
    return this.tasksService.create(createTaskDto, req.user.id)
  }

  //Obtener todas las tareas de la base de datos
  @UseGuards(AuthGuard)
  @Get()
  findAll() {
    return this.tasksService.findAll();
  }

  //Obtener todas las tareas del usuario logeado
  @UseGuards(AuthGuard)
  @Get('own')
  findAllOwn(@Request() req){
    return this.tasksService.findAllUser(req.user.id);
  }

  //Obtener todas las tareas de un usuario especifico
  @UseGuards(AuthGuard)
  @Get('user/:id')
  finAllUser(@Param('id') id:string){
    return this.tasksService.findAllUser(+id);
  }

  //Obtener una tarea especifica, por id
  @UseGuards(AuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(+id);
  }

  //Marcar una tarea como completada
  @UseGuards(AuthGuard)
  @Patch('complete/:id')
  complete(@Param('id') taskId:string, @Request() req){
    const {role, id} = req.user
    return this.tasksService.completeTask(+taskId, id, role);
  }

  //Modificar una tarea especifica, por id
  @UseGuards(AuthGuard)
  @Patch(':id')
  update(@Param('id') taskId: string, @Body() updateTaskDto: UpdateTaskDto, @Request() req) {
    const {role, id} = req.user
    return this.tasksService.update(+taskId, id, role, updateTaskDto);
  }

  //Eliminar una tarea por id
  @UseGuards(AuthGuard)
  @Delete(':id')
  remove(@Param('id') taskId: string, @Request() req) {
    const {role, id} = req.user
    return this.tasksService.remove(+taskId, id, role);
  }
}
