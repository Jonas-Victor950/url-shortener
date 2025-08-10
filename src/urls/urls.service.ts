import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUrlDto } from './dto/create-url.dto';
import { customAlphabet } from 'nanoid';
import { ShortenDto } from './dto/shorten.dto';
import { UpdateUrlDto } from './dto/update-url.dto';

const alphabet =
  '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const nanoid6 = customAlphabet(alphabet, 6);

@Injectable()
export class UrlsService {
  constructor(private readonly prisma: PrismaService) {}

  private appDomain() {
    return (
      process.env.APP_DOMAIN ||
      process.env.APP_BASE_URL ||
      'http://localhost:3000'
    );
  }

  async createShort(dto: ShortenDto, userId?: string | null) {
    for (let i = 0; i < 5; i++) {
      const code = nanoid6();
      try {
        const url = await this.prisma.url.create({
          data: {
            code,
            original: dto.originalUrl,
            userId: userId ?? null,
          },
        });
        return {
          shortUrl: `${this.appDomain()}/${code}`,
          ...url,
        };
      } catch (e: any) {
        if (e?.code === 'P2002') continue;
        throw e;
      }
    }

    const fallback = await this.prisma.url.create({
      data: {
        code: customAlphabet(alphabet, 7)(),
        original: dto.originalUrl,
        userId: userId ?? null,
      },
    });
    return {
      shortUrl: `${this.appDomain()}/${fallback.code}`,
      ...fallback,
    };
  }

  async findByCode(code: string) {
    return this.prisma.url.findFirst({
      where: { code, deletedAt: null },
    });
  }

  async registerClick(
    urlId: string,
    meta?: { ip?: string; userAgent?: string; referer?: string },
  ) {
    await this.prisma.$transaction([
      this.prisma.click.create({
        data: {
          urlId,
          ip: meta?.ip ?? null,
          userAgent: meta?.userAgent ?? null,
          referer: meta?.referer ?? null,
        },
      }),
      this.prisma.url.update({
        where: { id: urlId },
        data: { clickCount: { increment: 1 } },
      }),
    ]);
  }

  async getStats(code: string) {
    const url = await this.prisma.url.findUnique({
      where: { code },
      include: {
        clicks: true, 
      },
    });

    if (!url) {
      throw new Error('URL not found');
    }

    return {
      original: url.original,
      code: url.code,
      clickCount: url.clickCount,
      createdAt: url.createdAt,
      updatedAt: url.updatedAt,
      clicks: url.clicks?.map((c) => ({
        id: c.id,
        createdAt: c.createdAt,
      })),
    };
  }

  async listByUser(userId: string) {
    return this.prisma.url.findMany({
      where: { userId, deletedAt: null },
      select: {
        id: true,
        code: true,
        original: true,
        clickCount: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateOwnedUrl(id: string, userId: string, dto: UpdateUrlDto) {
    const url = await this.prisma.url.findFirst({
      where: { id, userId, deletedAt: null },
    });
    if (!url) throw new NotFoundException('URL not found or not owned by user');

    const updated = await this.prisma.url.update({
      where: { id },
      data: {
        ...(dto.original ? { original: dto.original } : {}),
      },
    });
    return updated;
  }

  async softDeleteOwnedUrl(id: string, userId: string) {
    const url = await this.prisma.url.findFirst({
      where: { id, userId, deletedAt: null },
    });
    if (!url) throw new NotFoundException('URL not found or not owned by user');

    await this.prisma.url.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
