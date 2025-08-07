import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { RolesService, CreatePermissionDto } from '../roles/roles.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { RequirePermissions } from 'src/common/decorators/permissions.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';

@Controller('permissions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PermissionsController {
  constructor(private rolesService: RolesService) {}

  @Post()
  @Roles('admin', 'super_admin')
  @RequirePermissions('manage_permissions')
  createPermission(@Body() createPermissionDto: CreatePermissionDto) {
    return this.rolesService.createPermission(createPermissionDto);
  }

  @Get()
  @Roles('admin', 'super_admin')
  @RequirePermissions('view_permissions')
  findAllPermissions(@Query('category') category?: string) {
    if (category) {
      return this.rolesService.findPermissionsByCategory(category);
    }
    return this.rolesService.findAllPermissions();
  }

  @Put(':id')
  @Roles('admin', 'super_admin')
  @RequirePermissions('manage_permissions')
  updatePermission(
    @Param('id') id: string,
    @Body() updateData: Partial<CreatePermissionDto>,
  ) {
    return this.rolesService.updatePermission(id, updateData);
  }

  @Delete(':id')
  @Roles('admin', 'super_admin')
  @RequirePermissions('manage_permissions')
  deletePermission(@Param('id') id: string) {
    return this.rolesService.deletePermission(id);
  }
}
