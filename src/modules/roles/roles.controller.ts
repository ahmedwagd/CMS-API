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
import {
  RolesService,
  CreateRoleDto,
  CreatePermissionDto,
} from './roles.service';
// import { JwtAuthGuard } from '../auth/guards';
// import { RequirePermissions } from '../auth/decorators';
// import { PermissionsGuard } from '../auth/guards/permissions.guard';

@Controller('roles')
// @UseGuards(JwtAuthGuard, PermissionsGuard)
export class RolesController {
  constructor(private rolesService: RolesService) {}

  // Role endpoints
  @Post()
  // @RequirePermissions('manage_roles')
  createRole(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.createRole(createRoleDto);
  }

  @Get()
  // @RequirePermissions('view_roles')
  findAllRoles() {
    return this.rolesService.findAllRoles();
  }

  @Get(':id')
  // @RequirePermissions('view_roles')
  findRoleById(@Param('id') id: string) {
    return this.rolesService.findRoleById(id);
  }

  @Put(':id')
  // @RequirePermissions('manage_roles')
  updateRole(
    @Param('id') id: string,
    @Body() updateData: Partial<CreateRoleDto>,
  ) {
    return this.rolesService.updateRole(id, updateData);
  }

  @Delete(':id')
  // @RequirePermissions('manage_roles')
  deleteRole(@Param('id') id: string) {
    return this.rolesService.deleteRole(id);
  }

  @Post(':id/permissions')
  // @RequirePermissions('manage_roles')
  assignPermissions(
    @Param('id') roleId: string,
    @Body() body: { permissionIds: string[] },
  ) {
    return this.rolesService.assignPermissionsToRole(
      roleId,
      body.permissionIds,
    );
  }
}
