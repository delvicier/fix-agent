import { IsString, MinLength, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UserCreateDto {
  @ApiProperty({
    description: 'Nombre de usuario único',
    example: 'admin',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  usuario: string;

  @ApiProperty({
    description: 'Contraseña del usuario (mínimo 8 caracteres)',
    example: 'supersecret123',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  contraseña: string;
}