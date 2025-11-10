import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Put,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UserCreateDto } from './dto/user-create.dto';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from './user.decorator';
import { User } from './user.entity';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { UserUpdateDto } from './dto/user-update.dto';
import { UserPasswordUpdateDto } from './dto/user-password-update.dto';
import { UserResetPasswordDto } from './dto/user-reset-password.dto';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('setup')
  @ApiBearerAuth('setup-token')
  @UseGuards(AuthGuard('jwt-setup'))
  @ApiOperation({ summary: 'Crear usuario administrador' })
  @ApiResponse({ status: 201, description: 'Usuario configurado, se devuelve un secret_key de recuperación.' })
  async setupUser(@Body() userCreateDto: UserCreateDto): Promise<{ message: string, secret_key: string }> {
    return this.userService.createOrUpdateUser(userCreateDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiResponse({ status: 200, description: 'Login exitoso, devuelve JWT.' })
  @ApiResponse({ status: 401, description: 'Credenciales incorrectas.' })
  async login(@Body() loginDto: UserCreateDto): Promise<{ access_token: string }> {
    return this.userService.login(loginDto);
  }

  @Get('profile')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Obtener el perfil del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Perfil del usuario.', type: User })
  async getProfile(@GetUser() user: User) {
    return this.userService.getProfile(user.id);
  }

  @Put('profile')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Actualizar perfil de usuario' })
  async updateProfile(
    @GetUser() user: User,
    @Body() userUpdateDto: UserUpdateDto,
  ) {
    return this.userService.updateUser(user.id, userUpdateDto);
  }

  @Put('password')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Actualizar contraseña' })
  async updatePassword(
    @GetUser() user: User,
    @Body() passwordDto: UserPasswordUpdateDto,
  ) {
    return this.userService.updatePassword(user.id, passwordDto);
  }

  @Post('recover')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reseteo de contraseña' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { secret_key: { type: 'string' } },
    },
  })
  @ApiResponse({ status: 200, description: 'Clave secret_key válida, se entrega token para reseteo.' })
  @ApiResponse({ status: 401, description: 'Secret key inválido.' })
  async recoverAccount(@Body('secret_key') secretKey: string): Promise<{ reset_token: string }> {
    return this.userService.createResetToken(secretKey);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt-reset'))
  @ApiOperation({ summary: 'Reseteo de contraseña' })
  @ApiResponse({ status: 200, description: 'Contraseña actualizada.' })
  @ApiResponse({ status: 401, description: 'Token de reseteo inválido o expirado.' })
  async resetPassword(
    @GetUser() user: User,
    @Body() resetDto: UserResetPasswordDto,
  ): Promise<{ message: string }> {
    return this.userService.resetPassword(user.id, resetDto);
  }
}