import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/databases/prisma.database';

@Injectable()
export class IncrementClickRepository {
  constructor(private readonly prisma: PrismaService) {}

  async incrementClick(shortCode: string) {
    return await this.prisma.url.update({
      where: { shortCode },
      data: {
        clicks: {
          increment: 1,
        },
      },
    });
  }
}
