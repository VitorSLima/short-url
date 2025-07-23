import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { AuthDto } from '../dto/create-auth.dto';
import { ConflictException, UnauthorizedException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockAuthService = {
    createAccount: jest.fn(),
    login: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);

    // Limpar mocks antes de cada teste
    Object.values(mockAuthService).forEach((mock) => {
      (mock as jest.Mock).mockClear();
    });
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
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
      mockAuthService.createAccount.mockResolvedValue(expectedResult);

      const result = await controller.createAccount(validAuthDto);

      expect(service.createAccount).toHaveBeenCalledWith(validAuthDto);
      expect(service.createAccount).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResult);
    });

    it('deve lançar ConflictException quando usuário já existe', async () => {
      mockAuthService.createAccount.mockRejectedValue(
        new ConflictException('Usuário já existe'),
      );

      await expect(controller.createAccount(validAuthDto)).rejects.toThrow(
        ConflictException,
      );
      expect(service.createAccount).toHaveBeenCalledWith(validAuthDto);
    });

    it('deve propagar erros do service corretamente', async () => {
      const error = new Error('Erro interno do servidor');
      mockAuthService.createAccount.mockRejectedValue(error);

      await expect(controller.createAccount(validAuthDto)).rejects.toThrow(
        error,
      );
      expect(service.createAccount).toHaveBeenCalledWith(validAuthDto);
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
      mockAuthService.login.mockResolvedValue(expectedResult);

      const result = await controller.login(validAuthDto);

      expect(service.login).toHaveBeenCalledWith(validAuthDto);
      expect(service.login).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResult);
    });

    it('deve lançar UnauthorizedException com credenciais inválidas', async () => {
      mockAuthService.login.mockRejectedValue(
        new UnauthorizedException('Credenciais inválidas'),
      );

      await expect(controller.login(validAuthDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(service.login).toHaveBeenCalledWith(validAuthDto);
    });

    it('deve lançar UnauthorizedException quando usuário não existe', async () => {
      const invalidAuthDto: AuthDto = {
        email: 'inexistente@exemplo.com',
        password: 'qualquerSenha',
      };
      mockAuthService.login.mockRejectedValue(
        new UnauthorizedException('Usuário não encontrado'),
      );

      await expect(controller.login(invalidAuthDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(service.login).toHaveBeenCalledWith(invalidAuthDto);
    });

    it('deve propagar erros do service corretamente', async () => {
      const error = new Error('Erro interno do servidor');
      mockAuthService.login.mockRejectedValue(error);

      await expect(controller.login(validAuthDto)).rejects.toThrow(error);
      expect(service.login).toHaveBeenCalledWith(validAuthDto);
    });
  });
});
