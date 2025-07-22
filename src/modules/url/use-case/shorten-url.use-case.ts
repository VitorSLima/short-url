import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { CreateUrlRepository } from '../repository';
import { shortenUrl } from 'src/shared/utils/shortenUrl';

@Injectable()
export class ShortenUrlUseCase {
  constructor(
    private readonly shortenUrlRepository: CreateUrlRepository,
    private readonly logger: Logger,
  ) {}

  async execute(originalUrl: string, req: any, userId?: string) {
    try {
      const shortCode = shortenUrl();

      await this.shortenUrlRepository.create({
        originalUrl,
        shortCode,
        userId,
      });

      this.logger.log(`URL encurtada criada com sucesso: ${shortCode}`);

      return {
        shortUrl: `${req.protocol}://${req.get('host')}/${shortCode}`,
      };
    } catch (error) {
      const err = new ServiceUnavailableException('Ops! Algo deu errado', {
        cause: error,
        description: `Erro ao criar a URL encurtada. ${error.message}`,
      });
      this.logger.error(err.message, err.cause, err.stack);
      throw err;
    }
  }
}
