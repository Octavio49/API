import { ConflictException, Injectable } from '@nestjs/common';
import { CreateStressProfileDto } from './dto/create-stress-profile.dto';
import { UpdateStressLevelDto } from './dto/update-stress-level.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { StressProfile } from './entities/stress_profile.entity';
import { Brackets, Repository } from 'typeorm';
import { Task } from '../task/entities/task.entity';

@Injectable()
export class StressLevelService {

  constructor(
    @InjectRepository(StressProfile)
    private stressRepo: Repository<StressProfile>,
    @InjectRepository(Task)
    private taskRepo: Repository<Task>
  ) { }

  async crearPerfil(dto: CreateStressProfileDto, userId: number) {

    const existe = await this.stressRepo.findOne({
      where: { user: { id: userId } }
    });
    if (existe) throw new ConflictException('El cuestionario inicial ya fue completado');

    const perfil = this.stressRepo.create({
      ...dto,
      user: { id: userId }
    });
    return this.stressRepo.save(perfil);
  }

  async obtenerNivel(userId: number) {
    const perfil = await this.stressRepo.findOne({
      where: { user: { id: userId } }
    });
    if (!perfil) return { existe: false };   // null = aún no completó el cuestionario

    // Obtener tareas activas del usuario con su nivel de estrés personalizado
    const tareas = await this.taskRepo
      .createQueryBuilder('task')
      .leftJoin('task.user', 'user')
      .leftJoin('task.members', 'members')
      .leftJoinAndMapOne(
        'task.stressLevel',
        'task.stressLevels',
        'stress',
        'stress.user_id = :id',
        { id: userId }
      )
      .where(new Brackets(qb => {
        qb.where('user.id = :id', { id: userId })
          .orWhere('members.id = :id', { id: userId });
      }))
      .andWhere('task.completed = false')
      .getMany();

    // Promedio de estrés de tareas activas del usuario
    const promedioEstres = tareas.length > 0
      ? tareas.reduce((sum, t: any) => sum + (t.stressLevel?.level || 0), 0) / tareas.length
      : 0;

    // Suma de horas diarias ocupadas por tareas activas
    const horasOcupadas = tareas.reduce((sum, t) => sum + (t.horasDia || 0), 0);
    const horasDisponibles = 24 - perfil.horasSueno;
    const excedeHoras = horasOcupadas > horasDisponibles;

    // Penalización extra si duerme poco (menos de 6 horas)
    const penalizacionSueno = perfil.horasSueno < 6 ? (6 - perfil.horasSueno) : 0;

    // Nivel final: 60% cuestionario + 40% tareas
    let nivelFinal = (perfil.puntuacion * 0.6) + (promedioEstres * 0.4) + penalizacionSueno;
    if (nivelFinal > 10) nivelFinal = 10;

    return {
      existe: true,
      puntuacion: perfil.puntuacion,
      categoria: perfil.categoria,
      nivelFinal: Math.round(nivelFinal * 10) / 10,
      impactoTareas: Math.round(promedioEstres * 10) / 10,
      horasOcupadas,
      horasDisponibles,
      alertaSueno: excedeHoras
    };
  }

  findAll() {
    return `This action returns all stressLevel`;
  }

  findOne(id: number) {
    return `This action returns a #${id} stressLevel`;
  }

  update(id: number, updateStressLevelDto: UpdateStressLevelDto) {
    return `This action updates a #${id} stressLevel`;
  }

  remove(id: number) {
    return `This action removes a #${id} stressLevel`;
  }
}
