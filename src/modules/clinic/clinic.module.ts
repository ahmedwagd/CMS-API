import { Module } from '@nestjs/common';
import { ClinicService } from './clinic.service';
import { ClinicController } from './clinic.controller';

@Module({
  controllers: [ClinicController],
  providers: [ClinicService],
  exports: [ClinicService], // Export for use in other modules like doctors
})
export class ClinicModule {}
