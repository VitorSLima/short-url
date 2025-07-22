import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../../shared/databases/prisma.database';
import * as UseCases from './use-cases';
import * as Repositories from './repository';
import { JwtStrategy } from '../../shared/strategies/jwt.strategy';
import { Logger } from '@nestjs/common';

const useCases = Object.values(UseCases);
const repositories = Object.values(Repositories);

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.EXPIRES_IN },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    ...useCases,
    ...repositories,
    PrismaService,
    JwtStrategy,
    Logger,
  ],
  exports: [JwtModule],
})
export class AuthModule {}
