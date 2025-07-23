import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { FindUrlByUserRepository } from '../repository';

@Injectable()
export class FindUrlByUserUseCase {
  constructor(
    private readonly findUrlByUserRepository: FindUrlByUserRepository,
    private readonly logger: Logger,
  ) {}

  async execute(userId: string) {
    try {
      const urls = await this.findUrlByUserRepository.findUrlByUser(userId);
      this.logger.log(`URLs encontradas para o usuário: ${userId}`);
      return urls;
    } catch (error) {
      const err = new ServiceUnavailableException('Ops! Algo deu errado', {
        cause: error,
        description: `Erro ao buscar as URLs do usuário. ${error.message}`,
      });
      this.logger.error(err.message, err.cause, err.stack);
      throw err;
    }
  }
}
