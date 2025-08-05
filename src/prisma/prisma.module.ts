import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
// import { SeedingService } from './seeding/seeding.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
