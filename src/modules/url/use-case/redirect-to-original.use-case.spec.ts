import { Test, TestingModule } from '@nestjs/testing';
import { RedirectToOriginalUseCase } from './redirect-to-original.use-case';
import {
  FindByShortUrlRepository,
  IncrementClickRepository,
} from '../repository';
import {
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';

describe('RedirectToOriginalUseCase', () => {
  let useCase: RedirectToOriginalUseCase;
  let findByShortUrlRepository: FindByShortUrlRepository;
  let incrementClickRepository: IncrementClickRepository;
  let logger: Logger;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedirectToOriginalUseCase,
        {
          provide: FindByShortUrlRepository,
          useValue: {
            findByShortCode: jest.fn(),
          },
        },
        {
          provide: IncrementClickRepository,
          useValue: {
            incrementClick: jest.fn(),
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

    useCase = module.get<RedirectToOriginalUseCase>(RedirectToOriginalUseCase);
    findByShortUrlRepository = module.get<FindByShortUrlRepository>(
      FindByShortUrlRepository,
    );
    incrementClickRepository = module.get<IncrementClickRepository>(
      IncrementClickRepository,
    );
    logger = module.get<Logger>(Logger);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    const shortCode = 'abcde';
    const urlData = {
      id: '1',
      originalUrl: 'https://example.com',
      shortCode,
      clicks: 0,
      userId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    it('should return the original URL and increment clicks if short URL is found', async () => {
      jest
        .spyOn(findByShortUrlRepository, 'findByShortCode')
        .mockResolvedValue(urlData);
      jest
        .spyOn(incrementClickRepository, 'incrementClick')
        .mockResolvedValue(undefined);

      const result = await useCase.execute(shortCode);

      expect(findByShortUrlRepository.findByShortCode).toHaveBeenCalledWith(
        shortCode,
      );
      expect(incrementClickRepository.incrementClick).toHaveBeenCalledWith(
        shortCode,
      );
      expect(result).toBe(urlData.originalUrl);
    });

    it('should throw NotFoundException if short URL is not found', async () => {
      jest
        .spyOn(findByShortUrlRepository, 'findByShortCode')
        .mockResolvedValue(null);

      await expect(useCase.execute(shortCode)).rejects.toThrow(
        new NotFoundException('URL não encontrada ou excluída.'),
      );
    });

    it('should throw ServiceUnavailableException when finding fails', async () => {
      const error = new Error('Database error');
      jest
        .spyOn(findByShortUrlRepository, 'findByShortCode')
        .mockRejectedValue(error);

      await expect(useCase.execute(shortCode)).rejects.toThrow(
        new ServiceUnavailableException('Ops! Algo deu errado', {
          cause: error,
          description: `Erro ao redirecionar para a URL original. ${error.message}`,
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
