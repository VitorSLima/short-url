import { Test, TestingModule } from '@nestjs/testing';
import { ShortenUrlUseCase } from './shorten-url.use-case';
import { CreateUrlRepository } from '../repository';
import { Logger, ServiceUnavailableException } from '@nestjs/common';
import * as shortenUrlUtil from 'src/shared/utils/shortenUrl';

describe('ShortenUrlUseCase', () => {
  let useCase: ShortenUrlUseCase;
  let createUrlRepository: CreateUrlRepository;
  let logger: Logger;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShortenUrlUseCase,
        {
          provide: CreateUrlRepository,
          useValue: {
            create: jest.fn(),
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

    useCase = module.get<ShortenUrlUseCase>(ShortenUrlUseCase);
    createUrlRepository = module.get<CreateUrlRepository>(CreateUrlRepository);
    logger = module.get<Logger>(Logger);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    const originalUrl = 'https://example.com';
    const req = {
      protocol: 'http',
      get: jest.fn().mockReturnValue('localhost:3000'),
    };
    const userId = 'user-123';
    const shortCode = 'abcde';

    beforeEach(() => {
      jest.spyOn(shortenUrlUtil, 'shortenUrl').mockReturnValue(shortCode);
    });

    it('should shorten a url and return the short url', async () => {
      jest
        .spyOn(createUrlRepository, 'create')
        .mockResolvedValueOnce(undefined);

      const result = await useCase.execute(originalUrl, req, userId);

      expect(createUrlRepository.create).toHaveBeenCalledWith({
        originalUrl,
        shortCode,
        userId,
      });
      expect(logger.log).toHaveBeenCalledWith(
        `URL encurtada criada com sucesso: ${shortCode}`,
      );
      expect(result).toEqual({
        shortUrl: `http://localhost:3000/${shortCode}`,
      });
    });

    it('should throw ServiceUnavailableException when creation fails', async () => {
      const error = new Error('Database error');
      jest.spyOn(createUrlRepository, 'create').mockRejectedValue(error);

      await expect(useCase.execute(originalUrl, req, userId)).rejects.toThrow(
        new ServiceUnavailableException('Ops! Algo deu errado', {
          cause: error,
          description: `Erro ao criar a URL encurtada. ${error.message}`,
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
