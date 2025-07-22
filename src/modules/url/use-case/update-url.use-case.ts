import {
  HttpException,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { UpdateUrlRepository } from '../repository/update-url.repository';
import { FindByIdRepository } from '../repository/find-by-id.repository';

@Injectable()
export class UpdateUrlUseCase {
  constructor(
    private readonly updateUrlRepository: UpdateUrlRepository,
    private readonly findByIdRepository: FindByIdRepository,
    private readonly logger: Logger,
  ) {}

  async execute(id: string, originalUrl: string, userId: string) {
    try {
      const url = await this.findByIdRepository.findById(id);

      if (url.userId !== userId) {
        throw new UnauthorizedException(
          'Você não tem permissão para editar esta URL.',
        );
      }

      return await this.updateUrlRepository.execute(id, originalUrl);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      const err = new ServiceUnavailableException('Ops! Algo deu errado', {
        cause: error,
        description: `Erro ao editar a URL. ${error.message}`,
      });
      this.logger.error(err.message, err.cause, err.stack);
      throw err;
    }
  }
}
