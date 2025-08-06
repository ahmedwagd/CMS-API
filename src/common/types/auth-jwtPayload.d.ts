export type AuthJwtPayload = {
  sub: string; // user id
  email: string;
  roleId: string;
  iat?: number;
  exp?: number;
};
