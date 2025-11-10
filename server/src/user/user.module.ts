import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { JwtStrategy } from './strategies/user.jwt.strategy';
import { secret, user_jwt_expires_in } from '@/shared/config';
import { JwtResetStrategy } from './strategies/user.jwt-reset.strategy';
import { JwtSetupStrategy } from './strategies/user.jwt-setup.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: secret,
      signOptions: {
        expiresIn: user_jwt_expires_in || '7d',
      },
    }),
  ],
  controllers: [UserController],
  providers: [
    UserService,
    JwtResetStrategy,
    JwtSetupStrategy,
    JwtStrategy,
  ],
  exports: [
    JwtStrategy,
    JwtResetStrategy,
    JwtSetupStrategy,
    PassportModule,
  ],
})
export class UserModule {}
