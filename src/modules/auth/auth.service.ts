import { Injectable } from '@nestjs/common';
import { AuthDto } from './dto/create-auth.dto';
import { CreateAccountUseCase, LoginUseCase } from './use-cases';

@Injectable()
export class AuthService {
  constructor(
    private readonly createAccountUseCase: CreateAccountUseCase,
    private readonly loginUseCase: LoginUseCase,
  ) {}

  createAccount(data: AuthDto) {
    return this.createAccountUseCase.execute(data);
  }

  login(data: AuthDto) {
    return this.loginUseCase.execute(data);
  }
}
