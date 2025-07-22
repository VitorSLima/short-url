import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/databases/prisma.database';

@Injectable()
export class FindByShortUrlRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByShortCode(shortCode: string) {
    return await this.prisma.url.findUnique({
      where: { shortCode },
    });
  }
}
