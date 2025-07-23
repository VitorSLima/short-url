import { Test, TestingModule } from '@nestjs/testing';
import { FindUrlByUserUseCase } from '../use-case/find-url-by-user.use-case';
import { FindUrlByUserRepository } from '../repository';
import { Logger } from '@nestjs/common';
import { ServiceUnavailableException } from '@nestjs/common';

describe('FindUrlByUserUseCase', () => {
  let useCase: FindUrlByUserUseCase;
  let repository: FindUrlByUserRepository;
  let logger: Logger;

  const mockFindUrlByUserRepository = {
    findUrlByUser: jest.fn(),
  };

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindUrlByUserUseCase,
        {
          provide: FindUrlByUserRepository,
          useValue: mockFindUrlByUserRepository,
        },
        {
          provide: Logger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    useCase = module.get<FindUrlByUserUseCase>(FindUrlByUserUseCase);
    repository = module.get<FindUrlByUserRepository>(FindUrlByUserRepository);
    logger = module.get<Logger>(Logger);

    // Limpar mocks antes de cada teste
    Object.values(mockFindUrlByUserRepository).forEach((mock) => {
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
    const validUserId = 'user-123';

    it('deve retornar um array de URLs do usuário', async () => {
      const expectedUrls = [
        {
          id: 'url-1',
          originalUrl: 'https://exemplo.com',
          shortCode: 'abc123',
          clicks: 5,
          userId: validUserId,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
        {
          id: 'url-2',
          originalUrl: 'https://outro-exemplo.com',
          shortCode: 'def456',
          clicks: 2,
          userId: validUserId,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ];
      mockFindUrlByUserRepository.findUrlByUser.mockResolvedValue(expectedUrls);

      const result = await useCase.execute(validUserId);

      expect(result).toEqual(expectedUrls);
      expect(repository.findUrlByUser).toHaveBeenCalledWith(validUserId);
      expect(repository.findUrlByUser).toHaveBeenCalledTimes(1);
      expect(logger.log).toHaveBeenCalledWith(
        `URLs encontradas para o usuário: ${validUserId}`,
      );
    });

    it('deve retornar array vazio quando usuário não tem URLs', async () => {
      const emptyUrls = [];
      mockFindUrlByUserRepository.findUrlByUser.mockResolvedValue(emptyUrls);

      const result = await useCase.execute(validUserId);

      expect(result).toEqual(emptyUrls);
      expect(repository.findUrlByUser).toHaveBeenCalledWith(validUserId);
      expect(logger.log).toHaveBeenCalledWith(
        `URLs encontradas para o usuário: ${validUserId}`,
      );
    });

    it('deve lançar ServiceUnavailableException quando algo dá errado', async () => {
      const dbError = new Error('Erro de conexão com o banco de dados');
      mockFindUrlByUserRepository.findUrlByUser.mockRejectedValue(dbError);

      await expect(useCase.execute(validUserId)).rejects.toThrow(
        new ServiceUnavailableException('Ops! Algo deu errado', {
          cause: dbError,
          description: `Erro ao buscar as URLs do usuário. ${dbError.message}`,
        }),
      );

      expect(repository.findUrlByUser).toHaveBeenCalledWith(validUserId);
      expect(logger.error).toHaveBeenCalledWith(
        'Ops! Algo deu errado',
        dbError,
        expect.any(String),
      );
      expect(logger.log).not.toHaveBeenCalled();
    });

    it('deve lidar com diferentes tipos de erro corretamente', async () => {
      const networkError = new Error('Erro de rede');
      mockFindUrlByUserRepository.findUrlByUser.mockRejectedValue(networkError);

      await expect(useCase.execute(validUserId)).rejects.toThrow(
        new ServiceUnavailableException('Ops! Algo deu errado', {
          cause: networkError,
          description: `Erro ao buscar as URLs do usuário. ${networkError.message}`,
        }),
      );

      expect(logger.error).toHaveBeenCalledWith(
        'Ops! Algo deu errado',
        networkError,
        expect.any(String),
      );
    });

    it('deve validar que o repositório é chamado apenas uma vez em sucesso', async () => {
      const mockUrls = [
        {
          id: 'url-1',
          originalUrl: 'https://teste.com',
          shortCode: 'test123',
          clicks: 0,
          userId: validUserId,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ];
      mockFindUrlByUserRepository.findUrlByUser.mockResolvedValue(mockUrls);

      await useCase.execute(validUserId);

      expect(repository.findUrlByUser).toHaveBeenCalledTimes(1);
      expect(logger.log).toHaveBeenCalledTimes(1);
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('deve funcionar com diferentes userIds', async () => {
      const anotherUserId = 'user-456';
      const userUrls = [
        {
          id: 'url-3',
          originalUrl: 'https://diferente.com',
          shortCode: 'ghi789',
          clicks: 10,
          userId: anotherUserId,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ];
      mockFindUrlByUserRepository.findUrlByUser.mockResolvedValue(userUrls);

      const result = await useCase.execute(anotherUserId);

      expect(repository.findUrlByUser).toHaveBeenCalledWith(anotherUserId);
      expect(result).toEqual(userUrls);
      expect(logger.log).toHaveBeenCalledWith(
        `URLs encontradas para o usuário: ${anotherUserId}`,
      );
    });

    it('deve incluir informações completas das URLs retornadas', async () => {
      const completeUrl = {
        id: 'url-complete',
        originalUrl: 'https://completo.com/pagina/subpagina',
        shortCode: 'comp123',
        clicks: 25,
        userId: validUserId,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02'),
        deletedAt: null,
      };
      mockFindUrlByUserRepository.findUrlByUser.mockResolvedValue([
        completeUrl,
      ]);

      const result = await useCase.execute(validUserId);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(completeUrl);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('originalUrl');
      expect(result[0]).toHaveProperty('shortCode');
      expect(result[0]).toHaveProperty('clicks');
      expect(result[0]).toHaveProperty('userId');
      expect(result[0]).toHaveProperty('createdAt');
      expect(result[0]).toHaveProperty('updatedAt');
      expect(result[0]).toHaveProperty('deletedAt');
    });

    it('deve garantir que a mensagem de log seja específica para o usuário', async () => {
      const specificUserId = 'user-specific-789';
      mockFindUrlByUserRepository.findUrlByUser.mockResolvedValue([]);

      await useCase.execute(specificUserId);

      expect(logger.log).toHaveBeenCalledWith(
        `URLs encontradas para o usuário: ${specificUserId}`,
      );
      expect(logger.log).toHaveBeenCalledTimes(1);
    });
  });
});
