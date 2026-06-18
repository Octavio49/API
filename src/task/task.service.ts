import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Task } from './entities/task.entity';
import { Repository } from 'typeorm';
import { Role } from '../enum/role';
import { User } from '../auth/entities/user.entity';
import { MemberStress } from '../member-stress/entities/member-stress.entity';

@Injectable()
export class TaskService {

  constructor(@InjectRepository(Task) private repoTask: Repository<Task>, @InjectRepository(MemberStress) private memberStressRepository: Repository<MemberStress>) {

  }

  async create(createTaskDto: CreateTaskDto, userId: number, memberIds: number[]): Promise<Task> {
    const { stressLevel, ...taskData } = createTaskDto;

    const task = new Task();
    Object.assign(task, taskData);

    task.user = { id: userId } as User;
    task.members = memberIds.map(id => ({ id } as User));

    const savedTask = await this.repoTask.save(task);

    const memberStress = this.memberStressRepository.create({
      level: stressLevel,
      user: { id: userId } as User,
      task: { task_id: savedTask.task_id } as Task,
    });

    await this.memberStressRepository.save(memberStress);

    return savedTask;
  }

  //Obtener todas las teras en la base de datos
  async findAll(): Promise<Task[]> {
    return this.repoTask.find({ relations: ['user'], select: { user: { id: true, username: true } } });
  }

  //Obtener todas las teras del usuario logeado o de un usuario especifico
  async findAllUser(user_id: number): Promise<Task[]> {
    // Busca tareas donde el usuario es creador O es miembro
    return this.repoTask
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.user', 'user')
      .leftJoinAndSelect('task.members', 'members')
      .leftJoinAndMapOne(
        'task.stressLevel',
        'task.stressLevels',
        'stress',
        'stress.user_id = :id',
        { id: user_id }
      )
      .where('user.id = :id', { id: user_id })
      .orWhere('members.id = :id', { id: user_id })
      .getMany();
  }

  //Obtener una tarea por id
  async findOne(id: number, user_id: number): Promise<Task | null> {
    const task = await this.repoTask
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.user', 'user')
      .leftJoinAndSelect('task.members', 'members')
      .leftJoinAndMapOne(
        'task.stressLevel',
        'task.stressLevels',
        'stress',
        'stress.user_id = :user_id',
        { user_id }
      )
      .where('task.task_id = :id', { id })
      .getOne();

    if (!task) throw new NotFoundException('Tarea no encontrada');
    return task;
  }

  //Modificar los datos de la tarea, asi como el nivel de estres del dueño de la tarea
  async update(taskId: number, userId: number, role: Role, updateTaskDto: UpdateTaskDto): Promise<Task | null> {
    //Si el rol del usuario es 'user', se verifica que sea su tarea, si no es, se bloquea el proceso
    await this.verify(taskId, userId, role)

    //Se separa el nivel de estrés para no intentar guardarlo en Task
    const { stressLevel, ...taskData } = updateTaskDto;

    //Actualiza los datos normales de la tarea
    await this.repoTask.update(taskId, {
      ...taskData,
      updated: true
    });

    //Si viene stressLevel, se actualiza la relación user-task
    if (stressLevel !== undefined) {
      const memberStress = await this.memberStressRepository.findOne({
        where: {
          user: { id: userId },
          task: { task_id: taskId }
        }
      });

      if (!memberStress) {
        const newMemberStress = this.memberStressRepository.create({
          level: stressLevel,
          user: { id: userId } as User,
          task: { task_id: taskId } as Task
        });

        await this.memberStressRepository.save(newMemberStress);
      } else {
        memberStress.level = stressLevel;
        await this.memberStressRepository.save(memberStress);
      }
    }

    return this.findOne(taskId, userId)
  }

  //Marcar una tarea como completa
  async completeTask(taskId: number, userId: number, role: Role): Promise<void> {
    //Si el rol del usuario es 'user', se verifica que sea su tarea, si no es, se bloquea el proceso
    await this.verify(taskId, userId, role)

    await this.repoTask.update(taskId, { completed: true })
  }

  async remove(taskId: number, userId: number, role: Role): Promise<void> {
    //Si el rol del usuario es 'user', se verifica que sea su tarea, si no es, se bloquea el proceso
    await this.verify(taskId, userId, role)

    await this.repoTask.delete(taskId)
  }

  //Esta funcion solamente verifica que el usuario sea dueño de la tarea a modificar/eliminar
  async verify(taskId: number, userId: number, role: Role): Promise<void> {
    const task = await this.findOne(taskId, userId)
    if (role === 'USER') {
      const esDueno = task!.user?.id === userId
      if (!esDueno) throw new ForbiddenException('Solo el dueño o miembros pueden modificar esta tarea')
    }
  }


  async findPublic(): Promise<Task[]> {
    return this.repoTask.find({
      where: { public: true },
      relations: ['user', 'members'],
      select: { user: { id: true, username: true }, members: { id: true, username: true } }
    });
  }

  async joinByCode(code: string, userId: number): Promise<Task> {
    const task = await this.repoTask.findOne({
      where: { code, public: true },
      relations: ['user', 'members']
    });

    if (!task) throw new NotFoundException('Tarea no encontrada o código inválido');

    if (task.user.id === userId)
      throw new ForbiddenException('Ya eres el creador de esta tarea');

    const yaEsMiembro = task.members?.some(m => m.id === userId);

    if (!yaEsMiembro) {
      task.members = [...(task.members ?? []), { id: userId } as any];
      await this.repoTask.save(task);

      //Siempre que un usuario se una a una tarea, se crea un registro de estrés para ese usuario y esa tarea con nivel de estrés 5 por defecto
      const memberStress = this.memberStressRepository.create({
        level: 5,
        user: { id: userId } as User,
        task: { task_id: task.task_id } as Task,
      });

      await this.memberStressRepository.save(memberStress);
    }

    return task;
  }

  async searchPublic(query: string): Promise<Task[]> {
    return this.repoTask
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.user', 'user')
      .where('task.public = true')
      .andWhere('task.title LIKE :q', { q: `%${query}%` })
      .getMany();
  }
}
