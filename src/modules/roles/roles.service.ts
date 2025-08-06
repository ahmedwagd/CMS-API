import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

export interface CreateRoleDto {
  name: string;
  description?: string;
  permissionIds?: string[];
}

export interface CreatePermissionDto {
  name: string;
  description?: string;
  category?: string;
}

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  // Role Management
  async createRole(createRoleDto: CreateRoleDto) {
    const { name, description, permissionIds = [] } = createRoleDto;

    // Check if role already exists
    const existingRole = await this.prisma.role.findUnique({
      where: { name },
    });

    if (existingRole) {
      throw new ConflictException('Role with this name already exists');
    }

    // Verify permissions exist
    if (permissionIds.length > 0) {
      const permissions = await this.prisma.permission.findMany({
        where: { id: { in: permissionIds } },
      });

      if (permissions.length !== permissionIds.length) {
        throw new NotFoundException('One or more permissions not found');
      }
    }

    const role = await this.prisma.role.create({
      data: {
        name,
        description,
        permissions: {
          create: permissionIds.map((permissionId) => ({
            permission: { connect: { id: permissionId } },
          })),
        },
      },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    return role;
  }

  async findAllRoles() {
    return this.prisma.role.findMany({
      where: { isActive: true },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: { users: true },
        },
      },
    });
  }

  async findRoleById(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return role;
  }

  async updateRole(id: string, updateData: Partial<CreateRoleDto>) {
    const { permissionIds, ...roleData } = updateData;

    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Update role and permissions in a transaction
    return this.prisma.$transaction(async (prisma) => {
      // Update basic role data
      const updatedRole = await prisma.role.update({
        where: { id },
        data: roleData,
      });

      // Update permissions if provided
      if (permissionIds) {
        // Remove existing permissions
        await prisma.rolePermission.deleteMany({
          where: { roleId: id },
        });

        // Add new permissions
        if (permissionIds.length > 0) {
          await prisma.rolePermission.createMany({
            data: permissionIds.map((permissionId) => ({
              roleId: id,
              permissionId,
            })),
          });
        }
      }

      // Return updated role with permissions
      return prisma.role.findUnique({
        where: { id },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      });
    });
  }

  async deleteRole(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (role._count.users > 0) {
      throw new ConflictException('Cannot delete role with assigned users');
    }

    return this.prisma.role.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // Permission Management
  async createPermission(createPermissionDto: CreatePermissionDto) {
    const { name, description, category } = createPermissionDto;

    const existingPermission = await this.prisma.permission.findUnique({
      where: { name },
    });

    if (existingPermission) {
      throw new ConflictException('Permission with this name already exists');
    }

    return this.prisma.permission.create({
      data: { name, description, category },
    });
  }

  async findAllPermissions() {
    return this.prisma.permission.findMany({
      where: { isActive: true },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
  }

  async findPermissionsByCategory(category: string) {
    return this.prisma.permission.findMany({
      where: { category, isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async updatePermission(id: string, updateData: Partial<CreatePermissionDto>) {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
    });
    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    return this.prisma.permission.update({
      where: { id },
      data: updateData,
    });
  }

  async deletePermission(id: string) {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
      include: { _count: { select: { roles: true } } },
    });

    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    if (permission._count.roles > 0) {
      throw new ConflictException('Cannot delete permission assigned to roles');
    }

    return this.prisma.permission.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // Utility Methods
  async assignPermissionsToRole(roleId: string, permissionIds: string[]) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Verify all permissions exist
    const permissions = await this.prisma.permission.findMany({
      where: { id: { in: permissionIds } },
    });

    if (permissions.length !== permissionIds.length) {
      throw new NotFoundException('One or more permissions not found');
    }

    // Remove existing permissions and add new ones
    await this.prisma.$transaction([
      this.prisma.rolePermission.deleteMany({ where: { roleId } }),
      this.prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({ roleId, permissionId })),
      }),
    ]);

    return this.findRoleById(roleId);
  }

  async getUserPermissions(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user.role?.permissions.map((rp) => rp.permission) || [];
  }
}
