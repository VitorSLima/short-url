import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { CreateAccountUseCase, LoginUseCase } from './use-cases';
import { AuthDto } from './dto/create-auth.dto';

describe('AuthService', () => {
  let service: AuthService;
  let createAccountUseCase: CreateAccountUseCase;
  let loginUseCase: LoginUseCase;

  const mockCreateAccountUseCase = {
    execute: jest.fn(),
  };

  const mockLoginUseCase = {
    execute: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: CreateAccountUseCase,
          useValue: mockCreateAccountUseCase,
        },
        {
          provide: LoginUseCase,
          useValue: mockLoginUseCase,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    createAccountUseCase =
      module.get<CreateAccountUseCase>(CreateAccountUseCase);
    loginUseCase = module.get<LoginUseCase>(LoginUseCase);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAccount', () => {
    it('should call CreateAccountUseCase', async () => {
      const authDto: AuthDto = {
        email: 'test@example.com',
        password: 'password',
      };
      mockCreateAccountUseCase.execute.mockResolvedValue('account created');

      const result = await service.createAccount(authDto);

      expect(createAccountUseCase.execute).toHaveBeenCalledWith(authDto);
      expect(result).toEqual('account created');
    });
  });

  describe('login', () => {
    it('should call LoginUseCase', async () => {
      const authDto: AuthDto = {
        email: 'test@example.com',
        password: 'password',
      };
      mockLoginUseCase.execute.mockResolvedValue('login successful');

      const result = await service.login(authDto);

      expect(loginUseCase.execute).toHaveBeenCalledWith(authDto);
      expect(result).toEqual('login successful');
    });
  });
});
