import { Test, TestingModule } from '@nestjs/testing';
import { CreateAccountUseCase } from './create-account.use-case';
import { CreateAccountRepository, FindByEmailRepository } from '../repository';
import { JwtService } from '@nestjs/jwt';
import { Logger, ConflictException } from '@nestjs/common';
import { AuthDto } from '../dto/create-auth.dto';

describe('CreateAccountUseCase', () => {
  let useCase: CreateAccountUseCase;
  let createAccountRepository: CreateAccountRepository;
  let findByEmailRepository: FindByEmailRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateAccountUseCase,
        {
          provide: CreateAccountRepository,
          useValue: {
            createAccount: jest.fn(),
          },
        },
        {
          provide: FindByEmailRepository,
          useValue: {
            findByEmail: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn().mockResolvedValue('test_token'),
          },
        },
        {
          provide: Logger,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
          },
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
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should throw ConflictException if user with the same email already exists', async () => {
      const authDto: AuthDto = {
        email: 'test@example.com',
        password: 'password',
      };
      jest.spyOn(findByEmailRepository, 'findByEmail').mockResolvedValueOnce({
        id: '1',
        email: 'test@example.com',
        password: 'hashedpassword',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(useCase.execute(authDto)).rejects.toThrow(
        new ConflictException('User already exists'),
      );
    });

    it('should create a new user and return user data with a token', async () => {
      const authDto: AuthDto = {
        email: 'newuser@example.com',
        password: 'password',
      };
      const createdUser = {
        id: '2',
        email: 'newuser@example.com',
        password: 'hashedpassword',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest
        .spyOn(findByEmailRepository, 'findByEmail')
        .mockResolvedValueOnce(null);
      jest
        .spyOn(createAccountRepository, 'createAccount')
        .mockResolvedValueOnce(createdUser);

      const result = await useCase.execute(authDto);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email', 'newuser@example.com');
      expect(result).toHaveProperty('token');
    });
  });
});
