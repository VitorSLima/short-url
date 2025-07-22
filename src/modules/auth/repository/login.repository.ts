import { PrismaService } from '../../../shared/databases/prisma.database';
import { Injectable } from '@nestjs/common';

@Injectable()
export class LoginRepository {
  constructor(private readonly prisma: PrismaService) {}

  async login(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    return user;
  }
}
