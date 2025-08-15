import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from 'src/modules/users/users.service';
import { AuthJwtPayload } from '../types/auth-jwtPayload';
/**
 * JWT strategy
 * @description This strategy is used to validate JWT tokens
 * @param payload
 * @returns UserResponseDto
 * @throws UnauthorizedException if token is invalid
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow('jwt.secret'),
    });
  }

  async validate(payload: AuthJwtPayload) {
    // You can choose to either:
    // Option 1: Trust the JWT payload (faster, but token must be refreshed when permissions change)
    const user = {
      id: payload.sub,
      email: payload.email,
      role: { name: payload.role },
      permissions: payload.permissions,
    };

    // Option 2: Always fetch fresh data from DB (slower, but always current)
    // const user = await this.usersService.findOne(payload.sub);
    // if (!user || !user.isActive) {
    //   throw new UnauthorizedException();
    // }

    return user;
  }
}
