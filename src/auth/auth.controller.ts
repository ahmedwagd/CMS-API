import { Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post()
  async login() {
    return this.authService.login();
  }
  @Post('logout')
  async logout() {
    return this.authService.logout();
  }
  @Post('register')
  async register() {
    return this.authService.register();
  }
  //   @Post('refresh')
  //   async refresh() {
  //     return this.authService.refresh();
  //   }
  //   @Post('reset-password')
  //   async resetPassword() {
  //     return this.authService.resetPassword();
  //   }
  //   @Post('confirm-reset-password')
  //   async confirmResetPassword() {
  //     return this.authService.confirmResetPassword();
  //   }
  //   @Post('get-profile')
  //   async getProfile() {
  //     return this.authService.getProfile();
  //   }
  //   @Post('update-profile')
  //   async updateProfile() {
  //     return this.authService.updateProfile();
  //   }
  //   @Post('get-permissions')
  //   async getPermissions() {
  //     return this.authService.getPermissions();
  //   }
  //   @Post('get-user-permissions')
  //   async getUserPermissions() {
  //     return this.authService.getUserPermissions();
  //   }
}
