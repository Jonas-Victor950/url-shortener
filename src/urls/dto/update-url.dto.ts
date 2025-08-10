import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUrl } from 'class-validator';

export class UpdateUrlDto {
  @ApiPropertyOptional({ example: 'https://meu-novo-destino.com/path' })
  @IsOptional()
  @IsUrl()
  original?: string;
}
