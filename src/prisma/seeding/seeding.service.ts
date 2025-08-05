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

  private async seedUsers(roles: any[]) {
    console.log('👤 Seeding users...');

    const roleMap = roles.reduce((acc, role) => {
      acc[role.name] = role.id;
      return acc;
    }, {});

    const usersData = [
      //   {
      //     email: 'superadmin@hospital.com',
      //     password: 'SuperAdmin123!',
      //     name: 'Super Administrator',
      //     roleId: roleMap.superadmin,
      //   },
      {
        email: 'admin@hospital.com',
        password: 'Admin123!',
        name: 'System Administrator',
        roleId: roleMap.admin,
      },
      {
        email: 'dr.smith@hospital.com',
        password: 'Doctor123!',
        name: 'Dr. John Smith',
        roleId: roleMap.doctor,
      },
      {
        email: 'nurse.jane@hospital.com',
        password: 'Nurse123!',
        name: 'Jane Doe',
        roleId: roleMap.nurse,
      },
      {
        email: 'reception@hospital.com',
        password: 'Reception123!',
        name: 'Front Desk',
        roleId: roleMap.receptionist,
      },
      {
        email: 'billing@hospital.com',
        password: 'Billing123!',
        name: 'Billing Department',
        roleId: roleMap.billing_staff,
      },
    ];

    for (const userData of usersData) {
      const hashedPassword = await argon2.hash(userData.password);

      await this.prisma.user.upsert({
        where: { email: userData.email },
        update: {},
        create: {
          ...userData,
          password: hashedPassword,
        },
      });
    }

    console.log(`✅ Created ${usersData.length} users`);
    console.log('\n📋 Default Login Credentials:');
    usersData.forEach((user) => {
      console.log(`${user.name}: ${user.email} / ${user.password}`);
    });
  }
}
