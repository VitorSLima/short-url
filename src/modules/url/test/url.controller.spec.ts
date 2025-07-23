import { Test, TestingModule } from '@nestjs/testing';
import { UrlController } from '../url.controller';
import { UrlService } from '../url.service';
import { User } from '../../../shared/interfaces/User';
import {
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

describe('UrlController', () => {
  let controller: UrlController;
  let service: UrlService;

  const mockUrlService = {
    shortenUrl: jest.fn(),
    findByUser: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    redirectToOriginal: jest.fn(),
  };

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UrlController],
      providers: [
        {
          provide: UrlService,
          useValue: mockUrlService,
        },
        {
          provide: Logger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    controller = module.get<UrlController>(UrlController);
    service = module.get<UrlService>(UrlService);

    // Limpar mocks antes de cada teste
    Object.values(mockUrlService).forEach((mock) => {
      (mock as jest.Mock).mockClear();
    });
    Object.values(mockLogger).forEach((mock) => {
      (mock as jest.Mock).mockClear();
    });
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('shorten', () => {
    const validOriginalUrl = 'https://exemplo.com';

    it('deve encurtar uma URL para usuário autenticado', async () => {
      const user: User = {
        id: 'user-123',
        email: 'teste@exemplo.com',
        password: 'senhaHasheada',
        name: 'Usuário Teste',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };
      const req = { user };
      const expectedResult = {
        shortUrl: 'http://localhost:3000/abc123',
      };
      mockUrlService.shortenUrl.mockResolvedValue(expectedResult);

      const result = await controller.shorten(validOriginalUrl, req);

      expect(mockUrlService.shortenUrl).toHaveBeenCalledWith(
        validOriginalUrl,
        req,
        user.id,
      );
      expect(mockUrlService.shortenUrl).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResult);
    });

    it('deve encurtar uma URL para usuário não autenticado (guest)', async () => {
      const req = { user: null };
      const expectedResult = {
        shortUrl: 'http://localhost:3000/def456',
      };
      mockUrlService.shortenUrl.mockResolvedValue(expectedResult);

      const result = await controller.shorten(validOriginalUrl, req);

      expect(mockUrlService.shortenUrl).toHaveBeenCalledWith(
        validOriginalUrl,
        req,
        null,
      );
      expect(mockUrlService.shortenUrl).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResult);
    });

    it('deve encurtar uma URL quando req.user é undefined', async () => {
      const req = {};
      const expectedResult = {
        shortUrl: 'http://localhost:3000/ghi789',
      };
      mockUrlService.shortenUrl.mockResolvedValue(expectedResult);

      const result = await controller.shorten(validOriginalUrl, req);

      expect(mockUrlService.shortenUrl).toHaveBeenCalledWith(
        validOriginalUrl,
        req,
        null,
      );
      expect(result).toEqual(expectedResult);
    });

    it('deve propagar erros do service corretamente', async () => {
      const error = new Error('Erro ao encurtar URL');
      const req = { user: null };
      mockUrlService.shortenUrl.mockRejectedValue(error);

      await expect(controller.shorten(validOriginalUrl, req)).rejects.toThrow(
        error,
      );
      expect(mockUrlService.shortenUrl).toHaveBeenCalledWith(
        validOriginalUrl,
        req,
        null,
      );
    });
  });

  describe('findByUser', () => {
    const validUser: User = {
      id: 'user-123',
      email: 'teste@exemplo.com',
      password: 'senhaHasheada',
      name: 'Usuário Teste',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    it('deve buscar URLs do usuário com sucesso', async () => {
      const req = { user: validUser };
      const expectedUrls = [
        {
          id: 'url-1',
          originalUrl: 'https://exemplo1.com',
          shortCode: 'abc123',
          clicks: 5,
        },
        {
          id: 'url-2',
          originalUrl: 'https://exemplo2.com',
          shortCode: 'def456',
          clicks: 3,
        },
      ];
      mockUrlService.findByUser.mockResolvedValue(expectedUrls);

      const result = await controller.findByUser(req);

      expect(mockUrlService.findByUser).toHaveBeenCalledWith(validUser.id);
      expect(mockUrlService.findByUser).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedUrls);
    });

    it('deve lançar UnauthorizedException quando extração do userId falha', async () => {
      const req = { user: { id: undefined } }; // usuário sem ID válido
      
      await expect(controller.findByUser(req)).rejects.toThrow(UnauthorizedException);
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('deve lançar UnauthorizedException quando req.user é null', async () => {
      const req = { user: null };

      await expect(controller.findByUser(req)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('update', () => {
    const validUser: User = {
      id: 'user-123',
      email: 'teste@exemplo.com',
      password: 'senhaHasheada',
      name: 'Usuário Teste',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    it('deve atualizar uma URL com sucesso', async () => {
      const urlId = 'url-123';
      const newOriginalUrl = 'https://novo-exemplo.com';
      const req = { user: validUser };
      const expectedResult = {
        id: urlId,
        originalUrl: newOriginalUrl,
        shortCode: 'abc123',
        clicks: 0,
      };
      mockUrlService.update.mockResolvedValue(expectedResult);

      const result = await controller.update(urlId, newOriginalUrl, req);

      expect(mockUrlService.update).toHaveBeenCalledWith(
        urlId,
        newOriginalUrl,
        validUser.id,
      );
      expect(mockUrlService.update).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResult);
    });

    it('deve propagar erros do service corretamente', async () => {
      const urlId = 'url-123';
      const newOriginalUrl = 'https://novo-exemplo.com';
      const req = { user: validUser };
      const error = new UnauthorizedException(
        'Você não tem permissão para editar esta URL.',
      );
      mockUrlService.update.mockRejectedValue(error);

      await expect(
        controller.update(urlId, newOriginalUrl, req),
      ).rejects.toThrow(error);
      expect(mockUrlService.update).toHaveBeenCalledWith(
        urlId,
        newOriginalUrl,
        validUser.id,
      );
    });
  });

  describe('remove', () => {
    const validUser: User = {
      id: 'user-123',
      email: 'teste@exemplo.com',
      password: 'senhaHasheada',
      name: 'Usuário Teste',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    it('deve deletar uma URL com sucesso', async () => {
      const urlId = 'url-123';
      const req = { user: validUser };
      mockUrlService.remove.mockResolvedValue(undefined);

      await controller.remove(urlId, req);

      expect(mockUrlService.remove).toHaveBeenCalledWith(urlId, validUser.id);
      expect(mockUrlService.remove).toHaveBeenCalledTimes(1);
    });

    it('deve propagar erros do service corretamente', async () => {
      const urlId = 'url-123';
      const req = { user: validUser };
      const error = new UnauthorizedException(
        'Você não tem permissão para deletar esta URL.',
      );
      mockUrlService.remove.mockRejectedValue(error);

      await expect(controller.remove(urlId, req)).rejects.toThrow(error);
      expect(mockUrlService.remove).toHaveBeenCalledWith(urlId, validUser.id);
    });
  });

  describe('redirect', () => {
    it('deve redirecionar para a URL original quando encontrada', async () => {
      const shortCode = 'abc123';
      const originalUrl = 'https://exemplo.com';
      const res = {
        redirect: jest.fn(),
      };
      mockUrlService.redirectToOriginal.mockResolvedValue(originalUrl);

      await controller.redirect(shortCode, res);

      expect(mockUrlService.redirectToOriginal).toHaveBeenCalledWith(shortCode);
      expect(mockUrlService.redirectToOriginal).toHaveBeenCalledTimes(1);
      expect(res.redirect).toHaveBeenCalledWith(originalUrl);
    });

    it('deve lançar NotFoundException quando URL não é encontrada', async () => {
      const shortCode = 'inexistente';
      const res = {
        redirect: jest.fn(),
      };
      mockUrlService.redirectToOriginal.mockResolvedValue(null);

      await expect(controller.redirect(shortCode, res)).rejects.toThrow(
        new NotFoundException('URL não encontrada.'),
      );

      expect(mockUrlService.redirectToOriginal).toHaveBeenCalledWith(shortCode);
      expect(res.redirect).not.toHaveBeenCalled();
    });

    it('deve lançar NotFoundException quando URL retorna undefined', async () => {
      const shortCode = 'indefinido';
      const res = {
        redirect: jest.fn(),
      };
      mockUrlService.redirectToOriginal.mockResolvedValue(undefined);

      await expect(controller.redirect(shortCode, res)).rejects.toThrow(
        new NotFoundException('URL não encontrada.'),
      );

      expect(mockUrlService.redirectToOriginal).toHaveBeenCalledWith(shortCode);
      expect(res.redirect).not.toHaveBeenCalled();
    });

    it('deve propagar erros do service corretamente', async () => {
      const shortCode = 'abc123';
      const res = {
        redirect: jest.fn(),
      };
      const error = new Error('Erro interno do servidor');
      mockUrlService.redirectToOriginal.mockRejectedValue(error);

      await expect(controller.redirect(shortCode, res)).rejects.toThrow(error);
      expect(mockUrlService.redirectToOriginal).toHaveBeenCalledWith(shortCode);
      expect(res.redirect).not.toHaveBeenCalled();
    });
  });
});
