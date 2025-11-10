import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SchedulerRegistry } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { setupSecret, setup_jwt_expires_in } from '../shared/config';

const SETUP_INTERVAL_NAME = 'setup-token-generator';
const TREINTA_MINUTOS_MS = 30 * 60 * 1000;

@Injectable()
export class SetupTokenService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SetupTokenService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly schedulerRegistry: SchedulerRegistry,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async onApplicationBootstrap() {
    this.logger.log('Verificando estado del usuario administrador (id: 1)...');
    const userExists = await this.doesAdminUserExist();

    if (userExists) {
      this.logger.log('El usuario (id: 1) ya existe. El generador de tokens de setup no se iniciará.');
      return;
    }

    this.logger.warn('¡ADVERTENCIA! El usuario (id: 1) no existe.');
    this.logger.warn('Iniciando generador de tokens de setup...');

    this.generateAndLogToken();

    const interval = setInterval(
      () => this.generateAndLogToken(),
      TREINTA_MINUTOS_MS
    );

    this.schedulerRegistry.addInterval(SETUP_INTERVAL_NAME, interval);
  }

  async generateAndLogToken() {
    const userExists = await this.doesAdminUserExist();

    if (userExists) {
      this.logger.log('Usuario (id: 1) detectado. Deteniendo el generador de tokens de setup.');
      this.schedulerRegistry.deleteInterval(SETUP_INTERVAL_NAME);
      return;
    }

    const payload = { scope: 'setup_app' };
    const token = this.jwtService.sign(payload, {
      secret: setupSecret,
      expiresIn: setup_jwt_expires_in,
    });

    this.logger.log('================================================================');
    this.logger.log('|| NUEVO TOKEN DE SETUP (Válido por 30 min):');
    this.logger.log(`|| ${token}`);
    this.logger.log('================================================================');
  }

  private async doesAdminUserExist(): Promise<boolean> {
    try {
      const user = await this.userRepository.findOne({ where: { id: 1 } });
      return !!user;
    } catch (error) {
      this.logger.error('Error al verificar la existencia del usuario', error.stack);
      return false;
    }
  }
}