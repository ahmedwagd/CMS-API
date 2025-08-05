import { Injectable } from '@nestjs/common';
import { UsersService } from 'src/modules/users/users.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly prismaService: PrismaService,
  ) {}
  async login() {
    return 'login';
  }
  async register() {
    return 'register';
  }
  async refresh() {
    return 'refresh';
  }
  async logout() {
    return 'logout';
  }
  async resetPassword() {
    return 'resetPassword';
  }
  async confirmResetPassword() {
    return 'confirmResetPassword';
  }
  async getProfile() {
    return 'getProfile';
  }
  async updateProfile() {
    return 'updateProfile';
  }
  async getWallet() {
    return 'getWallet';
  }
  async updateWallet() {
    return 'updateWallet';
  }
}
