import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { CreateAccountUseCase, LoginUseCase } from '../use-cases';
import { AuthDto } from '../dto/create-auth.dto';
import {
  ConflictException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';

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

    // Limpar mocks antes de cada teste
    Object.values(mockCreateAccountUseCase).forEach((mock) => {
      (mock as jest.Mock).mockClear();
    });
    Object.values(mockLoginUseCase).forEach((mock) => {
      (mock as jest.Mock).mockClear();
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAccount', () => {
    const validAuthDto: AuthDto = {
      email: 'teste@exemplo.com',
      password: 'senhaSegura123',
    };

    it('deve criar uma conta com sucesso', async () => {
      const expectedResult = {
        id: 'user-123',
        email: 'teste@exemplo.com',
        token: 'jwt-token-123',
      };
      mockCreateAccountUseCase.execute.mockResolvedValue(expectedResult);

      const result = await service.createAccount(validAuthDto);

      expect(createAccountUseCase.execute).toHaveBeenCalledWith(validAuthDto);
      expect(createAccountUseCase.execute).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResult);
    });

    it('deve lançar ConflictException quando usuário já existe', async () => {
      mockCreateAccountUseCase.execute.mockRejectedValue(
        new ConflictException('Usuário já existe'),
      );

      await expect(service.createAccount(validAuthDto)).rejects.toThrow(
        new ConflictException('Usuário já existe'),
      );
      expect(createAccountUseCase.execute).toHaveBeenCalledWith(validAuthDto);
    });

    it('deve lançar InternalServerErrorException em caso de erro interno', async () => {
      mockCreateAccountUseCase.execute.mockRejectedValue(
        new InternalServerErrorException('Erro ao criar usuário'),
      );

      await expect(service.createAccount(validAuthDto)).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(createAccountUseCase.execute).toHaveBeenCalledWith(validAuthDto);
    });

    it('deve validar se o use case foi chamado com dados corretos', async () => {
      const authDto: AuthDto = {
        email: 'novo@exemplo.com',
        password: 'outraSenha456',
      };
      mockCreateAccountUseCase.execute.mockResolvedValue({
        id: 'user-456',
        email: authDto.email,
        token: 'jwt-token-456',
      });

      await service.createAccount(authDto);

      expect(createAccountUseCase.execute).toHaveBeenCalledWith(authDto);
      expect(createAccountUseCase.execute).toHaveBeenCalledTimes(1);
    });
  });

  describe('login', () => {
    const validAuthDto: AuthDto = {
      email: 'teste@exemplo.com',
      password: 'senhaSegura123',
    };

    it('deve fazer login com sucesso', async () => {
      const expectedResult = {
        id: 'user-123',
        email: 'teste@exemplo.com',
        token: 'jwt-token-123',
      };
      mockLoginUseCase.execute.mockResolvedValue(expectedResult);

      const result = await service.login(validAuthDto);

      expect(loginUseCase.execute).toHaveBeenCalledWith(validAuthDto);
      expect(loginUseCase.execute).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResult);
    });

    it('deve lançar UnauthorizedException com credenciais inválidas', async () => {
      mockLoginUseCase.execute.mockRejectedValue(
        new UnauthorizedException('Credenciais inválidas'),
      );

      await expect(service.login(validAuthDto)).rejects.toThrow(
        new UnauthorizedException('Credenciais inválidas'),
      );
      expect(loginUseCase.execute).toHaveBeenCalledWith(validAuthDto);
    });

    it('deve lançar UnauthorizedException quando usuário não existe', async () => {
      const invalidAuthDto: AuthDto = {
        email: 'inexistente@exemplo.com',
        password: 'qualquerSenha',
      };
      mockLoginUseCase.execute.mockRejectedValue(
        new UnauthorizedException('Usuário não encontrado'),
      );

      await expect(service.login(invalidAuthDto)).rejects.toThrow(
        new UnauthorizedException('Usuário não encontrado'),
      );
      expect(loginUseCase.execute).toHaveBeenCalledWith(invalidAuthDto);
    });

    it('deve validar se o use case foi chamado com dados corretos', async () => {
      const authDto: AuthDto = {
        email: 'outro@exemplo.com',
        password: 'outraSenha789',
      };
      mockLoginUseCase.execute.mockResolvedValue({
        id: 'user-789',
        email: authDto.email,
        token: 'jwt-token-789',
      });

      await service.login(authDto);

      expect(loginUseCase.execute).toHaveBeenCalledWith(authDto);
      expect(loginUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('deve propagar outros tipos de erro corretamente', async () => {
      const error = new Error('Erro de conexão com o banco de dados');
      mockLoginUseCase.execute.mockRejectedValue(error);

      await expect(service.login(validAuthDto)).rejects.toThrow(error);
      expect(loginUseCase.execute).toHaveBeenCalledWith(validAuthDto);
    });
  });
});
