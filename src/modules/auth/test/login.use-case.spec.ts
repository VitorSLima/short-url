import { Test, TestingModule } from '@nestjs/testing';
import { LoginRepository } from '../repository';
import { JwtService } from '@nestjs/jwt';
import { Logger, UnauthorizedException } from '@nestjs/common';
import { AuthDto } from '../dto/create-auth.dto';
import { LoginUseCase } from '../use-cases';
import * as createTokenUtil from '../../../shared/utils/createToken';
import * as passwordUtils from '../../../shared/utils/password.utils';

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let repository: LoginRepository;
  let jwtService: JwtService;
  let logger: Logger;

  const mockLoginRepository = {
    login: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginUseCase,
        {
          provide: LoginRepository,
          useValue: mockLoginRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: Logger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    useCase = module.get<LoginUseCase>(LoginUseCase);
    repository = module.get<LoginRepository>(LoginRepository);
    jwtService = module.get<JwtService>(JwtService);
    logger = module.get<Logger>(Logger);

    // Limpar mocks antes de cada teste
    Object.values(mockLoginRepository).forEach((mock) => {
      (mock as jest.Mock).mockClear();
    });
    Object.values(mockJwtService).forEach((mock) => {
      (mock as jest.Mock).mockClear();
    });
    Object.values(mockLogger).forEach((mock) => {
      (mock as jest.Mock).mockClear();
    });
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    const validAuthDto: AuthDto = {
      email: 'teste@exemplo.com',
      password: 'senhaSegura123',
    };

    const validUser = {
      id: 'user-123',
      email: 'teste@exemplo.com',
      password: 'senhaHasheada123',
      name: 'Usuário Teste',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    it('deve lançar UnauthorizedException quando usuário não é encontrado', async () => {
      mockLoginRepository.login.mockResolvedValue(null);

      await expect(useCase.execute(validAuthDto)).rejects.toThrow(
        new UnauthorizedException('Credenciais inválidas'),
      );

      expect(repository.login).toHaveBeenCalledWith(validAuthDto.email);
      expect(repository.login).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalled();
    });

    it('deve lançar UnauthorizedException quando senha é inválida', async () => {
      mockLoginRepository.login.mockResolvedValue(validUser);
      jest.spyOn(passwordUtils, 'comparePassword').mockResolvedValue(false);

      await expect(useCase.execute(validAuthDto)).rejects.toThrow(
        new UnauthorizedException('Credenciais inválidas'),
      );

      expect(repository.login).toHaveBeenCalledWith(validAuthDto.email);
      expect(passwordUtils.comparePassword).toHaveBeenCalledWith(
        validAuthDto.password,
        validUser.password,
      );
      expect(logger.error).toHaveBeenCalled();
    });

    it('deve retornar usuário com token quando login é bem-sucedido', async () => {
      const tokenJWT = 'jwt-token-valido-123';

      mockLoginRepository.login.mockResolvedValue(validUser);
      jest.spyOn(passwordUtils, 'comparePassword').mockResolvedValue(true);
      jest.spyOn(createTokenUtil, 'createToken').mockResolvedValue(tokenJWT);

      const result = await useCase.execute(validAuthDto);

      expect(repository.login).toHaveBeenCalledWith(validAuthDto.email);
      expect(passwordUtils.comparePassword).toHaveBeenCalledWith(
        validAuthDto.password,
        validUser.password,
      );
      expect(createTokenUtil.createToken).toHaveBeenCalledWith(
        jwtService,
        validUser,
      );
      expect(logger.log).toHaveBeenCalledWith(
        `Usuário ${validUser.email} fez login com sucesso`,
      );

      expect(result).toEqual({
        id: validUser.id,
        email: validUser.email,
        token: tokenJWT,
      });
    });

    it('deve lançar UnauthorizedException quando ocorre erro na verificação da senha', async () => {
      const passwordError = new Error('Erro ao comparar senha');

      mockLoginRepository.login.mockResolvedValue(validUser);
      jest
        .spyOn(passwordUtils, 'comparePassword')
        .mockRejectedValue(passwordError);

      await expect(useCase.execute(validAuthDto)).rejects.toThrow(
        new UnauthorizedException('Credenciais inválidas'),
      );

      expect(logger.error).toHaveBeenCalledWith(passwordError);
    });

    it('deve lançar UnauthorizedException quando ocorre erro na busca do usuário', async () => {
      const dbError = new Error('Erro de conexão com o banco');

      mockLoginRepository.login.mockRejectedValue(dbError);

      await expect(useCase.execute(validAuthDto)).rejects.toThrow(
        new UnauthorizedException('Credenciais inválidas'),
      );

      expect(logger.error).toHaveBeenCalledWith(dbError);
    });

    it('deve lançar UnauthorizedException quando ocorre erro na criação do token', async () => {
      const tokenError = new Error('Erro ao criar token JWT');

      mockLoginRepository.login.mockResolvedValue(validUser);
      jest.spyOn(passwordUtils, 'comparePassword').mockResolvedValue(true);
      jest.spyOn(createTokenUtil, 'createToken').mockRejectedValue(tokenError);

      await expect(useCase.execute(validAuthDto)).rejects.toThrow(
        new UnauthorizedException('Credenciais inválidas'),
      );

      expect(logger.error).toHaveBeenCalledWith(tokenError);
    });

    it('deve validar dados de entrada corretos', async () => {
      const authDto: AuthDto = {
        email: 'outro@exemplo.com',
        password: 'outraSenha456',
      };
      const user = {
        ...validUser,
        email: authDto.email,
      };

      mockLoginRepository.login.mockResolvedValue(user);
      jest.spyOn(passwordUtils, 'comparePassword').mockResolvedValue(true);
      jest.spyOn(createTokenUtil, 'createToken').mockResolvedValue('token-123');

      await useCase.execute(authDto);

      expect(repository.login).toHaveBeenCalledWith(authDto.email);
      expect(passwordUtils.comparePassword).toHaveBeenCalledWith(
        authDto.password,
        user.password,
      );
    });

    it('deve garantir que o token JWT seja gerado corretamente', async () => {
      const expectedToken = 'jwt-token-correto-789';

      mockLoginRepository.login.mockResolvedValue(validUser);
      jest.spyOn(passwordUtils, 'comparePassword').mockResolvedValue(true);
      jest
        .spyOn(createTokenUtil, 'createToken')
        .mockResolvedValue(expectedToken);

      const result = await useCase.execute(validAuthDto);

      expect(createTokenUtil.createToken).toHaveBeenCalledWith(
        jwtService,
        validUser,
      );
      expect(result.token).toBe(expectedToken);
    });

    it('deve não retornar a senha do usuário no resultado', async () => {
      mockLoginRepository.login.mockResolvedValue(validUser);
      jest.spyOn(passwordUtils, 'comparePassword').mockResolvedValue(true);
      jest.spyOn(createTokenUtil, 'createToken').mockResolvedValue('token');

      const result = await useCase.execute(validAuthDto);

      expect(result).not.toHaveProperty('password');
      expect(result).toEqual({
        id: validUser.id,
        email: validUser.email,
        token: 'token',
      });
    });
  });
});
