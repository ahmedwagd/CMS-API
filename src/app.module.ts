import { Module } from '@nestjs/common';
import { CommandRunnerModule } from 'nest-commander';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { ClinicModule } from './modules/clinic/clinic.module';
import { UsersModule } from './modules/users/users.module';
import { PatientsModule } from './modules/patients/patients.module';
import { DoctorsModule } from './modules/doctors/doctors.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { MedicalRecordsModule } from './modules/medical-records/medical-records.module';
import { WalletsModule } from './modules/wallets/wallets.module';
import { AuditModule } from './modules/audit/audit.module';
import { RolesModule } from './modules/roles/roles.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { SeedCommand } from './commands/seed.command';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ClinicModule,
    PatientsModule,
    DoctorsModule,
    AppointmentsModule,
    InvoicesModule,
    MedicalRecordsModule,
    WalletsModule,
    AuditModule,
    RolesModule,
    PermissionsModule,
    CommandRunnerModule,
  ],
  controllers: [AppController],
  providers: [SeedCommand],
})
export class AppModule {}
