import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  @Get('admin-only')
  @Roles('admin')
  getAdminData(@CurrentUser() user: any) {
    return { message: 'This is admin-only data', user };
  }

  @Get('me')
  getCurrentUser(@CurrentUser() user: any) {
    return user;
  }
}
