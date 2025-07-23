import { Test, TestingModule } from '@nestjs/testing';
import { RedirectToOriginalUseCase } from '../use-case/redirect-to-original.use-case';
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

  const mockFindByShortUrlRepository = {
    findByShortCode: jest.fn(),
  };

  const mockIncrementClickRepository = {
    incrementClick: jest.fn(),
  };

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedirectToOriginalUseCase,
        {
          provide: FindByShortUrlRepository,
          useValue: mockFindByShortUrlRepository,
        },
        {
          provide: IncrementClickRepository,
          useValue: mockIncrementClickRepository,
        },
        {
          provide: Logger,
          useValue: mockLogger,
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

    // Limpar mocks antes de cada teste
    Object.values(mockFindByShortUrlRepository).forEach((mock) => {
      (mock as jest.Mock).mockClear();
    });
    Object.values(mockIncrementClickRepository).forEach((mock) => {
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
    const validShortCode = 'abc123';
    const validUrlData = {
      id: 'url-1',
      originalUrl: 'https://exemplo.com',
      shortCode: validShortCode,
      clicks: 5,
      userId: 'user-123',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    it('deve retornar a URL original e incrementar cliques quando URL é encontrada', async () => {
      mockFindByShortUrlRepository.findByShortCode.mockResolvedValue(
        validUrlData,
      );
      mockIncrementClickRepository.incrementClick.mockResolvedValue(undefined);

      const result = await useCase.execute(validShortCode);

      expect(findByShortUrlRepository.findByShortCode).toHaveBeenCalledWith(
        validShortCode,
      );
      expect(findByShortUrlRepository.findByShortCode).toHaveBeenCalledTimes(1);
      expect(incrementClickRepository.incrementClick).toHaveBeenCalledWith(
        validShortCode,
      );
      expect(incrementClickRepository.incrementClick).toHaveBeenCalledTimes(1);
      expect(result).toBe(validUrlData.originalUrl);
    });

    it('deve lançar NotFoundException quando URL não é encontrada', async () => {
      mockFindByShortUrlRepository.findByShortCode.mockResolvedValue(null);

      await expect(useCase.execute(validShortCode)).rejects.toThrow(
        new NotFoundException('URL não encontrada ou excluída.'),
      );

      expect(findByShortUrlRepository.findByShortCode).toHaveBeenCalledWith(
        validShortCode,
      );
      expect(incrementClickRepository.incrementClick).not.toHaveBeenCalled();
    });

    it('deve lançar NotFoundException quando URL está deletada (deletedAt não é null)', async () => {
      const deletedUrlData = {
        ...validUrlData,
        deletedAt: new Date(),
      };
      mockFindByShortUrlRepository.findByShortCode.mockResolvedValue(
        deletedUrlData,
      );

      await expect(useCase.execute(validShortCode)).rejects.toThrow(
        new NotFoundException('URL não encontrada ou excluída.'),
      );

      expect(findByShortUrlRepository.findByShortCode).toHaveBeenCalledWith(
        validShortCode,
      );
      expect(incrementClickRepository.incrementClick).not.toHaveBeenCalled();
    });

    it('deve lançar ServiceUnavailableException quando busca falha', async () => {
      const dbError = new Error('Erro de conexão com o banco de dados');
      mockFindByShortUrlRepository.findByShortCode.mockRejectedValue(dbError);

      await expect(useCase.execute(validShortCode)).rejects.toThrow(
        new ServiceUnavailableException('Ops! Algo deu errado', {
          cause: dbError,
          description: `Erro ao redirecionar para a URL original. ${dbError.message}`,
        }),
      );

      expect(logger.error).toHaveBeenCalledWith(
        'Ops! Algo deu errado',
        dbError,
        expect.any(String),
      );
      expect(incrementClickRepository.incrementClick).not.toHaveBeenCalled();
    });

    it('deve lançar ServiceUnavailableException quando incrementClick falha', async () => {
      const incrementError = new Error('Erro ao incrementar clique');
      mockFindByShortUrlRepository.findByShortCode.mockResolvedValue(
        validUrlData,
      );
      mockIncrementClickRepository.incrementClick.mockRejectedValue(
        incrementError,
      );

      await expect(useCase.execute(validShortCode)).rejects.toThrow(
        new ServiceUnavailableException('Ops! Algo deu errado', {
          cause: incrementError,
          description: `Erro ao redirecionar para a URL original. ${incrementError.message}`,
        }),
      );

      expect(findByShortUrlRepository.findByShortCode).toHaveBeenCalledWith(
        validShortCode,
      );
      expect(incrementClickRepository.incrementClick).toHaveBeenCalledWith(
        validShortCode,
      );
      expect(logger.error).toHaveBeenCalledWith(
        'Ops! Algo deu errado',
        incrementError,
        expect.any(String),
      );
    });

    it('deve funcionar com URLs de usuários não autenticados (userId null)', async () => {
      const guestUrlData = {
        ...validUrlData,
        userId: null,
      };
      mockFindByShortUrlRepository.findByShortCode.mockResolvedValue(
        guestUrlData,
      );
      mockIncrementClickRepository.incrementClick.mockResolvedValue(undefined);

      const result = await useCase.execute(validShortCode);

      expect(result).toBe(guestUrlData.originalUrl);
      expect(incrementClickRepository.incrementClick).toHaveBeenCalledWith(
        validShortCode,
      );
    });

    it('deve lidar com diferentes tipos de URLs originais', async () => {
      const urlsTestData = [
        'https://google.com',
        'http://localhost:3000',
        'https://subdomain.example.com/path/to/page?param=value',
        'https://example.com/path/with/many/segments#fragment',
      ];

      for (const originalUrl of urlsTestData) {
        const urlData = {
          ...validUrlData,
          originalUrl,
        };
        mockFindByShortUrlRepository.findByShortCode.mockResolvedValue(urlData);
        mockIncrementClickRepository.incrementClick.mockResolvedValue(
          undefined,
        );

        const result = await useCase.execute(validShortCode);

        expect(result).toBe(originalUrl);
      }
    });

    it('deve funcionar com diferentes códigos curtos', async () => {
      const shortCodes = [
        'abc123',
        'XyZ789',
        '123ABC',
        'short1',
        'longshortcode123',
      ];

      for (const shortCode of shortCodes) {
        const urlData = {
          ...validUrlData,
          shortCode,
        };
        mockFindByShortUrlRepository.findByShortCode.mockResolvedValue(urlData);
        mockIncrementClickRepository.incrementClick.mockResolvedValue(
          undefined,
        );

        const result = await useCase.execute(shortCode);

        expect(findByShortUrlRepository.findByShortCode).toHaveBeenCalledWith(
          shortCode,
        );
        expect(result).toBe(urlData.originalUrl);
      }
    });

    it('deve garantir que busca é feita antes de incrementar cliques', async () => {
      mockFindByShortUrlRepository.findByShortCode.mockResolvedValue(
        validUrlData,
      );
      mockIncrementClickRepository.incrementClick.mockResolvedValue(undefined);

      await useCase.execute(validShortCode);

      // Verifica se findByShortCode foi chamado antes de incrementClick
      const findCalls =
        mockFindByShortUrlRepository.findByShortCode.mock
          .invocationCallOrder[0];
      const incrementCalls =
        mockIncrementClickRepository.incrementClick.mock.invocationCallOrder[0];

      expect(findCalls).toBeLessThan(incrementCalls);
    });

    it('deve validar que as chamadas são feitas apenas uma vez em caso de sucesso', async () => {
      mockFindByShortUrlRepository.findByShortCode.mockResolvedValue(
        validUrlData,
      );
      mockIncrementClickRepository.incrementClick.mockResolvedValue(undefined);

      await useCase.execute(validShortCode);

      expect(findByShortUrlRepository.findByShortCode).toHaveBeenCalledTimes(1);
      expect(incrementClickRepository.incrementClick).toHaveBeenCalledTimes(1);
    });

    it('deve propagar corretamente diferentes tipos de erro na busca', async () => {
      const errors = [
        new Error('Timeout'),
        new Error('Network error'),
        new Error('Permission denied'),
      ];

      for (const error of errors) {
        mockFindByShortUrlRepository.findByShortCode.mockRejectedValue(error);

        await expect(useCase.execute(validShortCode)).rejects.toThrow(
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
      }
    });
  });
});
