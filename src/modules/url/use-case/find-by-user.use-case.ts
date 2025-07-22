import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { FindByUserRepository } from '../repository';

@Injectable()
export class FindByUserUseCase {
  constructor(
    private readonly findByUserRepository: FindByUserRepository,
    private readonly logger: Logger,
  ) {}

  async execute(userId: string) {
    try {
      const urls = await this.findByUserRepository.execute(userId);
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
