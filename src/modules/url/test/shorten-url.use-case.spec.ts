import { Test, TestingModule } from '@nestjs/testing';
import { ShortenUrlUseCase } from '../use-case/shorten-url.use-case';
import { CreateUrlRepository } from '../repository';
import { Logger, ServiceUnavailableException } from '@nestjs/common';
import * as shortenUrlUtil from 'src/shared/utils/shortenUrl';

describe('ShortenUrlUseCase', () => {
  let useCase: ShortenUrlUseCase;
  let createUrlRepository: CreateUrlRepository;
  let logger: Logger;

  const mockCreateUrlRepository = {
    create: jest.fn(),
  };

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShortenUrlUseCase,
        {
          provide: CreateUrlRepository,
          useValue: mockCreateUrlRepository,
        },
        {
          provide: Logger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    useCase = module.get<ShortenUrlUseCase>(ShortenUrlUseCase);
    createUrlRepository = module.get<CreateUrlRepository>(CreateUrlRepository);
    logger = module.get<Logger>(Logger);

    // Limpar mocks antes de cada teste
    Object.values(mockCreateUrlRepository).forEach((mock) => {
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
    const validOriginalUrl = 'https://exemplo.com';
    const mockReq = {
      protocol: 'http',
      get: jest.fn().mockReturnValue('localhost:3000'),
    };
    const validUserId = 'user-123';
    const expectedShortCode = 'abc123';

    beforeEach(() => {
      jest
        .spyOn(shortenUrlUtil, 'shortenUrl')
        .mockReturnValue(expectedShortCode);
      (mockReq.get as jest.Mock).mockClear();
    });

    it('deve encurtar uma URL para usuário autenticado e retornar a URL encurtada', async () => {
      mockCreateUrlRepository.create.mockResolvedValue(undefined);

      const result = await useCase.execute(
        validOriginalUrl,
        mockReq,
        validUserId,
      );

      expect(shortenUrlUtil.shortenUrl).toHaveBeenCalled();
      expect(createUrlRepository.create).toHaveBeenCalledWith({
        originalUrl: validOriginalUrl,
        shortCode: expectedShortCode,
        userId: validUserId,
      });
      expect(logger.log).toHaveBeenCalledWith(
        `URL encurtada criada com sucesso: ${expectedShortCode}`,
      );
      expect(result).toEqual({
        shortUrl: `http://localhost:3000/${expectedShortCode}`,
      });
    });

    it('deve encurtar uma URL para usuário não autenticado (guest)', async () => {
      mockCreateUrlRepository.create.mockResolvedValue(undefined);

      const result = await useCase.execute(validOriginalUrl, mockReq, null);

      expect(createUrlRepository.create).toHaveBeenCalledWith({
        originalUrl: validOriginalUrl,
        shortCode: expectedShortCode,
        userId: null,
      });
      expect(result).toEqual({
        shortUrl: `http://localhost:3000/${expectedShortCode}`,
      });
    });

    it('deve encurtar uma URL sem userId definido', async () => {
      mockCreateUrlRepository.create.mockResolvedValue(undefined);

      const result = await useCase.execute(validOriginalUrl, mockReq);

      expect(createUrlRepository.create).toHaveBeenCalledWith({
        originalUrl: validOriginalUrl,
        shortCode: expectedShortCode,
        userId: undefined,
      });
      expect(result).toEqual({
        shortUrl: `http://localhost:3000/${expectedShortCode}`,
      });
    });

    it('deve construir a URL corretamente com HTTPS', async () => {
      const httpsReq = {
        protocol: 'https',
        get: jest.fn().mockReturnValue('meudominio.com'),
      };
      mockCreateUrlRepository.create.mockResolvedValue(undefined);

      const result = await useCase.execute(
        validOriginalUrl,
        httpsReq,
        validUserId,
      );

      expect(result).toEqual({
        shortUrl: `https://meudominio.com/${expectedShortCode}`,
      });
    });

    it('deve lançar ServiceUnavailableException quando criação falha', async () => {
      const dbError = new Error('Erro de conexão com o banco de dados');
      mockCreateUrlRepository.create.mockRejectedValue(dbError);

      await expect(
        useCase.execute(validOriginalUrl, mockReq, validUserId),
      ).rejects.toThrow(
        new ServiceUnavailableException('Ops! Algo deu errado', {
          cause: dbError,
          description: `Erro ao criar a URL encurtada. ${dbError.message}`,
        }),
      );

      expect(logger.error).toHaveBeenCalledWith(
        'Ops! Algo deu errado',
        dbError,
        expect.any(String),
      );
    });

    it('deve gerar código único para cada URL', async () => {
      const differentShortCode = 'xyz789';
      jest
        .spyOn(shortenUrlUtil, 'shortenUrl')
        .mockReturnValue(differentShortCode);
      mockCreateUrlRepository.create.mockResolvedValue(undefined);

      const result = await useCase.execute(
        validOriginalUrl,
        mockReq,
        validUserId,
      );

      expect(createUrlRepository.create).toHaveBeenCalledWith({
        originalUrl: validOriginalUrl,
        shortCode: differentShortCode,
        userId: validUserId,
      });
      expect(result.shortUrl).toContain(differentShortCode);
    });

    it('deve validar que o repositório é chamado apenas uma vez', async () => {
      mockCreateUrlRepository.create.mockResolvedValue(undefined);

      await useCase.execute(validOriginalUrl, mockReq, validUserId);

      expect(createUrlRepository.create).toHaveBeenCalledTimes(1);
      expect(logger.log).toHaveBeenCalledTimes(1);
    });

    it('deve lidar com URLs diferentes corretamente', async () => {
      const anotherUrl = 'https://outro-exemplo.com/pagina';
      mockCreateUrlRepository.create.mockResolvedValue(undefined);

      const result = await useCase.execute(anotherUrl, mockReq, validUserId);

      expect(createUrlRepository.create).toHaveBeenCalledWith({
        originalUrl: anotherUrl,
        shortCode: expectedShortCode,
        userId: validUserId,
      });
      expect(result).toEqual({
        shortUrl: `http://localhost:3000/${expectedShortCode}`,
      });
    });

    it('deve log apenas em caso de sucesso', async () => {
      const dbError = new Error('Falha no banco');
      mockCreateUrlRepository.create.mockRejectedValue(dbError);

      try {
        await useCase.execute(validOriginalUrl, mockReq, validUserId);
      } catch (error) {
        // Expected error
      }

      expect(logger.log).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalled();
    });
  });
});
