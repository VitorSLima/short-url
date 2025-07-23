import { CreateAccountRepository, FindByEmailRepository } from '../repository';
import { AuthDto } from '../dto/create-auth.dto';
import { JwtService } from '@nestjs/jwt';
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { createToken } from '../../../shared/utils/createToken';
import { hashPassword } from '../../../shared/utils/password.utils';

@Injectable()
export class CreateAccountUseCase {
  constructor(
    private readonly createAccountRepository: CreateAccountRepository,
    private readonly findByEmailRepository: FindByEmailRepository,
    private readonly jwtService: JwtService,
    private readonly logger: Logger,
  ) {}

  async execute(data: AuthDto) {
    try {
      const userExists = await this.findByEmailRepository.findByEmail(
        data.email,
      );

      if (userExists) {
        throw new ConflictException('Usuário já existe');
      }

      data.password = await hashPassword(data.password);

      const user = await this.createAccountRepository.createAccount(data);

      if (!user) {
        throw new UnauthorizedException('Usuário não encontrado');
      }

      this.logger.log(`Usuário ${user.email} criado com sucesso`);

      return {
        id: user.id,
        email: user.email,
        token: await createToken(this.jwtService, user),
      };
    } catch (error) {
      this.logger.error(error);

      if (
        error instanceof ConflictException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }

      throw new InternalServerErrorException('Erro ao criar usuário');
    }
  }
}
