import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import jwtConfig from 'src/config/jwt.config';
import { AuthController } from './auth.controller';
import refreshConfig from 'src/config/refresh.config';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from 'src/modules/users/users.module';

@Module({
  imports: [
    JwtModule.registerAsync(jwtConfig.asProvider()),
    ConfigModule.forFeature(jwtConfig),
    ConfigModule.forFeature(refreshConfig),
    PassportModule,
    // PrismaModule,
    UsersModule,
  ],
  providers: [AuthService],
  exports: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}

// import { Module } from '@nestjs/common';
// import { AuthService } from './auth.service';
// import jwtConfig from '../config/jwt.config';
// import refreshConfig from '../config/refresh.config';
// // import googleOauthConfig from '../config/google-oauth.config';
// // import { GoogleStrategy } from './strategies/google.strategy';
// // import { APP_GUARD } from '@nestjs/core';
// // import { JwtAuthGuard } from 'src/common/guards/jwt-auth/jwt-auth.guard';
// // import { RolesGuard } from 'src/common/guards/roles/roles.guard';
// import { PrismaModule } from 'src/prisma/prisma.module';
// import { LocalStrategy } from 'src/common/strategies/local.strategy';
// import { JwtStrategy } from 'src/common/strategies/jwt.strategy';
// import { RefreshStrategy } from 'src/common/strategies/refresh-token.strategy';
// import { UsersModule } from 'src/modules/users/users.module';

// @Module({
//   imports: [
//     JwtModule.registerAsync(jwtConfig.asProvider()),
//     ConfigModule.forFeature(jwtConfig),
//     ConfigModule.forFeature(refreshConfig),
//     // ConfigModule.forFeature(googleOauthConfig),
//     PrismaModule,
//     UsersModule
//   ],
//   controllers: [AuthController],
//   providers: [
//     AuthService,
//     LocalStrategy,
//     JwtStrategy,
//     RefreshStrategy,
//     // GoogleStrategy,
//     // {
//     //   provide: APP_GUARD,
//     //   useClass: JwtAuthGuard, //@UseGuard(JwtAuthGuard)
//     // },
//     // {
//     //   provide: APP_GUARD,
//     //   useClass: RolesGuard, //@UseGuard(Roles)
//     // },
//   ],
// })
// export class AuthModule { }
