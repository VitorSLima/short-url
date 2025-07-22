import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/databases/prisma.database';

@Injectable()
export class UpdateUrlRepository {
  constructor(private readonly prisma: PrismaService) {}

  async execute(id: string, originalUrl: string) {
    return await this.prisma.url.update({
      where: {
        id,
      },
      data: {
        originalUrl,
      },
    });
  }
}
