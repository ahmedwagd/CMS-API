import { Exclude } from 'class-transformer';

export class UserResponseDto {
  id: string;
  email: string;
  name: string;
  roleId: string;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  role?: {
    id: string;
    name: string;
    description?: string;
  };

  @Exclude()
  password?: string;

  @Exclude()
  hashedRefreshToken?: string;
}
