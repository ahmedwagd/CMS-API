// import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
// import { ConfigType } from '@nestjs/config';
// import { PassportStrategy } from '@nestjs/passport';
// import { Request } from 'express';
// import { ExtractJwt, Strategy, StrategyOptionsWithRequest } from 'passport-jwt';
// import type { AuthJwtPayload } from 'src/common/types/auth-jwtPayload';
// import refreshConfig from 'src/config/refresh.config';
// import { AUTH_CONSTANTS } from 'src/common/constants/constants';
// import { AuthService } from 'src/auth/auth.service';

// interface RefreshRequest extends Request {
//   body: { refresh: string }; // Define the expected body structure
// }

// @Injectable()
// export class RefreshStrategy extends PassportStrategy(
//   Strategy,
//   AUTH_CONSTANTS.STRATEGIES.REFRESH,
// ) {
//   constructor(
//     @Inject(refreshConfig.KEY)
//     private readonly refreshTokenConfig: ConfigType<typeof refreshConfig>,
//     private readonly authService: AuthService,
//   ) {
//     super({
//       jwtFromRequest: ExtractJwt.fromBodyField('refresh'),
//       secretOrKey: refreshTokenConfig.secret!,
//       ignoreExpiration: false,
//       passReqToCallback: true,
//     } as StrategyOptionsWithRequest);
//   }
//   // request.user
//   async validate(req: RefreshRequest, payload: AuthJwtPayload) {
//     const userId = payload.sub;
//     const refreshToken = req.body.refresh;

//     if (!refreshToken) {
//       throw new UnauthorizedException('Refresh token is required');
//     }

//     return this.authService.validateRefreshToken(userId, refreshToken);
//   }
// }
