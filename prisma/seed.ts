import { PrismaClient } from '../generated/prisma';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create the clinic first
  const clinic = await prisma.clinic.create({
    data: {
      name: 'Wellness Medical Center',
      phone: '+1 (555) 123-4567',
      address: '123 Healing Street, Health City, HC 12345',
      manager: 'Jane Smith',
      email: 'info@wellnessmedical.com',
    },
  });

  console.log('Created clinic:', clinic);

  // Hash passwords for users
  //   const adminPasswordHash = await hash('12345678',10);
  //   const managerPasswordHash = await hash('12345678',10);

  //   // Create an admin user
  //   const adminUser = await prisma.user.create({
  //     data: {
  //       email: 'admin@a.com',
  //       password: adminPasswordHash,
  //       is_verified: true,
  //       role: 'ADMIN',
  //       first_name: 'Admin',
  //       last_name: 'User',
  //       gender: 'MALE',
  //       phone: '+1 (555) 987-6543',
  //       bio: 'System administrator with full access rights to the platform.'
  //     }
  //   });

  //   console.log('Created admin user:', adminUser);

  //   // Create a manager user
  //   const managerUser = await prisma.user.create({
  //     data: {
  //       email: 'manager@a.com',
  //       password: managerPasswordHash,
  //       is_verified: true,
  //       role: 'MANAGER',
  //       first_name: 'Jane',
  //       last_name: 'Smith',
  //       gender: 'FEMALE',
  //       phone: '+1 (555) 789-0123',
  //       bio: 'Clinic manager responsible for operational oversight and staff management.'
  //     }
  //   });

  //   console.log('Created manager user:', managerUser);
}

// Proper error handling with void return for the catch and finally handlers
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    // Use a void function that internally handles the promise
    void prisma.$disconnect();
  });
