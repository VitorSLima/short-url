import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/databases/prisma.database';

@Injectable()
export class FindUrlByUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUrlByUser(userId: string) {
    return await this.prisma.url.findMany({
      where: {
        userId,
        deletedAt: null,
      },
    });
  }
}
