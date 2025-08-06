import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from 'generated/prisma';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly prismaLogger = new Logger(PrismaService.name);
  constructor() {
    super({
      log: [
        { level: 'query', emit: 'event' }, // Log all queries
        { level: 'error', emit: 'event' }, // Log errors
        { level: 'info', emit: 'event' }, // Log informational messages
        { level: 'warn', emit: 'event' }, // Log warnings
      ],
    });
    this.$on('query' as never, (e: any) => {
      this.prismaLogger.debug(
        `Query: ${e.query} Params: ${e.params} Duration: ${e.duration}ms`,
      );
    });

    this.$on('error' as never, (e: any) => {
      this.prismaLogger.error(`Error: ${e.message}`);
    });

    this.$on('info' as never, (e: any) => {
      this.prismaLogger.log(`Info: ${e.message}`);
    });

    this.$on('warn' as never, (e: any) => {
      this.prismaLogger.warn(`Warning: ${e.message}`);
    });
    /**
     * Prisma middleware with $use deprecated
     * Add your custom logic here
     * For example, you can add logging, validation, or modify the query parameters
     */
    // this.$use(async (params, next) => {
    //   // Add your middleware here
    //   console.log('Prisma middleware:', params);
    //   return next(params);
    // });
    /**
     * Log all queries
     * Using console.table for better readability
     */
    // this.$on('query' as never, (e: any) => {
    //   console.table({
    //     Query: e.query,
    //     Params: e.params,
    //     Duration: e.duration + 'ms',
    //   });
    // });

    // this.$on('error' as never, (e: any) => {
    //   console.error('Error: ' + e.message);
    // });

    // this.$on('info' as never, (e: any) => {
    //   console.info('Info: ' + e.message);
    // });

    // this.$on('warn' as never, (e: any) => {
    //   console.warn('Warning: ' + e.message);
    // });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
