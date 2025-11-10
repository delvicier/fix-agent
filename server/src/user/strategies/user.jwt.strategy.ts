import { secret } from '@/shared/config';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface JwtPayload {
  usuario: string;
  rol: string;
  id: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret as string,
    });
  }

  async validate(payload: JwtPayload) {
    if (payload.rol !== 'admin') {
       throw new UnauthorizedException('Token inválido');
    }

    return { id: payload.id, usuario: payload.usuario };
  }
}