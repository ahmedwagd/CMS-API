export type AuthJwtPayload = {
  sub: string;
  email: string;
  role: string; // Role name instead of roleId
  permissions: string[]; // Array of permission names
  iat?: number;
  exp?: number;
};
