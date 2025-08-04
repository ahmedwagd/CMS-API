import { registerAs } from '@nestjs/config';
import { JwtSignOptions } from '@nestjs/jwt';
import { AUTH_CONSTANTS } from 'src/common/constants/constants';

export default registerAs(
  AUTH_CONSTANTS.STRATEGIES.REFRESH,
  (): JwtSignOptions => ({
    secret: process.env.JWT_REFRESH_SECRET,
    expiresIn: process.env.JWT_REFRESH_EXP_IN,
  }),
);
