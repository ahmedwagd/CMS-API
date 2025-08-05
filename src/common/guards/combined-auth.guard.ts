import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { PermissionsGuard } from './permissions.guard';

@Injectable()
export class CombinedAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtGuard: JwtAuthGuard,
    private rolesGuard: RolesGuard,
    private permissionsGuard: PermissionsGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // First check JWT authentication
    const isAuthenticated = await this.jwtGuard.canActivate(context);
    if (!isAuthenticated) {
      return false;
    }

    // Check roles if specified
    const hasRequiredRole = this.rolesGuard.canActivate(context);
    if (!hasRequiredRole) {
      return false;
    }

    // Check permissions if specified
    const hasRequiredPermission = this.permissionsGuard.canActivate(context);
    if (!hasRequiredPermission) {
      return false;
    }

    return true;
  }
}
