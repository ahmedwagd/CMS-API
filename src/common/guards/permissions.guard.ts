import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      'permissions',
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      return false;
    }

    // Handle both old structure (user.role.permissions) and new JWT structure (user.permissions)
    let userPermissions: string[] = [];

    if (user.permissions && Array.isArray(user.permissions)) {
      // New JWT payload structure
      userPermissions = user.permissions;
    } else if (user.role?.permissions) {
      // Old database structure (fallback)
      userPermissions = user.role.permissions.map(
        (rp: any) => rp.permission.name,
      );
    }

    return requiredPermissions.some((permission) =>
      userPermissions.includes(permission),
    );
  }
}
