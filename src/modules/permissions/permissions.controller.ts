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
// import { JwtAuthGuard } from '../auth/guards';
// import { RequirePermissions } from '../auth/decorators';
// import { PermissionsGuard } from '../auth/guards/permissions.guard';

@Controller('permissions')
// @UseGuards(JwtAuthGuard, PermissionsGuard)
export class PermissionsController {
  constructor(private rolesService: RolesService) {}

  @Post()
  // @RequirePermissions('manage_permissions')
  createPermission(@Body() createPermissionDto: CreatePermissionDto) {
    return this.rolesService.createPermission(createPermissionDto);
  }

  @Get()
  // @RequirePermissions('view_permissions')
  findAllPermissions(@Query('category') category?: string) {
    if (category) {
      return this.rolesService.findPermissionsByCategory(category);
    }
    return this.rolesService.findAllPermissions();
  }

  @Put(':id')
  // @RequirePermissions('manage_permissions')
  updatePermission(
    @Param('id') id: string,
    @Body() updateData: Partial<CreatePermissionDto>,
  ) {
    return this.rolesService.updatePermission(id, updateData);
  }

  @Delete(':id')
  // @RequirePermissions('manage_permissions')
  deletePermission(@Param('id') id: string) {
    return this.rolesService.deletePermission(id);
  }
}
