import { Logger, Module } from '@nestjs/common';
import { UrlService } from './url.service';
import { UrlController } from './url.controller';
import { AuthModule } from '../auth/auth.module';
import * as Repositories from './repository';
import * as UseCases from './use-case';
import { PrismaService } from '../../shared/databases/prisma.database';
import { OptionalJwtAuthGuard } from '../../shared/guards/optional-jwt.guard';

const useCases = Object.values(UseCases);
const repositories = Object.values(Repositories);

@Module({
  imports: [AuthModule],
  controllers: [UrlController],
  providers: [
    UrlService,
    ...useCases,
    ...repositories,
    PrismaService,
    Logger,
    OptionalJwtAuthGuard,
  ],
})
export class UrlModule {}
