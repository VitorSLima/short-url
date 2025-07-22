import { Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginRepository } from '../repository';
import { AuthDto } from '../dto/create-auth.dto';
import { JwtService } from '@nestjs/jwt';
import { comparePassword } from '../../../shared/utils/comparePassword';
import { createToken } from '../../../shared/utils/createToken';

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly loginRepository: LoginRepository,
    private readonly jwtService: JwtService,
  ) {}

  async execute(data: AuthDto) {
    const user = await this.loginRepository.login(data.email);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isPasswordValid = await comparePassword(data.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid e-mail or password');
    }

    return {
      id: user.id,
      email: user.email,
      token: await createToken(this.jwtService, user),
    };
  }
}
