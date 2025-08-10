import {
  Body,
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Res,
  Req,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UrlsService } from './urls.service';
import { ShortenDto } from './dto/shorten.dto';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt.guard';
import { AuthGuard } from '@nestjs/passport';
import { UpdateUrlDto } from './dto/update-url.dto';

@ApiTags('urls')
@Controller()
export class UrlsController {
  constructor(private readonly urlsService: UrlsService) {}

  @Post('shorten')
  @ApiOperation({
    summary: 'Encurtar uma URL (com ou sem autenticação)',
    description:
      'Se autenticado via Bearer token, a URL será associada ao usuário. Caso contrário, será criada como anônima.',
  })
  @ApiBearerAuth()
  @ApiBody({ type: ShortenDto })
  @UseGuards(OptionalJwtAuthGuard)
  async shorten(@Body() dto: ShortenDto, @Req() req: any) {
    const userId = req.user?.userId ?? null;
    console.log('Por que não está vindo certo esse user ID:', userId); 
    return this.urlsService.createShort(dto, userId);
  }

  @Get(':code')
  async redirect(
    @Param('code') code: string,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    const url = await this.urlsService.findByCode(code);
    if (!url) throw new NotFoundException('URL not found');

    await this.urlsService.registerClick(url.id, {
      ip: req.ip,
      userAgent: req.headers['user-agent'] as string,
      referer: req.headers['referer'] as string,
    });

    return res.redirect(302, url.original);
  }

  @Get('user/urls')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lista URLs do usuário autenticado' })
  @UseGuards(AuthGuard('jwt'))
  async listMine(@Req() req: any) {
    return this.urlsService.listByUser(req.user.userId);
  }

  // ATUALIZAR destino de uma URL do usuário
  @Patch('user/urls/:id')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Atualiza a URL de destino de um encurtado do usuário',
  })
  @UseGuards(AuthGuard('jwt'))
  async updateMine(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: UpdateUrlDto,
  ) {
    return this.urlsService.updateOwnedUrl(id, req.user.userId, dto);
  }

  // DELETAR (soft delete) uma URL do usuário
  @Delete('user/urls/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft delete em uma URL encurtada do usuário' })
  @UseGuards(AuthGuard('jwt'))
  async deleteMine(@Param('id') id: string, @Req() req: any) {
    await this.urlsService.softDeleteOwnedUrl(id, req.user.userId);
    return { status: 'ok' };
  }
}
