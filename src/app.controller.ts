import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(private readonly PrismaService: PrismaService) {}

  @Get()
  getHello(): string {
    return 'Hello World!';
  }
  @Get('stats')
  async getStats() {
    const stats = await this.PrismaService.$transaction([
      this.PrismaService.user.count(),
      this.PrismaService.clinic.count(),
      this.PrismaService.appointment.count(),
    ]);
    return { users: stats[0], clinic: stats[1], appointment: stats[2] };
  }
}
