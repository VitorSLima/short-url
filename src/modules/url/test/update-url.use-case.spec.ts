import { Test, TestingModule } from '@nestjs/testing';
import { UpdateUrlUseCase } from '../use-case/update-url.use-case';
import { UpdateUrlRepository } from '../repository';
import { FindByIdRepository } from '../repository';
import {
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';

describe('UpdateUrlUseCase', () => {
  let useCase: UpdateUrlUseCase;
  let findByIdRepository: FindByIdRepository;
  let updateUrlRepository: UpdateUrlRepository;
  let logger: Logger;

  const mockFindByIdRepository = {
    findById: jest.fn(),
  };

  const mockUpdateUrlRepository = {
    execute: jest.fn(),
  };

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateUrlUseCase,
        {
          provide: FindByIdRepository,
          useValue: mockFindByIdRepository,
        },
        {
          provide: UpdateUrlRepository,
          useValue: mockUpdateUrlRepository,
        },
        {
          provide: Logger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    useCase = module.get<UpdateUrlUseCase>(UpdateUrlUseCase);
    findByIdRepository = module.get<FindByIdRepository>(FindByIdRepository);
    updateUrlRepository = module.get<UpdateUrlRepository>(UpdateUrlRepository);
    logger = module.get<Logger>(Logger);

    // Limpar mocks antes de cada teste
    Object.values(mockFindByIdRepository).forEach((mock) => {
      (mock as jest.Mock).mockClear();
    });
    Object.values(mockUpdateUrlRepository).forEach((mock) => {
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
    const validUrlId = 'url-123';
    const validUserId = 'user-123';
    const newOriginalUrl = 'https://novo-exemplo.com';
    const existingUrlData = {
      id: validUrlId,
      originalUrl: 'https://exemplo-antigo.com',
      shortCode: 'abc123',
      clicks: 10,
      userId: validUserId,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };
    const updatedUrlData = {
      ...existingUrlData,
      originalUrl: newOriginalUrl,
      updatedAt: new Date(),
    };

    it('deve atualizar a URL com sucesso', async () => {
      mockFindByIdRepository.findById.mockResolvedValue(existingUrlData);
      mockUpdateUrlRepository.execute.mockResolvedValue(updatedUrlData);

      const result = await useCase.execute(
        validUrlId,
        newOriginalUrl,
        validUserId,
      );

      expect(findByIdRepository.findById).toHaveBeenCalledWith(validUrlId);
      expect(findByIdRepository.findById).toHaveBeenCalledTimes(1);
      expect(updateUrlRepository.execute).toHaveBeenCalledWith(
        validUrlId,
        newOriginalUrl,
      );
      expect(updateUrlRepository.execute).toHaveBeenCalledTimes(1);
      expect(result).toEqual(updatedUrlData);
    });

    it('deve lançar UnauthorizedException quando usuário não é o proprietário', async () => {
      const anotherUserId = 'user-456';
      mockFindByIdRepository.findById.mockResolvedValue(existingUrlData);

      await expect(
        useCase.execute(validUrlId, newOriginalUrl, anotherUserId),
      ).rejects.toThrow(
        new UnauthorizedException(
          'Você não tem permissão para editar esta URL.',
        ),
      );

      expect(findByIdRepository.findById).toHaveBeenCalledWith(validUrlId);
      expect(updateUrlRepository.execute).not.toHaveBeenCalled();
    });

    it('deve lançar ServiceUnavailableException quando atualização falha', async () => {
      const updateError = new Error('Erro de conexão com o banco de dados');
      mockFindByIdRepository.findById.mockResolvedValue(existingUrlData);
      mockUpdateUrlRepository.execute.mockRejectedValue(updateError);

      await expect(
        useCase.execute(validUrlId, newOriginalUrl, validUserId),
      ).rejects.toThrow(
        new ServiceUnavailableException('Ops! Algo deu errado', {
          cause: updateError,
          description: `Erro ao editar a URL. ${updateError.message}`,
        }),
      );

      expect(logger.error).toHaveBeenCalledWith(
        'Ops! Algo deu errado',
        updateError,
        expect.any(String),
      );
    });

    it('deve lançar ServiceUnavailableException quando busca por ID falha', async () => {
      const findError = new Error('Erro ao buscar URL por ID');
      mockFindByIdRepository.findById.mockRejectedValue(findError);

      await expect(
        useCase.execute(validUrlId, newOriginalUrl, validUserId),
      ).rejects.toThrow(
        new ServiceUnavailableException('Ops! Algo deu errado', {
          cause: findError,
          description: `Erro ao editar a URL. ${findError.message}`,
        }),
      );

      expect(findByIdRepository.findById).toHaveBeenCalledWith(validUrlId);
      expect(updateUrlRepository.execute).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith(
        'Ops! Algo deu errado',
        findError,
        expect.any(String),
      );
    });

    it('deve propagar UnauthorizedException sem modificar quando usuário não autorizado', async () => {
      const unauthorizedUserId = 'unauthorized-user';
      const authError = new UnauthorizedException(
        'Você não tem permissão para editar esta URL.',
      );
      mockFindByIdRepository.findById.mockResolvedValue(existingUrlData);

      await expect(
        useCase.execute(validUrlId, newOriginalUrl, unauthorizedUserId),
      ).rejects.toThrow(authError);

      expect(findByIdRepository.findById).toHaveBeenCalledWith(validUrlId);
      expect(updateUrlRepository.execute).not.toHaveBeenCalled();
    });

    it('deve funcionar com diferentes URLs originais', async () => {
      const differentUrls = [
        'https://google.com',
        'http://localhost:8080',
        'https://subdomain.example.com/path?query=value',
        'https://example.com/very/long/path/with/many/segments',
      ];

      for (const url of differentUrls) {
        const expectedResult = { ...updatedUrlData, originalUrl: url };
        mockFindByIdRepository.findById.mockResolvedValue(existingUrlData);
        mockUpdateUrlRepository.execute.mockResolvedValue(expectedResult);

        const result = await useCase.execute(validUrlId, url, validUserId);

        expect(updateUrlRepository.execute).toHaveBeenCalledWith(
          validUrlId,
          url,
        );
        expect(result.originalUrl).toBe(url);
      }
    });

    it('deve validar que a verificação de propriedade é feita antes da atualização', async () => {
      mockFindByIdRepository.findById.mockResolvedValue(existingUrlData);
      mockUpdateUrlRepository.execute.mockResolvedValue(updatedUrlData);

      await useCase.execute(validUrlId, newOriginalUrl, validUserId);

      // Verifica se findById foi chamado antes de execute
      const findCalls =
        mockFindByIdRepository.findById.mock.invocationCallOrder[0];
      const updateCalls =
        mockUpdateUrlRepository.execute.mock.invocationCallOrder[0];

      expect(findCalls).toBeLessThan(updateCalls);
    });

    it('deve funcionar com diferentes IDs de URL', async () => {
      const urlIds = ['url-1', 'url-abc-123', 'very-long-url-id-123456'];

      for (const urlId of urlIds) {
        const urlData = { ...existingUrlData, id: urlId };
        const expectedResult = { ...updatedUrlData, id: urlId };
        mockFindByIdRepository.findById.mockResolvedValue(urlData);
        mockUpdateUrlRepository.execute.mockResolvedValue(expectedResult);

        const result = await useCase.execute(
          urlId,
          newOriginalUrl,
          validUserId,
        );

        expect(findByIdRepository.findById).toHaveBeenCalledWith(urlId);
        expect(result.id).toBe(urlId);
      }
    });

    it('deve preservar dados da URL que não foram alterados', async () => {
      mockFindByIdRepository.findById.mockResolvedValue(existingUrlData);
      mockUpdateUrlRepository.execute.mockResolvedValue(updatedUrlData);

      const result = await useCase.execute(
        validUrlId,
        newOriginalUrl,
        validUserId,
      );

      expect(result.id).toBe(existingUrlData.id);
      expect(result.shortCode).toBe(existingUrlData.shortCode);
      expect(result.clicks).toBe(existingUrlData.clicks);
      expect(result.userId).toBe(existingUrlData.userId);
      expect(result.originalUrl).toBe(newOriginalUrl); // Só este deve mudar
    });

    it('deve lidar com URL que não existe (findById retorna null)', async () => {
      mockFindByIdRepository.findById.mockResolvedValue(null);

      await expect(
        useCase.execute(validUrlId, newOriginalUrl, validUserId),
      ).rejects.toThrow();

      expect(findByIdRepository.findById).toHaveBeenCalledWith(validUrlId);
      expect(updateUrlRepository.execute).not.toHaveBeenCalled();
    });

    it('deve garantir que apenas uma chamada de cada repositório é feita em caso de sucesso', async () => {
      mockFindByIdRepository.findById.mockResolvedValue(existingUrlData);
      mockUpdateUrlRepository.execute.mockResolvedValue(updatedUrlData);

      await useCase.execute(validUrlId, newOriginalUrl, validUserId);

      expect(findByIdRepository.findById).toHaveBeenCalledTimes(1);
      expect(updateUrlRepository.execute).toHaveBeenCalledTimes(1);
    });
  });
});
