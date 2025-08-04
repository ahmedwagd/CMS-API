import { registerAs } from '@nestjs/config';
import { JwtModuleOptions } from '@nestjs/jwt';
import { AUTH_CONSTANTS } from 'src/common/constants/constants';

export default registerAs(
  AUTH_CONSTANTS.STRATEGIES.JWT,
  (): JwtModuleOptions => ({
    secret: process.env.JWT_SECRET,
    signOptions: {
      expiresIn: process.env.JWT_EXP_IN,
    },
  }),
);
