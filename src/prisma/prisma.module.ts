import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { SeederService } from './seeding/seeding.service';
// import { SeedingService } from './seeding/seeding.service';

@Global()
@Module({
  providers: [PrismaService, SeederService],
  exports: [PrismaService, SeederService],
})
export class PrismaModule {}
