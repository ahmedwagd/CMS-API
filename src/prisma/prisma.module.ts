import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { SeedingService } from './seeding/seeding.service';

@Module({
  providers: [PrismaService, SeedingService],
  exports: [PrismaService],
})
export class PrismaModule {}
