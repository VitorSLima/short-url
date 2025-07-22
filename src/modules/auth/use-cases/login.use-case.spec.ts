import { Test, TestingModule } from '@nestjs/testing';
import { LoginUseCase } from './login.use-case';
import { LoginRepository } from '../repository';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthDto } from '../dto/create-auth.dto';
import * as comparePasswordUtil from '../../../shared/utils/comparePassword';
import * as createTokenUtil from '../../../shared/utils/createToken';

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let repository: LoginRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginUseCase,
        {
          provide: LoginRepository,
          useValue: {
            login: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<LoginUseCase>(LoginUseCase);
    repository = module.get<LoginRepository>(LoginRepository);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    const authDto: AuthDto = {
      email: 'test@example.com',
      password: 'password',
    };
    const user = {
      id: '1',
      email: 'test@example.com',
      password: 'hashedpassword',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should throw UnauthorizedException if user is not found', async () => {
      jest.spyOn(repository, 'login').mockResolvedValueOnce(null);
      await expect(useCase.execute(authDto)).rejects.toThrow(
        new UnauthorizedException('User not found'),
      );
    });

    it('should throw UnauthorizedException if password is not valid', async () => {
      jest.spyOn(repository, 'login').mockResolvedValueOnce(user as any);
      jest
        .spyOn(comparePasswordUtil, 'comparePassword')
        .mockResolvedValueOnce(false);

      await expect(useCase.execute(authDto)).rejects.toThrow(
        new UnauthorizedException('Invalid e-mail or password'),
      );
    });

    it('should return user with token if login is successful', async () => {
      jest.spyOn(repository, 'login').mockResolvedValueOnce(user as any);
      jest
        .spyOn(comparePasswordUtil, 'comparePassword')
        .mockResolvedValueOnce(true);
      jest
        .spyOn(createTokenUtil, 'createToken')
        .mockResolvedValueOnce('test_token');

      const result = await useCase.execute(authDto);

      expect(result).toEqual({
        id: user.id,
        email: user.email,
        token: 'test_token',
      });
    });
  });
});
