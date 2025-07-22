import { Test, TestingModule } from '@nestjs/testing';
import { DeleteUrlUseCase } from './delete-url.use-case';
import { FindByIdRepository, DeleteUrlRepository } from '../repository';
import {
  ForbiddenException,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';

describe('DeleteUrlUseCase', () => {
  let useCase: DeleteUrlUseCase;
  let findByIdRepository: FindByIdRepository;
  let deleteUrlRepository: DeleteUrlRepository;
  let logger: Logger;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteUrlUseCase,
        {
          provide: FindByIdRepository,
          useValue: {
            findById: jest.fn(),
          },
        },
        {
          provide: DeleteUrlRepository,
          useValue: {
            delete: jest.fn(),
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

    useCase = module.get<DeleteUrlUseCase>(DeleteUrlUseCase);
    findByIdRepository = module.get<FindByIdRepository>(FindByIdRepository);
    deleteUrlRepository = module.get<DeleteUrlRepository>(DeleteUrlRepository);
    logger = module.get<Logger>(Logger);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    const urlId = 'url-123';
    const userId = 'user-123';
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

    it('should delete the url', async () => {
      jest.spyOn(findByIdRepository, 'findById').mockResolvedValue(urlData);
      jest.spyOn(deleteUrlRepository, 'delete').mockResolvedValue(urlData);

      await useCase.execute(urlId, userId);

      expect(findByIdRepository.findById).toHaveBeenCalledWith(urlId);
      expect(deleteUrlRepository.delete).toHaveBeenCalledWith(urlId);
      expect(logger.log).toHaveBeenCalledWith(
        `URL deletada com sucesso: ${urlId}`,
      );
    });

    it('should throw UnauthorizedException if user is not the owner', async () => {
      const otherUserId = 'user-456';
      jest.spyOn(findByIdRepository, 'findById').mockResolvedValue(urlData);

      await expect(useCase.execute(urlId, otherUserId)).rejects.toThrow(
        new UnauthorizedException(
          'Você não tem permissão para deletar esta URL.',
        ),
      );
    });

    it('should throw ServiceUnavailableException when deletion fails', async () => {
      const error = new Error('Database error');
      jest.spyOn(findByIdRepository, 'findById').mockResolvedValue(urlData);
      jest.spyOn(deleteUrlRepository, 'delete').mockRejectedValue(error);

      await expect(useCase.execute(urlId, userId)).rejects.toThrow(
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
    });
  });
});
