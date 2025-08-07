import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as argon2 from 'argon2';

@Injectable()
export class SeederService {
  constructor(private prisma: PrismaService) {}

  //   async onModuleInit() {
  //     await this.seedPermissions();
  //     await this.seedRoles();
  //   }

  async seedDatabase() {
    console.log('🌱 Starting database seeding...');

    // Clear existing data (optional - be careful in production!)
    // await this.clearDatabase();

    // Seed in order: Permissions → Roles → RolePermissions → Users
    const permissions = await this.seedPermissions();
    const roles = await this.seedRoles();
    // await this.seedRolePermissions(roles, permissions);
    // await this.seedUsers(roles);

    console.log('✅ Database seeding completed!');
  }
  private async clearDatabase() {
    console.log('🧹 Clearing existing data...');
    await this.prisma.rolePermission.deleteMany();
    await this.prisma.user.deleteMany();
    await this.prisma.role.deleteMany();
    await this.prisma.permission.deleteMany();
  }
  private async seedPermissions() {
    const permissions = [
      // User Management
      { name: 'view_users', description: 'View users list', category: 'user' },
      {
        name: 'create_users',
        description: 'Create new users',
        category: 'user',
      },
      {
        name: 'edit_users',
        description: 'Edit user information',
        category: 'user',
      },
      { name: 'delete_users', description: 'Delete users', category: 'user' },

      // Role Management
      { name: 'view_roles', description: 'View roles list', category: 'role' },
      {
        name: 'manage_roles',
        description: 'Create, edit, delete roles',
        category: 'role',
      },

      // Permission Management
      {
        name: 'view_permissions',
        description: 'View permissions list',
        category: 'permission',
      },
      {
        name: 'manage_permissions',
        description: 'Create, edit, delete permissions',
        category: 'permission',
      },

      // Clinics Management
      {
        name: 'view_clinics',
        description: 'View clinic list',
        category: 'clinic',
      },
      {
        name: 'create_clinics',
        description: 'Create new clinics',
        category: 'clinic',
      },
      {
        name: 'edit_clinics',
        description: 'Edit clinic information',
        category: 'clinic',
      },
      {
        name: 'delete_clinics',
        description: 'Delete clinics',
        category: 'clinic',
      },

      // Patient Management
      {
        name: 'view_patients',
        description: 'View patient information',
        category: 'patient',
      },
      {
        name: 'create_patients',
        description: 'Register new patients',
        category: 'patient',
      },
      {
        name: 'edit_patients',
        description: 'Edit patient information',
        category: 'patient',
      },
      {
        name: 'delete_patients',
        description: 'Delete patient records',
        category: 'patient',
      },

      // Appointment Management
      {
        name: 'view_appointments',
        description: 'View appointments',
        category: 'appointment',
      },
      {
        name: 'create_appointments',
        description: 'Schedule appointments',
        category: 'appointment',
      },
      {
        name: 'edit_appointments',
        description: 'Modify appointments',
        category: 'appointment',
      },
      {
        name: 'cancel_appointments',
        description: 'Cancel appointments',
        category: 'appointment',
      },

      // Medical Records
      {
        name: 'view_medical_records',
        description: 'View medical records',
        category: 'medical',
      },
      {
        name: 'create_medical_records',
        description: 'Create medical records',
        category: 'medical',
      },
      {
        name: 'edit_medical_records',
        description: 'Edit medical records',
        category: 'medical',
      },

      // Billing
      {
        name: 'view_billing',
        description: 'View billing information',
        category: 'billing',
      },
      {
        name: 'manage_billing',
        description: 'Manage invoices and payments',
        category: 'billing',
      },

      // Reports
      {
        name: 'view_reports',
        description: 'View system reports',
        category: 'report',
      },
      {
        name: 'generate_reports',
        description: 'Generate custom reports',
        category: 'report',
      },
    ];

    for (const permission of permissions) {
      await this.prisma.permission.upsert({
        where: { name: permission.name },
        update: {},
        create: permission,
      });
    }
  }

