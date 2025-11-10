import { IsString, MinLength, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UserResetPasswordDto {
  @ApiProperty({ description: 'La nueva contraseña debe tener mínimo 8 caracteres' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  newPassword: string;
}