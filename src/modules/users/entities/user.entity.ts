export class User {
  id: string;
  email: string;
  name: string;
  roleId: string;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  role?: {
    id: string;
    name: string;
    description?: string;
    permissions?: Array<{
      permission: {
        id: string;
        name: string;
        description?: string;
        category?: string;
      };
    }>;
  };

  // Exclude sensitive fields from responses
  password?: never;
  hashedRefreshToken?: never;
}
