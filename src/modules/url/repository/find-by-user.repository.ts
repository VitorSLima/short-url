import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/databases/prisma.database';

@Injectable()
export class FindByUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string) {
    return await this.prisma.url.findMany({
      where: {
        userId,
        deletedAt: null,
      },
    });
  }
}
