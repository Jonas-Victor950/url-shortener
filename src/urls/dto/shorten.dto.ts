import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUrl } from 'class-validator';

export class ShortenDto {
  @ApiProperty({
    example:
      'https://teddy360.com.br/material/marco-legal-das-garantias-sancionado-entenda-o-que-muda/',
  })
  @IsUrl(
    { require_protocol: true },
    { message: 'URL precisa começar com http:// ou https://' },
  )
  @IsNotEmpty()
  originalUrl: string;
}
