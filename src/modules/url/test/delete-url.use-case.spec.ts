import { Test, TestingModule } from '@nestjs/testing';
import { DeleteUrlUseCase } from '../use-case/delete-url.use-case';
import { FindByIdRepository, DeleteUrlRepository } from '../repository';
import {
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';

describe('DeleteUrlUseCase', () => {
  let useCase: DeleteUrlUseCase;
  let findByIdRepository: FindByIdRepository;
  let deleteUrlRepository: DeleteUrlRepository;
  let logger: Logger;

  const mockFindByIdRepository = {
    findById: jest.fn(),
  };

  const mockDeleteUrlRepository = {
    delete: jest.fn(),
  };

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteUrlUseCase,
        {
          provide: FindByIdRepository,
          useValue: mockFindByIdRepository,
        },
        {
          provide: DeleteUrlRepository,
          useValue: mockDeleteUrlRepository,
        },
        {
          provide: Logger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    useCase = module.get<DeleteUrlUseCase>(DeleteUrlUseCase);
    findByIdRepository = module.get<FindByIdRepository>(FindByIdRepository);
    deleteUrlRepository = module.get<DeleteUrlRepository>(DeleteUrlRepository);
    logger = module.get<Logger>(Logger);

    // Limpar mocks antes de cada teste
    Object.values(mockFindByIdRepository).forEach((mock) => {
      (mock as jest.Mock).mockClear();
    });
    Object.values(mockDeleteUrlRepository).forEach((mock) => {
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
    const existingUrlData = {
      id: validUrlId,
      originalUrl: 'https://exemplo.com',
      shortCode: 'abc123',
      clicks: 15,
      userId: validUserId,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    it('deve deletar a URL com sucesso', async () => {
      mockFindByIdRepository.findById.mockResolvedValue(existingUrlData);
      mockDeleteUrlRepository.delete.mockResolvedValue(existingUrlData);

      const result = await useCase.execute(validUrlId, validUserId);

      expect(findByIdRepository.findById).toHaveBeenCalledWith(validUrlId);
      expect(findByIdRepository.findById).toHaveBeenCalledTimes(1);
      expect(deleteUrlRepository.delete).toHaveBeenCalledWith(validUrlId);
      expect(deleteUrlRepository.delete).toHaveBeenCalledTimes(1);
      expect(logger.log).toHaveBeenCalledWith(
        `URL deletada com sucesso: ${existingUrlData.id}`,
      );
      expect(result).toEqual(existingUrlData);
    });

    it('deve lançar UnauthorizedException quando usuário não é o proprietário', async () => {
      const anotherUserId = 'user-456';
      mockFindByIdRepository.findById.mockResolvedValue(existingUrlData);

      await expect(useCase.execute(validUrlId, anotherUserId)).rejects.toThrow(
        new UnauthorizedException(
          'Você não tem permissão para deletar esta URL.',
        ),
      );

      expect(findByIdRepository.findById).toHaveBeenCalledWith(validUrlId);
      expect(deleteUrlRepository.delete).not.toHaveBeenCalled();
      expect(logger.log).not.toHaveBeenCalled();
    });

    it('deve lançar ServiceUnavailableException quando deleção falha', async () => {
      const deleteError = new Error('Erro de conexão com o banco de dados');
      mockFindByIdRepository.findById.mockResolvedValue(existingUrlData);
      mockDeleteUrlRepository.delete.mockRejectedValue(deleteError);

      await expect(useCase.execute(validUrlId, validUserId)).rejects.toThrow(
        new ServiceUnavailableException('Ops! Algo deu errado', {
          cause: deleteError,
          description: `Erro ao deletar a URL. ${deleteError.message}`,
        }),
      );

      expect(findByIdRepository.findById).toHaveBeenCalledWith(validUrlId);
      expect(deleteUrlRepository.delete).toHaveBeenCalledWith(validUrlId);
      expect(logger.error).toHaveBeenCalledWith(
        'Ops! Algo deu errado',
        deleteError,
        expect.any(String),
      );
      expect(logger.log).not.toHaveBeenCalled();
    });

    it('deve lançar ServiceUnavailableException quando busca por ID falha', async () => {
      const findError = new Error('Erro ao buscar URL por ID');
      mockFindByIdRepository.findById.mockRejectedValue(findError);

      await expect(useCase.execute(validUrlId, validUserId)).rejects.toThrow(
        new ServiceUnavailableException('Ops! Algo deu errado', {
          cause: findError,
          description: `Erro ao deletar a URL. ${findError.message}`,
        }),
      );

      expect(findByIdRepository.findById).toHaveBeenCalledWith(validUrlId);
      expect(deleteUrlRepository.delete).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith(
        'Ops! Algo deu errado',
        findError,
        expect.any(String),
      );
    });

    it('deve propagar UnauthorizedException sem modificar quando usuário não autorizado', async () => {
      const unauthorizedUserId = 'unauthorized-user';
      const authError = new UnauthorizedException(
        'Você não tem permissão para deletar esta URL.',
      );
      mockFindByIdRepository.findById.mockResolvedValue(existingUrlData);

      await expect(
        useCase.execute(validUrlId, unauthorizedUserId),
      ).rejects.toThrow(authError);

      expect(findByIdRepository.findById).toHaveBeenCalledWith(validUrlId);
      expect(deleteUrlRepository.delete).not.toHaveBeenCalled();
    });

    it('deve validar que a verificação de propriedade é feita antes da deleção', async () => {
      mockFindByIdRepository.findById.mockResolvedValue(existingUrlData);
      mockDeleteUrlRepository.delete.mockResolvedValue(existingUrlData);

      await useCase.execute(validUrlId, validUserId);

      // Verifica se findById foi chamado antes de delete
      const findCalls =
        mockFindByIdRepository.findById.mock.invocationCallOrder[0];
      const deleteCalls =
        mockDeleteUrlRepository.delete.mock.invocationCallOrder[0];

      expect(findCalls).toBeLessThan(deleteCalls);
    });

    it('deve funcionar com diferentes IDs de URL', async () => {
      const urlIds = ['url-1', 'url-abc-123', 'very-long-url-id-123456'];

      for (const urlId of urlIds) {
        const urlData = { ...existingUrlData, id: urlId };
        mockFindByIdRepository.findById.mockResolvedValue(urlData);
        mockDeleteUrlRepository.delete.mockResolvedValue(urlData);

        const result = await useCase.execute(urlId, validUserId);

        expect(findByIdRepository.findById).toHaveBeenCalledWith(urlId);
        expect(deleteUrlRepository.delete).toHaveBeenCalledWith(urlId);
        expect(logger.log).toHaveBeenCalledWith(
          `URL deletada com sucesso: ${urlId}`,
        );
        expect(result.id).toBe(urlId);
      }
    });

    it('deve funcionar com diferentes IDs de usuário', async () => {
      const userIds = ['user-1', 'user-abc-123', 'very-long-user-id-123456'];

      for (const userId of userIds) {
        const urlData = { ...existingUrlData, userId };
        mockFindByIdRepository.findById.mockResolvedValue(urlData);
        mockDeleteUrlRepository.delete.mockResolvedValue(urlData);

        const result = await useCase.execute(validUrlId, userId);

        expect(result.userId).toBe(userId);
        expect(logger.log).toHaveBeenCalledWith(
          `URL deletada com sucesso: ${validUrlId}`,
        );
      }
    });

    it('deve retornar os dados completos da URL deletada', async () => {
      mockFindByIdRepository.findById.mockResolvedValue(existingUrlData);
      mockDeleteUrlRepository.delete.mockResolvedValue(existingUrlData);

      const result = await useCase.execute(validUrlId, validUserId);

      expect(result).toEqual(existingUrlData);
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('originalUrl');
      expect(result).toHaveProperty('shortCode');
      expect(result).toHaveProperty('clicks');
      expect(result).toHaveProperty('userId');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');
      expect(result).toHaveProperty('deletedAt');
    });

    it('deve lidar com URL que não existe (findById retorna null)', async () => {
      mockFindByIdRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(validUrlId, validUserId)).rejects.toThrow();

      expect(findByIdRepository.findById).toHaveBeenCalledWith(validUrlId);
      expect(deleteUrlRepository.delete).not.toHaveBeenCalled();
    });

    it('deve garantir que apenas uma chamada de cada repositório é feita em caso de sucesso', async () => {
      mockFindByIdRepository.findById.mockResolvedValue(existingUrlData);
      mockDeleteUrlRepository.delete.mockResolvedValue(existingUrlData);

      await useCase.execute(validUrlId, validUserId);

      expect(findByIdRepository.findById).toHaveBeenCalledTimes(1);
      expect(deleteUrlRepository.delete).toHaveBeenCalledTimes(1);
      expect(logger.log).toHaveBeenCalledTimes(1);
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('deve lidar com diferentes tipos de erro na deleção', async () => {
      const errors = [
        new Error('Timeout na operação'),
        new Error('Violação de constraint'),
        new Error('Conexão perdida'),
      ];

      for (const error of errors) {
        mockFindByIdRepository.findById.mockResolvedValue(existingUrlData);
        mockDeleteUrlRepository.delete.mockRejectedValue(error);

        await expect(useCase.execute(validUrlId, validUserId)).rejects.toThrow(
          new ServiceUnavailableException('Ops! Algo deu errado', {
            cause: error,
            description: `Erro ao deletar a URL. ${error.message}`,
          }),
        );

        expect(logger.error).toHaveBeenCalledWith(
          'Ops! Algo deu errado',
          error,
          expect.any(String),
        );
      }
    });

    it('deve garantir que o log de sucesso seja específico para o ID deletado', async () => {
      const specificUrlId = 'url-specific-delete-test';
      const urlData = { ...existingUrlData, id: specificUrlId };
      mockFindByIdRepository.findById.mockResolvedValue(urlData);
      mockDeleteUrlRepository.delete.mockResolvedValue(urlData);

      await useCase.execute(specificUrlId, validUserId);

      expect(logger.log).toHaveBeenCalledWith(
        `URL deletada com sucesso: ${specificUrlId}`,
      );
      expect(logger.log).toHaveBeenCalledTimes(1);
    });
  });
});
