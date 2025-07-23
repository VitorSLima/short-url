import { Test, TestingModule } from '@nestjs/testing';
import { CreateAccountUseCase } from '../use-cases/create-account.use-case';
import { CreateAccountRepository, FindByEmailRepository } from '../repository';
import { JwtService } from '@nestjs/jwt';
import {
  Logger,
  ConflictException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { AuthDto } from '../dto/create-auth.dto';
import * as passwordUtils from '../../../shared/utils/password.utils';
import * as createTokenUtil from '../../../shared/utils/createToken';

describe('CreateAccountUseCase', () => {
  let useCase: CreateAccountUseCase;
  let createAccountRepository: CreateAccountRepository;
  let findByEmailRepository: FindByEmailRepository;
  let jwtService: JwtService;
  let logger: Logger;

  const mockCreateAccountRepository = {
    createAccount: jest.fn(),
  };

  const mockFindByEmailRepository = {
    findByEmail: jest.fn(),
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
        CreateAccountUseCase,
        {
          provide: CreateAccountRepository,
          useValue: mockCreateAccountRepository,
        },
        {
          provide: FindByEmailRepository,
          useValue: mockFindByEmailRepository,
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

    useCase = module.get<CreateAccountUseCase>(CreateAccountUseCase);
    createAccountRepository = module.get<CreateAccountRepository>(
      CreateAccountRepository,
    );
    findByEmailRepository = module.get<FindByEmailRepository>(
      FindByEmailRepository,
    );
    jwtService = module.get<JwtService>(JwtService);
    logger = module.get<Logger>(Logger);

    // Limpar mocks antes de cada teste
    Object.values(mockCreateAccountRepository).forEach((mock) => {
      (mock as jest.Mock).mockClear();
    });
    Object.values(mockFindByEmailRepository).forEach((mock) => {
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

    const existingUser = {
      id: 'user-existing',
      email: 'teste@exemplo.com',
      password: 'hashedPassword',
      name: 'Usuário Existente',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    const newUser = {
      id: 'user-new',
      email: 'teste@exemplo.com',
      password: 'hashedPassword123',
      name: 'Novo Usuário',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    it('deve lançar ConflictException quando usuário já existe', async () => {
      mockFindByEmailRepository.findByEmail.mockResolvedValue(existingUser);

      await expect(useCase.execute(validAuthDto)).rejects.toThrow(
        new ConflictException('Usuário já existe'),
      );

      expect(findByEmailRepository.findByEmail).toHaveBeenCalledWith(
        validAuthDto.email,
      );
      expect(findByEmailRepository.findByEmail).toHaveBeenCalledTimes(1);
      expect(createAccountRepository.createAccount).not.toHaveBeenCalled();
    });

    it('deve criar um novo usuário e retornar dados com token', async () => {
      const hashedPassword = 'senhaHasheada123';
      const tokenJWT = 'jwt-token-123';
      const authDtoCopy = { ...validAuthDto }; // Cópia para evitar mutação

      mockFindByEmailRepository.findByEmail.mockResolvedValue(null);
      jest
        .spyOn(passwordUtils, 'hashPassword')
        .mockResolvedValue(hashedPassword);
      mockCreateAccountRepository.createAccount.mockResolvedValue(newUser);
      jest.spyOn(createTokenUtil, 'createToken').mockResolvedValue(tokenJWT);

      const result = await useCase.execute(authDtoCopy);

      expect(findByEmailRepository.findByEmail).toHaveBeenCalledWith(
        authDtoCopy.email,
      );
      expect(passwordUtils.hashPassword).toHaveBeenCalledWith(
        validAuthDto.password, // Original password should be passed to hash function
      );
      expect(createAccountRepository.createAccount).toHaveBeenCalledWith({
        email: authDtoCopy.email,
        password: hashedPassword,
      });
      expect(createTokenUtil.createToken).toHaveBeenCalledWith(
        jwtService,
        newUser,
      );
      expect(logger.log).toHaveBeenCalledWith(
        `Usuário ${newUser.email} criado com sucesso`,
      );

      expect(result).toEqual({
        id: newUser.id,
        email: newUser.email,
        token: tokenJWT,
      });
    });

    it('deve lançar UnauthorizedException quando falha ao criar usuário', async () => {
      mockFindByEmailRepository.findByEmail.mockResolvedValue(null);
      jest
        .spyOn(passwordUtils, 'hashPassword')
        .mockResolvedValue('hashedPassword');
      mockCreateAccountRepository.createAccount.mockResolvedValue(null);

      await expect(useCase.execute(validAuthDto)).rejects.toThrow(
        new UnauthorizedException('Usuário não encontrado'),
      );

      expect(logger.error).toHaveBeenCalled();
    });

    it('deve lançar InternalServerErrorException quando ocorre erro no banco de dados', async () => {
      const dbError = new Error('Erro de conexão com o banco');
      mockFindByEmailRepository.findByEmail.mockResolvedValue(null);
      jest
        .spyOn(passwordUtils, 'hashPassword')
        .mockResolvedValue('hashedPassword');
      mockCreateAccountRepository.createAccount.mockRejectedValue(dbError);

      await expect(useCase.execute(validAuthDto)).rejects.toThrow(
        new InternalServerErrorException('Erro ao criar usuário'),
      );

      expect(logger.error).toHaveBeenCalledWith(dbError);
    });

    it('deve propagar ConflictException sem modificar', async () => {
      const conflictError = new ConflictException('Usuário já existe');
      mockFindByEmailRepository.findByEmail.mockRejectedValue(conflictError);

      await expect(useCase.execute(validAuthDto)).rejects.toThrow(
        conflictError,
      );
      expect(logger.error).toHaveBeenCalledWith(conflictError);
    });

    it('deve propagar UnauthorizedException sem modificar', async () => {
      const authError = new UnauthorizedException('Usuário não encontrado');
      mockFindByEmailRepository.findByEmail.mockResolvedValue(null);
      jest.spyOn(passwordUtils, 'hashPassword').mockRejectedValue(authError);

      await expect(useCase.execute(validAuthDto)).rejects.toThrow(authError);
      expect(logger.error).toHaveBeenCalledWith(authError);
    });

    it('deve validar que a senha é hasheada antes de salvar', async () => {
      const originalPassword = 'senhaOriginal123';
      const hashedPassword = 'senhaHasheada456';
      const authDto: AuthDto = {
        email: 'novo@exemplo.com',
        password: originalPassword,
      };

      mockFindByEmailRepository.findByEmail.mockResolvedValue(null);
      jest
        .spyOn(passwordUtils, 'hashPassword')
        .mockResolvedValue(hashedPassword);
      mockCreateAccountRepository.createAccount.mockResolvedValue({
        ...newUser,
        email: authDto.email,
        password: hashedPassword,
      });
      jest.spyOn(createTokenUtil, 'createToken').mockResolvedValue('token');

      await useCase.execute(authDto);

      expect(passwordUtils.hashPassword).toHaveBeenCalledWith(originalPassword);
      expect(createAccountRepository.createAccount).toHaveBeenCalledWith({
        email: authDto.email,
        password: hashedPassword,
      });
    });

    it('deve criar token JWT válido para o usuário', async () => {
      const tokenJWT = 'jwt-token-valido-123';

      mockFindByEmailRepository.findByEmail.mockResolvedValue(null);
      jest
        .spyOn(passwordUtils, 'hashPassword')
        .mockResolvedValue('hashedPassword');
      mockCreateAccountRepository.createAccount.mockResolvedValue(newUser);
      jest.spyOn(createTokenUtil, 'createToken').mockResolvedValue(tokenJWT);

      const result = await useCase.execute(validAuthDto);

      expect(createTokenUtil.createToken).toHaveBeenCalledWith(
        jwtService,
        newUser,
      );
      expect(result.token).toBe(tokenJWT);
    });
  });
});
