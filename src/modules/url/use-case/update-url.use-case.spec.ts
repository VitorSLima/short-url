import { Test, TestingModule } from '@nestjs/testing';
import { UpdateUrlUseCase } from './update-url.use-case';
import { FindByIdRepository, UpdateUrlRepository } from '../repository';
import {
  ForbiddenException,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';

describe('UpdateUrlUseCase', () => {
  let useCase: UpdateUrlUseCase;
  let findByIdRepository: FindByIdRepository;
  let updateUrlRepository: UpdateUrlRepository;
  let logger: Logger;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateUrlUseCase,
        {
          provide: FindByIdRepository,
          useValue: {
            findById: jest.fn(),
          },
        },
        {
          provide: UpdateUrlRepository,
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

    useCase = module.get<UpdateUrlUseCase>(UpdateUrlUseCase);
    findByIdRepository = module.get<FindByIdRepository>(FindByIdRepository);
    updateUrlRepository = module.get<UpdateUrlRepository>(UpdateUrlRepository);
    logger = module.get<Logger>(Logger);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    const urlId = 'url-123';
    const userId = 'user-123';
    const originalUrl = 'https://new-example.com';
    const urlData = {
      id: urlId,
      originalUrl: 'https://example.com',
      shortCode: 'abcde',
      clicks: 0,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };
    const updatedUrlData = { ...urlData, originalUrl };

    it('should update the url', async () => {
      jest.spyOn(findByIdRepository, 'findById').mockResolvedValue(urlData);
      jest
        .spyOn(updateUrlRepository, 'execute')
        .mockResolvedValue(updatedUrlData);

      const result = await useCase.execute(urlId, originalUrl, userId);

      expect(findByIdRepository.findById).toHaveBeenCalledWith(urlId);
      expect(updateUrlRepository.execute).toHaveBeenCalledWith(
        urlId,
        originalUrl,
      );
      expect(result).toEqual(updatedUrlData);
    });

    it('should throw UnauthorizedException if user is not the owner', async () => {
      const otherUserId = 'user-456';
      jest.spyOn(findByIdRepository, 'findById').mockResolvedValue(urlData);

      await expect(
        useCase.execute(urlId, originalUrl, otherUserId),
      ).rejects.toThrow(
        new UnauthorizedException(
          'Você não tem permissão para editar esta URL.',
        ),
      );
    });

    it('should throw ServiceUnavailableException when update fails', async () => {
      const error = new Error('Database error');
      jest.spyOn(findByIdRepository, 'findById').mockResolvedValue(urlData);
      jest.spyOn(updateUrlRepository, 'execute').mockRejectedValue(error);

      await expect(useCase.execute(urlId, originalUrl, userId)).rejects.toThrow(
        new ServiceUnavailableException('Ops! Algo deu errado', {
          cause: error,
          description: `Erro ao editar a URL. ${error.message}`,
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
