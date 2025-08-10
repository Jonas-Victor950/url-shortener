import { IsNotEmpty, IsUrl } from 'class-validator';

export class CreateUrlDto {
  @IsUrl()
  @IsNotEmpty()
  originalUrl: string;
}