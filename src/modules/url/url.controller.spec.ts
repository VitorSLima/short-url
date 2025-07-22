import { Test, TestingModule } from '@nestjs/testing';
import { UrlController } from './url.controller';
import { UrlService } from './url.service';
import { NotFoundException } from '@nestjs/common';
import { Response } from 'express';

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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UrlController],
      providers: [
        {
          provide: UrlService,
          useValue: mockUrlService,
        },
      ],
    }).compile();

    controller = module.get<UrlController>(UrlController);
    service = module.get<UrlService>(UrlService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('shorten', () => {
    it('should shorten a url for an authenticated user', async () => {
      const originalUrl = 'http://example.com';
      const req: any = { user: { id: 'userId' } };
      mockUrlService.shortenUrl.mockResolvedValue('shortenedUrl');

      const result = await controller.shorten(originalUrl, req);

      expect(service.shortenUrl).toHaveBeenCalledWith(
        originalUrl,
        req,
        'userId',
      );
      expect(result).toEqual('shortenedUrl');
    });

    it('should shorten a url for a guest user', async () => {
      const originalUrl = 'http://example.com';
      const req: any = { user: null };
      mockUrlService.shortenUrl.mockResolvedValue('shortenedUrl');

      const result = await controller.shorten(originalUrl, req);

      expect(service.shortenUrl).toHaveBeenCalledWith(originalUrl, req, null);
      expect(result).toEqual('shortenedUrl');
    });
  });

  describe('findByUser', () => {
    it('should find urls by user', async () => {
      const req: any = { user: { id: 'userId' } };
      mockUrlService.findByUser.mockResolvedValue(['url1', 'url2']);

      const result = await controller.findByUser(req);

      expect(service.findByUser).toHaveBeenCalledWith('userId');
      expect(result).toEqual(['url1', 'url2']);
    });
  });

  describe('update', () => {
    it('should update a url', async () => {
      const id = 'urlId';
      const originalUrl = 'http://newexample.com';
      const req: any = { user: { id: 'userId' } };
      mockUrlService.update.mockResolvedValue('updatedUrl');

      const result = await controller.update(id, originalUrl, req);

      expect(service.update).toHaveBeenCalledWith(id, originalUrl, 'userId');
      expect(result).toEqual('updatedUrl');
    });
  });

  describe('remove', () => {
    it('should remove a url', async () => {
      const id = 'urlId';
      const req: any = { user: { id: 'userId' } };
      mockUrlService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(id, req);

      expect(service.remove).toHaveBeenCalledWith(id, 'userId');
      expect(result).toBeUndefined();
    });
  });

  describe('redirect', () => {
    it('should redirect to the original url', async () => {
      const shortCode = 'shortCode';
      const originalUrl = 'http://example.com';
      const res = {
        redirect: jest.fn(),
      } as unknown as Response;
      mockUrlService.redirectToOriginal.mockResolvedValue(originalUrl);

      await controller.redirect(shortCode, res);

      expect(service.redirectToOriginal).toHaveBeenCalledWith(shortCode);
      expect(res.redirect).toHaveBeenCalledWith(originalUrl);
    });

    it('should throw NotFoundException if url not found', async () => {
      const shortCode = 'shortCode';
      const res = {
        redirect: jest.fn(),
      } as unknown as Response;
      mockUrlService.redirectToOriginal.mockResolvedValue(null);

      await expect(controller.redirect(shortCode, res)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
