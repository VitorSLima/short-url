import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginRepository } from '../repository';
import { AuthDto } from '../dto/create-auth.dto';
import { createToken } from '../../../shared/utils/createToken';
import { comparePassword } from '../../../shared/utils/password.utils';

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly loginRepository: LoginRepository,
    private readonly jwtService: JwtService,
    private readonly logger: Logger,
  ) {}

  async execute(data: AuthDto) {
    try {
      const user = await this.loginRepository.login(data.email);

      if (!user) {
        throw new UnauthorizedException('Usuário não encontrado');
      }

      const isPasswordValid = await comparePassword(
        data.password,
        user.password,
      );

      if (!isPasswordValid) {
        throw new UnauthorizedException('Credenciais inválidas');
      }

      this.logger.log(`Usuário ${user.email} fez login com sucesso`);

      return {
        id: user.id,
        email: user.email,
        token: await createToken(this.jwtService, user),
      };
    } catch (error) {
      this.logger.error(error);
      throw new UnauthorizedException('Credenciais inválidas');
    }
  }
}
