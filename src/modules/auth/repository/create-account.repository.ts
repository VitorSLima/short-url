import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/databases/prisma.database';
import { AuthDto } from '../dto/create-auth.dto';

@Injectable()
export class CreateAccountRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createAccount(data: AuthDto) {
    return await this.prisma.user.create({ data });
  }

  async findByEmail(email: string) {
    return await this.prisma.user.findUnique({
      where: {
        email,
      },
    });
  }
}
