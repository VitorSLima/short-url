import {
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  FindByShortUrlRepository,
  IncrementClickRepository,
} from '../repository';

@Injectable()
export class RedirectToOriginalUseCase {
  constructor(
    private readonly findByShortUrlRepository: FindByShortUrlRepository,
    private readonly incrementClickRepository: IncrementClickRepository,
    private readonly logger: Logger,
  ) {}

  async execute(shortCode: string) {
    try {
      const url =
        await this.findByShortUrlRepository.findByShortCode(shortCode);

      if (!url || url.deletedAt) {
        throw new NotFoundException('URL não encontrada ou excluída.');
      }

      await this.incrementClickRepository.incrementClick(shortCode);

      return url.originalUrl;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      const err = new ServiceUnavailableException('Ops! Algo deu errado', {
        cause: error,
        description: `Erro ao redirecionar para a URL original. ${error.message}`,
      });
      this.logger.error(err.message, err.cause, err.stack);
      throw err;
    }
  }
}
