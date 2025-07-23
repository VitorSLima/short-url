import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  NotFoundException,
  Res,
  UseInterceptors,
  ClassSerializerInterceptor,
  Patch,
  Delete,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { UrlService } from './url.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { User } from '../../shared/interfaces/User';

@ApiTags('url')
@Controller()
export class UrlController {
  constructor(
    private readonly urlService: UrlService,
    private readonly logger: Logger,
  ) {}

  @Post('short-url')
  @ApiOperation({ summary: 'Encurta uma URL' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        originalUrl: {
          type: 'string',
          example: 'https://www.google.com',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'A URL encurtada.',
  })
  async shorten(@Body('originalUrl') originalUrl: string, @Req() req: any) {
    const userId = req.user ? (req.user as User).id : null;
    return await this.urlService.shortenUrl(originalUrl, req, userId);
  }

  @Get('urls')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({ summary: 'Busca todas as URLs do usuário' })
  @ApiResponse({ status: 200, description: 'Uma lista de URLs.' })
  async findByUser(@Req() req: any) {
    try {
      // Validate user exists and has valid ID
      if (!req.user || !req.user.id) {
        this.logger.error('Invalid user or user ID');
        throw new UnauthorizedException();
      }

      const userId = (req.user as User).id;
      return this.urlService.findByUser(userId);
    } catch (error) {
      this.logger.error(error);
      throw new UnauthorizedException();
    }
  }

  @Get(':shortCode')
  @ApiOperation({ summary: 'Redireciona para a URL original' })
  @ApiResponse({
    status: 302,
    description: 'Redirecionamento para a URL original.',
  })
  @ApiResponse({ status: 404, description: 'URL não encontrada.' })
  async redirect(@Param('shortCode') shortCode: string, @Res() res: any) {
    const originalUrl = await this.urlService.redirectToOriginal(shortCode);

    if (!originalUrl) {
      throw new NotFoundException('URL não encontrada.');
    }

    return res.redirect(originalUrl);
  }

  @Patch('url/:id')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({ summary: 'Atualiza uma URL' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        originalUrl: {
          type: 'string',
          example: 'https://www.google.com',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'A URL atualizada.' })
  async update(
    @Param('id') id: string,
    @Body('originalUrl') originalUrl: string,
    @Req() req: any,
  ) {
    const userId = (req.user as User).id;
    return this.urlService.update(id, originalUrl, userId);
  }

  @Delete('url/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Deleta uma URL' })
  @ApiResponse({ status: 204, description: 'URL deletada com sucesso.' })
  async remove(@Param('id') id: string, @Req() req: any) {
    const userId = (req.user as User).id;
    return this.urlService.remove(id, userId);
  }
}
