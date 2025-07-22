import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/databases/prisma.database';
import { CreateUrlDto } from '../dto/create-url.dto';

@Injectable()
export class CreateUrlRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateUrlDto) {
    const { originalUrl, shortCode, userId } = data;

    return await this.prisma.url.create({
      data: {
        originalUrl,
        shortCode,
        user: userId ? { connect: { id: userId } } : undefined,
      },
    });
  }
}
