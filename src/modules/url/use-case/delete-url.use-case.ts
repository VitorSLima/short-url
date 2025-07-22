import {
  HttpException,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { DeleteUrlRepository } from '../repository/delete-url.repository';
import { FindByIdRepository } from '../repository/find-by-id.repository';

@Injectable()
export class DeleteUrlUseCase {
  constructor(
    private readonly deleteUrlRepository: DeleteUrlRepository,
    private readonly findByIdRepository: FindByIdRepository,
    private readonly logger: Logger,
  ) {}

  async execute(id: string, userId: string) {
    try {
      const url = await this.findByIdRepository.findById(id);

      if (url.userId !== userId) {
        throw new UnauthorizedException(
          'Você não tem permissão para deletar esta URL.',
        );
      }

      const deletedUrl = await this.deleteUrlRepository.delete(id);
      this.logger.log(`URL deletada com sucesso: ${deletedUrl.id}`);
      return deletedUrl;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      const err = new ServiceUnavailableException('Ops! Algo deu errado', {
        cause: error,
        description: `Erro ao deletar a URL. ${error.message}`,
      });
      this.logger.error(err.message, err.cause, err.stack);
      throw err;
    }
  }
}
