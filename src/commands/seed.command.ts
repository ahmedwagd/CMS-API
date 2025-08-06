// src/commands/seed.command.ts
import { Command, CommandRunner } from 'nest-commander';
import { SeederService } from 'src/prisma/seeding/seeding.service';

@Command({
  name: 'seed',
  description: 'Seed the database with initial data',
})
export class SeedCommand extends CommandRunner {
  constructor(private readonly seedingService: SeederService) {
    super();
  }

  async run(): Promise<void> {
    await this.seedingService.seedDatabase();
    console.log('Database seeded successfully!');
  }
}
