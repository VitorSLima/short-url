import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/databases/prisma.database';

@Injectable()
export class DeleteUrlRepository {
  constructor(private readonly prisma: PrismaService) {}

  async delete(id: string) {
    return await this.prisma.url.update({
      where: {
        id,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
