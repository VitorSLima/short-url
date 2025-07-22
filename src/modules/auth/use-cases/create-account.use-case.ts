import { CreateAccountRepository, FindByEmailRepository } from '../repository';
import { AuthDto } from '../dto/create-auth.dto';
import { JwtService } from '@nestjs/jwt';
import { hashPassword } from '../../../shared/utils/hashPassword.utils';
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { createToken } from '../../../shared/utils/createToken';

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
        throw new ConflictException('User already exists');
      }

      data.password = await hashPassword(data.password);

      const user = await this.createAccountRepository.createAccount(data);

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      this.logger.log(`User ${user.email} created`);

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

      throw new InternalServerErrorException('Error creating user');
    }
  }
}