  private async seedRoles() {
    // Get all permissions
    const allPermissions = await this.prisma.permission.findMany();
    const permissionMap = new Map(allPermissions.map((p) => [p.name, p.id]));

    // Define roles with their permissions
    const roles = [
      {
        name: 'super_admin',
        description: 'Full system access',
        permissions: allPermissions.map((p) => p.name), // All permissions
      },
      {
        name: 'admin',
        description: 'Administrative access',
        permissions: [
          'view_users',
          'create_users',
          'edit_users',
          'view_roles',
          'view_permissions',
          'view_patients',
          'create_patients',
          'edit_patients',
          'view_appointments',
          'create_appointments',
          'edit_appointments',
          'cancel_appointments',
          'view_medical_records',
          'create_medical_records',
          'edit_medical_records',
          'view_billing',
          'manage_billing',
          'view_reports',
          'generate_reports',
        ],
      },
      {
        name: 'doctor',
        description: 'Doctor access to patient care',
        permissions: [
          'view_patients',
          'create_patients',
          'edit_patients',
          'view_appointments',
          'create_appointments',
          'edit_appointments',
          'view_medical_records',
          'create_medical_records',
          'edit_medical_records',
          'view_billing',
        ],
      },
      {
        name: 'nurse',
        description: 'Nursing staff access',
        permissions: [
          'view_patients',
          'edit_patients',
          'view_appointments',
          'create_appointments',
          'view_medical_records',
          'create_medical_records',
        ],
      },
      {
        name: 'receptionist',
        description: 'Front desk operations',
        permissions: [
          'view_patients',
          'create_patients',
          'edit_patients',
          'view_appointments',
          'create_appointments',
          'edit_appointments',
          'cancel_appointments',
          'view_billing',
        ],
      },
      {
        name: 'billing_clerk',
        description: 'Billing and financial operations',
        permissions: [
          'view_patients',
          'view_appointments',
          'view_billing',
          'manage_billing',
          'view_reports',
        ],
      },
    ];

    for (const roleData of roles) {
      // Create or update role
      const role = await this.prisma.role.upsert({
        where: { name: roleData.name },
        update: { description: roleData.description },
        create: {
          name: roleData.name,
          description: roleData.description,
        },
      });

      // Clear existing permissions
      await this.prisma.rolePermission.deleteMany({
        where: { roleId: role.id },
      });

      // Add new permissions
      const rolePermissions = roleData.permissions
        .map((permName) => permissionMap.get(permName))
        .filter(Boolean)
        .map((permissionId) => ({
          roleId: role.id,
          permissionId,
        }));

      if (rolePermissions.length > 0) {
        await this.prisma.rolePermission.createMany({
          data: rolePermissions as { roleId: string; permissionId: string }[],
        });
      }
    }
  }

