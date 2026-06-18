import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { TaskModule } from './task/task.module';
import { StressLevelModule } from './stress-level/stress-level.module';
import { MemberStressModule } from './member-stress/member-stress.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    
    TypeOrmModule.forRoot({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT ?? '3306'),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    autoLoadEntities:true,
    synchronize: true,
    ssl: { rejectUnauthorized: false } // crea las tablas automáticamente la primera vez
    }),AuthModule,TaskModule,StressLevelModule, MemberStressModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
