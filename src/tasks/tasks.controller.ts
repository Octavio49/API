import { Controller, Get, Post, Body, Patch, Param, Delete, Request, UseGuards, Req, Query } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { JoinTaskDto } from './dto/join-task.dto';
import { Roles } from 'src/auth/roles.decorator';
import { Role } from 'src/enum/role';
import { RolesGuard } from 'src/auth/roles.guard';

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
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.DEVELOPER)
  @Get()
  findAll() {
    return this.tasksService.findAll();
  }

  //Obtener todas las tareas publicas en la bd
  @UseGuards(AuthGuard)
  @Get('public')
  findAllPublic(){
    return this.tasksService.findAllPublic();
  }

  //Obtener las teras del usuario logeado (publicas, privadas y a las que esta unido)
  @UseGuards(AuthGuard)
  @Get('own')
  findAllOwn(@Request() req){
    return this.tasksService.findAllUserL(req.user.id);
  }

  //Obtener las tareas de un usuario especifico (solo publicas y a las que esta unido)
  @UseGuards(AuthGuard)
  @Get('user/:id')
  finAllUser(@Param('id') id:string){
    return this.tasksService.findAllUserNL(+id);
  }

  //Obtener una tarea por nombre/titulo (solamente si es publica o bien si el solicitante es miembro o dueño de la tarea)
  @UseGuards(AuthGuard)
  @Get('title')
  //No se envia body al endpoint, seria una query. El titulo se indicaria de la siguiente forma (GET /tasks/title?title=proyecto+final).
  findByTitle(@Query('title') title: string, @Request() req){
  const {role, id} = req.user
  return this.tasksService.findByTitle(title, id, role)
}

  //Obtener el codigo de una tarea (Solamente si eres dueño de ella o eres admin/developer)
  @UseGuards(AuthGuard)
  @Get('code/:id')
  getCode(@Param('id') taskId:string, @Request() req){
    const {role, id} = req.user
    return this.tasksService.getCode(+taskId, id, role);
  }

  //Obtener una tarea por id (Solamente si es publica o bien si el solicitante es miembro o dueño de la tarea)
  @UseGuards(AuthGuard)
  @Get(':id')
  findOne(@Param('id') taskId: string, @Request() req) {
    const {role, id} = req.user
    return this.tasksService.findOne(+taskId, id, role, false);
  }

  //Marcar una tarea como completada
  @UseGuards(AuthGuard)
  @Patch('complete/:id')
  complete(@Param('id') taskId:string, @Request() req){
    const {role, id} = req.user
    return this.tasksService.completeTask(+taskId, id, role);
  }

  //Hacer una tarea publica
  @UseGuards(AuthGuard)
  @Patch('public/:id')
  makePublic(@Param('id') taskId:string, @Request() req){
    const {role, id} = req.user
    return this.tasksService.makePublic(+taskId, id, role)
  }

  //Hacer que una tarea ya no sea publica
  @UseGuards(AuthGuard)
  @Patch('private/:id')
  makePrivate(@Param('id') taskId:string, @Request() req){
    const {role, id} = req.user
    return this.tasksService.makePrivate(+taskId, id, role)
  }

  //Unirse a una tarea
  @UseGuards(AuthGuard)
  @Patch('join/:id')
  joinToTask(@Param('id') taskId:string, @Body() code: JoinTaskDto, @Request() req){
    return this.tasksService.joinToTask(+taskId, req.user.id, code.code)
  }

  //Salirse de una tarea
  @UseGuards(AuthGuard)
  @Patch('leave/:id')
  leaveTask(@Param('id') taskId:string, @Request() req){
    const {role, id} = req.user
    return this.tasksService.leaveTask(+taskId, id, id, role)
  }

  //Expulsar a alguien de una tarea
  @UseGuards(AuthGuard)
  @Patch('kick/:id')
  kickUser(@Param('id') taskId:string, @Body() body: {userId: string}, @Request() req){
    const {role, id} = req.user
    return this.tasksService.leaveTask(+taskId, id, +body.userId, role)
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
