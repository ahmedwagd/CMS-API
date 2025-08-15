import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { AuthJwtPayload } from '../types/auth-jwtPayload';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow('jwt-refresh.secret'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: AuthJwtPayload) {
    const refreshToken = req.get('authorization')?.replace('Bearer', '').trim();
    if (!refreshToken) {
      throw new UnauthorizedException();
    }

    return {
      ...payload,
      refreshToken,
      // Ensure consistent structure
      id: payload.sub,
    };
  }
}
