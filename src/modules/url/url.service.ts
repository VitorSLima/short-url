import { Injectable } from '@nestjs/common';
import {
  ShortenUrlUseCase,
  RedirectToOriginalUseCase,
  FindByUserUseCase,
  UpdateUrlUseCase,
  DeleteUrlUseCase,
} from './use-case';

@Injectable()
export class UrlService {
  constructor(
    private readonly shortenUrlUseCase: ShortenUrlUseCase,
    private readonly redirectToOriginalUseCase: RedirectToOriginalUseCase,
    private readonly findByUserUseCase: FindByUserUseCase,
    private readonly updateUrlUseCase: UpdateUrlUseCase,
    private readonly deleteUrlUseCase: DeleteUrlUseCase,
  ) {}

  async shortenUrl(originalUrl: string, req: any, userId?: string) {
    return await this.shortenUrlUseCase.execute(originalUrl, req, userId);
  }

  async redirectToOriginal(shortUrl: string) {
    return await this.redirectToOriginalUseCase.execute(shortUrl);
  }

  async findByUser(userId: string) {
    return await this.findByUserUseCase.execute(userId);
  }

  async update(id: string, originalUrl: string, userId: string) {
    return await this.updateUrlUseCase.execute(id, originalUrl, userId);
  }

  async remove(id: string, userId: string) {
    return await this.deleteUrlUseCase.execute(id, userId);
  }
}
