import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/databases/prisma.database';

@Injectable()
export class FindByEmailRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string) {
    return await this.prisma.user.findUnique({ where: { email } });
  }
}
