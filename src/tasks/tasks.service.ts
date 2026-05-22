import { BadRequestException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Task } from './entities/task.entity';
import { ILike, Repository } from 'typeorm';
import { Role } from 'src/enum/role';
import { User } from 'src/user/entities/user.entity';


@Injectable()
export class TasksService {

  constructor(@InjectRepository(Task) private repoTask: Repository<Task>) {

  }

  //Crear una tarea nueva
  async create(createTaskDto: CreateTaskDto, userId: number): Promise<Task> {
    //El codigo para unirse a una tarea no se hashea debido a que se necesita saber cual es la contraseña para unirse
    //No representa falta de seguridad grave
    const code = createTaskDto.public ? Math.random().toString(36).substring(2, 8).toUpperCase() : undefined
    const task = this.repoTask.create({ ...createTaskDto, user: { id: userId }, code: code })
    return this.repoTask.save(task)
  }

  //Obtener todas las teras en la base de datos
  async findAll(): Promise<Task[]> {
    return this.repoTask.find({
      relations: ['user', 'members'],
      select: {
        user: { id: true, username: true },
        members: { id: true, username: true }
      }
    });
  }

  //Obtener todas las tareas publicas en la bd
  async findAllPublic(): Promise<Task[]> {
    return this.repoTask.find({
      where: { public: true },
      relations: ['user', 'members'],
      select: {
        user: { id: true, username: true },
        members: { id: true, username: true }
      }
    });
  }

  //Obtener las teras del usuario logeado (publicas, privadas y a las que esta unido)
  async findAllUserL(user_id: number): Promise<Task[]> {
    return this.repoTask.createQueryBuilder('task')
      .leftJoinAndSelect('task.user', 'user')
      .leftJoinAndSelect('task.members', 'members')
      .where('user.id = :id', { id: user_id })
      .orWhere('members.id = :id', { id: user_id })
      .select([
        'task',
        'user.id', 'user.username',
        'members.id', 'members.username'
      ])
      .getMany();
  }

  //Obtener las tareas de un usuario especifico (solo publicas y a las que esta unido)
  async findAllUserNL(user_id: number): Promise<Task[]> {
    return this.repoTask.createQueryBuilder('task')
      .leftJoinAndSelect('task.user', 'user')
      .leftJoinAndSelect('task.members', 'members')
      .where('user.id = :id AND task.public = true', { id: user_id })
      .orWhere('members.id = :id', { id: user_id })
      .select([
        'task',
        'user.id', 'user.username',
        'members.id', 'members.username'
      ])
      .getMany();
  }

  //Obtener una tarea por id (Solamente si es publica o bien si el solicitante es miembro o dueño de la tarea)
  async findOne(taskId: number, userId: number, role: Role, call: boolean): Promise<Task | null> {
    const task = await this.repoTask.findOne({
      where: { task_id: taskId },
      relations: ['user', 'members'],
      select: {
        user: { id: true, username: true },
        members: { id: true, username: true }
      }
    })
    if (!task) throw new NotFoundException('Tarea no encontrada');

    //Se verifica que el solicitante sea dueño/miembro de la tarea en caso de ser privada
    if (!call && task.public == false && role == 'USER' && task!.user.id != userId && !task.members.some(m => m.id === userId)) {
      throw new ForbiddenException("No tienes permiso para visualizar esta tarea")
    }
    return task;
  }

  //Obtener una tarea por nombre/titulo (solamente si es publica o bien si el solicitante es miembro o dueño de la tarea)
  async findByTitle(title: string, userId: number, role: Role): Promise<Task[]> {
    if(!title || !title.length) throw new BadRequestException("No se ha recibido un título a buscar")
    const tasks = await this.repoTask.find({
      where: { title: ILike(`%${title}%`) },
      relations: ['user', 'members'],
      select: {
        user: { id: true, username: true },
        members: { id: true, username: true }
      }
    });

    if (!tasks.length) throw new NotFoundException('No se encontraron tareas');

    const filtered = tasks.filter(task =>
      task.public ||
      role !== 'USER' ||
      task.user.id === userId
    );

    if (!filtered.length) throw new NotFoundException('No se encontraron tareas');
    return filtered;
  }

  //Modificar los datos de la tarea
  async update(taskId: number, userId: number, role: Role, updateTaskDto: UpdateTaskDto): Promise<Task | null> {
    //Si el rol del usuario es 'user', se verifica que sea su tarea, si no es, se bloquea el proceso
    await this.verify(taskId, userId, role)

    //Si es el dueño o es developer/admin, continua
    await this.repoTask.update(taskId, { ...updateTaskDto, updated: true })
    return this.findOne(taskId, userId, role, true)
  }

  //Marcar una tarea como completa
  async completeTask(taskId: number, userId: number, role: Role): Promise<void> {
    //Si el rol del usuario es 'user', se verifica que sea su tarea, si no es, se bloquea el proceso
    await this.verify(taskId, userId, role)

    await this.repoTask.update(taskId, { completed: true })
  }

  //Hacer una tarea publica
  async makePublic(taskId: number, userId: number, role: Role): Promise<Task | null> {
    //Si el rol del usuario es 'user', se verifica que sea su tarea, si no es, se bloquea el proceso
    await this.verify(taskId, userId, role)

    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    await this.repoTask.update(taskId, { public: true, code: code })
    return this.findOne(taskId, 0, Role.ADMIN, true)
  }

  //Unirse a una tarea
  async joinToTask(taskId: number, userId: number, code: string): Promise<void> {
    const task = await this.repoTask.findOne({
      where: { task_id: taskId },
      relations: ['members']
    });
    if (!task) throw new NotFoundException('Tarea no encontrada');
    if (!task.public) throw new ForbiddenException('Esta tarea es privada');
    const alreadyMember = task.members.some(m => m.id === userId);
    if (alreadyMember) throw new BadRequestException('Ya estás unido a esta tarea');
    if (task.code !== code) throw new ForbiddenException('Contraseña incorrecta');

    task.members.push({ id: userId } as User);
    await this.repoTask.save(task);
  }

  //Salirse o expulsar a alguien de una tarea 
  async leaveTask(taskId: number, userId: number, userLeavingId: number, role: Role): Promise<void> {
    const task = await this.repoTask.findOne({
      where: { task_id: taskId },
      relations: ['members', 'user']
    });
    if (!task) throw new NotFoundException('Tarea no encontrada');
    const alreadyMember = task.members.some(m => m.id === userLeavingId);
    if (!alreadyMember) throw new BadRequestException("El usuario no está unido a esta tarea");
    if (role == 'USER' && task.user.id != userId && userId != userLeavingId) throw new ForbiddenException("No tienes permiso para expulsar miembros")

    task.members = task.members.filter(m => m.id !== userLeavingId);
    await this.repoTask.save(task);
  }

  //Eliminar una tarea
  async remove(taskId: number, userId: number, role: Role): Promise<void> {
    //Si el rol del usuario es 'user', se verifica que sea su tarea, si no es, se bloquea el proceso
    await this.verify(taskId, userId, role)

    await this.repoTask.delete(taskId)
  }

  //Esta funcion verifica que la tarea exista y que el usuario sea dueño de la tarea a modificar/eliminar
  async verify(taskId: number, userId: number, role: Role): Promise<void> {
    const task = await this.repoTask.findOne({
      where: { task_id: taskId },
      relations: ['user']
    })
    if (!task) throw new NotFoundException("Tarea no encontrada");
    if (role === 'USER' && task!.user.id !== userId) throw new ForbiddenException('Las tareas solo se pueden modificar/eliminar por el dueño');
  }
}
