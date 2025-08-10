import { Module } from '@nestjs/common';
import { UrlsService } from './urls.service';
import { UrlsController } from './urls.controller';
import { PrismaService } from 'prisma/prisma.service';
import { OptionalJwtAuthGuard } from 'src/auth/optional-jwt.guard';

@Module({
  controllers: [UrlsController],
  providers: [UrlsService, PrismaService, OptionalJwtAuthGuard],
})
export class UrlsModule {}