  // Todo: Update Permissions and Roles Seeds
  /*
  // src/prisma/seeding/seeding.service.ts - Updated permissions section
  private async seedPermissions() {
    const permissions = [
      // User Management
      { name: 'view_users', description: 'View users list', category: 'user' },
      { name: 'create_users', description: 'Create new users', category: 'user' },
      { name: 'edit_users', description: 'Edit user information', category: 'user' },
      { name: 'delete_users', description: 'Delete users', category: 'user' },

      // Role Management
      { name: 'view_roles', description: 'View roles list', category: 'role' },
      { name: 'manage_roles', description: 'Create, edit, delete roles', category: 'role' },

      // Permission Management
      { name: 'view_permissions', description: 'View permissions list', category: 'permission' },
      { name: 'manage_permissions', description: 'Create, edit, delete permissions', category: 'permission' },

      // Doctor Management
      { name: 'view_doctors', description: 'View doctor information', category: 'doctor' },
      { name: 'create_doctors', description: 'Register new doctors', category: 'doctor' },
      { name: 'edit_doctors', description: 'Edit doctor information', category: 'doctor' },
      { name: 'delete_doctors', description: 'Delete doctor records', category: 'doctor' },

      // Clinic Management
      { name: 'view_clinics', description: 'View clinic information', category: 'clinic' },
      { name: 'create_clinics', description: 'Create new clinics', category: 'clinic' },
      { name: 'edit_clinics', description: 'Edit clinic information', category: 'clinic' },
      { name: 'delete_clinics', description: 'Delete clinic records', category: 'clinic' },
      { name: 'manage_clinics', description: 'Full clinic management', category: 'clinic' },

      // Patient Management
      { name: 'view_patients', description: 'View patient information', category: 'patient' },
      { name: 'create_patients', description: 'Register new patients', category: 'patient' },
      { name: 'edit_patients', description: 'Edit patient information', category: 'patient' },
      { name: 'delete_patients', description: 'Delete patient records', category: 'patient' },

      // Appointment Management
      { name: 'view_appointments', description: 'View appointments', category: 'appointment' },
      { name: 'create_appointments', description: 'Schedule appointments', category: 'appointment' },
      { name: 'edit_appointments', description: 'Modify appointments', category: 'appointment' },
      { name: 'cancel_appointments', description: 'Cancel appointments', category: 'appointment' },

      // Medical Records
      { name: 'view_medical_records', description: 'View medical records', category: 'medical' },
      { name: 'create_medical_records', description: 'Create medical records', category: 'medical' },
      { name: 'edit_medical_records', description: 'Edit medical records', category: 'medical' },
      { name: 'delete_medical_records', description: 'Delete medical records', category: 'medical' },

      // Billing & Financial
      { name: 'view_billing', description: 'View billing information', category: 'billing' },
      { name: 'manage_billing', description: 'Manage invoices and payments', category: 'billing' },
      { name: 'view_financial_reports', description: 'View financial reports', category: 'billing' },

      // Wallet Management
      { name: 'view_wallets', description: 'View wallet information', category: 'wallet' },
      { name: 'manage_wallets', description: 'Manage patient wallets', category: 'wallet' },
      { name: 'process_transactions', description: 'Process wallet transactions', category: 'wallet' },

      // Reports & Analytics
      { name: 'view_reports', description: 'View system reports', category: 'report' },
      { name: 'generate_reports', description: 'Generate custom reports', category: 'report' },
      { name: 'view_analytics', description: 'View system analytics', category: 'report' },
      { name: 'export_data', description: 'Export system data', category: 'report' },

      // System Administration
      { name: 'system_settings', description: 'Manage system settings', category: 'system' },
      { name: 'audit_logs', description: 'View audit logs', category: 'system' },
      { name: 'backup_restore', description: 'Backup and restore data', category: 'system' },
    ];

    console.log(`🔐 Seeding ${permissions.length} permissions...`);

    for (const permission of permissions) {
      await this.prisma.permission.upsert({
        where: { name: permission.name },
        update: {},
        create: permission,
      });
    }

    console.log('✅ Permissions seeded successfully');
    return permissions;
  }

  // Updated roles with new permissions
  private async seedRoles() {
    console.log('👥 Seeding roles...');
    
    // Get all permissions
    const allPermissions = await this.prisma.permission.findMany();
    const permissionMap = new Map(allPermissions.map((p) => [p.name, p.id]));

    // Define roles with their permissions
    const roles = [
      {
        name: 'super_admin',
        description: 'Full system access with all permissions',
        permissions: allPermissions.map((p) => p.name), // All permissions
      },
      {
        name: 'admin',
        description: 'Administrative access to manage operations',
        permissions: [
          // User Management
          'view_users', 'create_users', 'edit_users',
          
          // Doctor Management
          'view_doctors', 'create_doctors', 'edit_doctors',
          
          // Clinic Management
          'view_clinics', 'create_clinics', 'edit_clinics', 'manage_clinics',
          
          // Patient Management
          'view_patients', 'create_patients', 'edit_patients',
          
          // Appointment Management
          'view_appointments', 'create_appointments', 'edit_appointments', 'cancel_appointments',
          
          // Medical Records
          'view_medical_records', 'create_medical_records', 'edit_medical_records',
          
          // Billing
          'view_billing', 'manage_billing', 'view_financial_reports',
          
          // Wallets
          'view_wallets', 'manage_wallets', 'process_transactions',
          
          // Reports
          'view_reports', 'generate_reports', 'view_analytics', 'export_data',
          
          // System
          'audit_logs',
        ],
      },
      {
        name: 'doctor',
        description: 'Doctor access to patient care and medical records',
        permissions: [
          // Patient Management
          'view_patients', 'create_patients', 'edit_patients',
          
          // Appointment Management
          'view_appointments', 'create_appointments', 'edit_appointments',
          
          // Medical Records (Full access)
          'view_medical_records', 'create_medical_records', 'edit_medical_records',
          
          // Basic billing view
          'view_billing',
          
          // Basic reporting
          'view_reports',
        ],
      },
      {
        name: 'nurse',
        description: 'Nursing staff access to patient care',
        permissions: [
          // Patient Management
          'view_patients', 'edit_patients',
          
          // Appointment Management
          'view_appointments', 'create_appointments',
          
          // Medical Records (Limited)
          'view_medical_records', 'create_medical_records',
          
          // Basic reporting
          'view_reports',
        ],
      },
      {
        name: 'receptionist',
        description: 'Front desk operations and appointment management',
        permissions: [
          // Patient Management
          'view_patients', 'create_patients', 'edit_patients',
          
          // Appointment Management (Full)
          'view_appointments', 'create_appointments', 'edit_appointments', 'cancel_appointments',
          
          // Basic billing
          'view_billing',
          
          // Wallets (View only)
          'view_wallets',
        ],
      },
      {
        name: 'billing_clerk',
        description: 'Billing and financial operations specialist',
        permissions: [
          // Patient info (for billing)
          'view_patients',
          
          // Appointment info (for billing)
          'view_appointments',
          
          // Full billing access
          'view_billing', 'manage_billing', 'view_financial_reports',
          
          // Wallet management
          'view_wallets', 'manage_wallets', 'process_transactions',
          
          // Financial reports
          'view_reports', 'generate_reports',
        ],
      },
      {
        name: 'clinic_manager',
        description: 'Clinic operations manager',
        permissions: [
          // Staff management (limited)
          'view_users', 'view_doctors',
          
          // Clinic management
          'view_clinics', 'edit_clinics',
          
          // Patient Management
          'view_patients', 'create_patients', 'edit_patients',
          
          // Appointment Management
          'view_appointments', 'create_appointments', 'edit_appointments', 'cancel_appointments',
          
          // Billing oversight
          'view_billing', 'view_financial_reports',
          
          // Reports and analytics
          'view_reports', 'generate_reports', 'view_analytics',
        ],
      },
    ];

    for (const roleData of roles) {
      // Create or update role
      const role = await this.prisma.role.upsert({
        where: { name: roleData.name },
        update: { description: roleData.description },
        create: {
          name: roleData.name,
          description: roleData.description,
        },
      });

      // Clear existing permissions
      await this.prisma.rolePermission.deleteMany({
        where: { roleId: role.id },
      });

      // Add new permissions
      const rolePermissions = roleData.permissions
        .map((permName) => permissionMap.get(permName))
        .filter(Boolean)
        .map((permissionId) => ({
          roleId: role.id,
          permissionId,
        }));

      if (rolePermissions.length > 0) {
        await this.prisma.rolePermission.createMany({
          data: rolePermissions as { roleId: string; permissionId: string }[],
        });
      }

      console.log(`✅ Role "${roleData.name}" created with ${rolePermissions.length} permissions`);
    }

    return roles;
  }
*/
}
