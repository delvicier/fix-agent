import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from './user.entity';
import { UserCreateDto } from './dto/user-create.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UserUpdateDto } from './dto/user-update.dto';
import { UserPasswordUpdateDto } from './dto/user-password-update.dto';
import { UserResetPasswordDto } from './dto/user-reset-password.dto';
import { resetSecret } from '@/shared/config';

export interface JwtPayload {
  usuario: string;
  id: number;
}

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async createOrUpdateUser(userCreateDto: UserCreateDto): Promise<{ message: string, secret_key: string }> {
    const { usuario, contraseña } = userCreateDto;

    const secretKeyPlainText = crypto.randomBytes(32).toString('hex');

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(contraseña, salt);
    const hashedSecretKey = await bcrypt.hash(secretKeyPlainText, salt);

    const userToSave = this.userRepository.create({
      id: 1,
      usuario: usuario,
      contraseña: hashedPassword,
      secret_key: hashedSecretKey,
    });

    try {
      await this.userRepository.save(userToSave);
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT' && error.message.includes('UNIQUE')) {
        throw new ConflictException(`El nombre de usuario '${usuario}' ya existe.`);
      }
      throw error;
    }

    return {
      message: 'Usuario configurado. Guarda este secret_key de forma segura.',
      secret_key: secretKeyPlainText,
    };
  }

  async login(loginDto: UserCreateDto): Promise<{ access_token: string }> {
    const { usuario, contraseña } = loginDto;
    const user = await this.userRepository.findOne({ where: { id: 1 } });
    if (!user) {
      throw new NotFoundException('No se ha configurado ningún usuario.');
    }
    const isPasswordMatch = await bcrypt.compare(contraseña, user.contraseña);
    if (user && isPasswordMatch) {
      const payload: JwtPayload = { id: user.id, usuario: user.usuario };
      const access_token = this.jwtService.sign(payload);
      return { access_token };
    } else {
      throw new UnauthorizedException('Credenciales incorrectas.');
    }
  }

  async createResetToken(secretKeyPlainText: string): Promise<{ reset_token: string }> {
    const user = await this.userRepository.findOne({ where: { id: 1 } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    const isSecretMatch = await bcrypt.compare(secretKeyPlainText, user.secret_key);
    if (!isSecretMatch) {
      throw new UnauthorizedException('Secret key inválido.');
    }

    const payload = { id: user.id, scope: 'reset_password' };

    const reset_token = this.jwtService.sign(payload, {
      secret: resetSecret,
      expiresIn: '30m',
    });

    return { reset_token };
  }

  async resetPassword(id: number, resetDto: UserResetPasswordDto): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    const salt = await bcrypt.genSalt();
    user.contraseña = await bcrypt.hash(resetDto.newPassword, salt);
    await this.userRepository.save(user);

    return { message: 'Contraseña actualizada correctamente.' };
  }

  async getProfile(id: number): Promise<Omit<User, 'contraseña' | 'secret_key'>> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    const { contraseña, secret_key, ...result } = user;
    return result;
  }

  async updateUser(id: number, userUpdateDto: UserUpdateDto): Promise<Omit<User, 'contraseña' | 'secret_key'>> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    user.usuario = userUpdateDto.usuario;
    try {
      await this.userRepository.save(user);
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT' && error.message.includes('UNIQUE')) {
        throw new ConflictException(`El nombre de usuario '${userUpdateDto.usuario}' ya existe.`);
      }
      throw error;
    }
    const { contraseña, secret_key, ...result } = user;
    return result;
  }

  async updatePassword(id: number, passDto: UserPasswordUpdateDto): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    const isMatch = await bcrypt.compare(passDto.oldPassword, user.contraseña);
    if (!isMatch) throw new UnauthorizedException('La contraseña anterior es incorrecta.');
    const salt = await bcrypt.genSalt();
    user.contraseña = await bcrypt.hash(passDto.newPassword, salt);
    await this.userRepository.save(user);
    return { message: 'Contraseña actualizada correctamente.' };
  }
}