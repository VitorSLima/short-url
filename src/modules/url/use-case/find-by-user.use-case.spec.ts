import { Test, TestingModule } from '@nestjs/testing';
import { FindByUserUseCase } from './find-by-user.use-case';
import { FindByUserRepository } from '../repository';
import { Logger, ServiceUnavailableException } from '@nestjs/common';

describe('FindByUserUseCase', () => {
  let useCase: FindByUserUseCase;
  let findByUserRepository: FindByUserRepository;
  let logger: Logger;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindByUserUseCase,
        {
          provide: FindByUserRepository,
          useValue: {
            execute: jest.fn(),
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

    useCase = module.get<FindByUserUseCase>(FindByUserUseCase);
    findByUserRepository =
      module.get<FindByUserRepository>(FindByUserRepository);
    logger = module.get<Logger>(Logger);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    const userId = 'user-123';
    const urls = [
      {
        id: '1',
        originalUrl: 'https://example.com',
        shortCode: 'abcde',
        clicks: 0,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      },
    ];

    it('should return a list of urls for a given user', async () => {
      jest.spyOn(findByUserRepository, 'execute').mockResolvedValue(urls);

      const result = await useCase.execute(userId);

      expect(findByUserRepository.execute).toHaveBeenCalledWith(userId);
      expect(logger.log).toHaveBeenCalledWith(
        `URLs encontradas para o usuário: ${userId}`,
      );
      expect(result).toEqual(urls);
    });

    it('should throw ServiceUnavailableException when finding fails', async () => {
      const error = new Error('Database error');
      jest.spyOn(findByUserRepository, 'execute').mockRejectedValue(error);

      await expect(useCase.execute(userId)).rejects.toThrow(
        new ServiceUnavailableException('Ops! Algo deu errado', {
          cause: error,
          description: `Erro ao buscar as URLs do usuário. ${error.message}`,
        }),
      );

      expect(logger.error).toHaveBeenCalledWith(
        'Ops! Algo deu errado',
        error,
        expect.any(String),
      );
    });
  });
});
